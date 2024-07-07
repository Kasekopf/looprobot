import {
  autosell,
  availableAmount,
  canAdventure,
  Effect,
  equip,
  equippedItem,
  Familiar,
  familiarEquippedEquipment,
  haveEffect,
  haveEquipped,
  Item,
  Location,
  logprint,
  myAdventures,
  myBasestat,
  myFullness,
  myHp,
  myLevel,
  myMaxhp,
  myMeat,
  myPath,
  myTurncount,
  numericModifier,
  print,
  printHtml,
  restoreHp,
  Slot,
  toUrl,
  use,
  visitUrl,
} from "kolmafia";
import { Task } from "./task";
import {
  $effect,
  $effects,
  $item,
  $items,
  $location,
  $locations,
  $monster,
  $monsters,
  $path,
  $skill,
  $slot,
  $slots,
  $stat,
  get,
  getTodaysHolidayWanderers,
  have,
  Macro,
  PropertiesManager,
  set,
  undelay,
  uneffect,
} from "libram";
import {
  Engine as BaseEngine,
  CombatResources,
  CombatStrategy,
  Outfit,
  OutfitSpec,
  step,
} from "grimoire-kolmafia";
import { CombatActions, MyActionDefaults } from "./combat";
import {
  cacheDress,
  canEquipResource,
  equipCharging,
  equipDefaults,
  equipFirst,
  equipInitial,
  equipUntilCapped,
  getModifiersFrom,
  setModeables,
} from "./outfit";
import { cliExecute, equippedAmount, itemAmount, runChoice } from "kolmafia";
import { atLevel, debug, YouRobot } from "../lib";
import {
  BackupTarget,
  backupTargets,
  canChargeVoid,
  CombatResource,
  forceItemSources,
  forceNCPossible,
  forceNCSources,
  freekillSources,
  getRunawaySources,
  refillLatte,
  shouldFinishLatte,
  unusedBanishes,
  WandererSource,
  wandererSources,
  yellowRaySources,
} from "./resources";
import { Priorities, Prioritization } from "./priority";
import { args } from "../args";
import { fastFlyerPossible, flyersDone } from "../tasks/level12";
import { globalStateCache } from "./state";
import { removeTeleportitis, teleportitisTask } from "../tasks/misc";
import { summonStrategy } from "../tasks/summons";
import { pullStrategy } from "../tasks/pulls";
import { keyStrategy } from "../tasks/keys";
import { applyEffects } from "./moods";
import { ROUTE_WAIT_TO_NCFORCE } from "../route";

export const wanderingNCs = new Set<string>([
  "Wooof! Wooooooof!",
  "Playing Fetch*",
  "A Pound of Cure",
  "Aunts not Ants",
  "Bath Time",
  "Beware of Aligator",
  "Delicious Sprouts",
  "Hypnotic Master",
  "Lost and Found",
  "Poetic Justice",
  "Summer Days",
  "Teacher's Pet",
]);

type ActiveTask = Task & {
  wanderer?: WandererSource;
  backup?: BackupTarget;
  active_priority?: Prioritization;
  other_effects?: Effect[];
};

type ScoredTask = {
  task: ActiveTask;
  score: number;
  index: number;
};

export class Engine extends BaseEngine<CombatActions, ActiveTask> {
  constructor(tasks: Task[], ignoreTasks: string[], completedTasks: string[]) {
    const ignore_set = new Set<string>(ignoreTasks.map((n) => n.trim()));
    const completed_set = new Set<string>(completedTasks.map((n) => n.trim()));
    // Completed tasks are always completed, ignored tasks are never ready
    tasks = tasks.map((task) => {
      if (completed_set.has(task.name)) return { ...task, completed: () => true };
      if (ignore_set.has(task.name)) return { ...task, ready: () => false };
      return task;
    });
    super(tasks, { combat_defaults: new MyActionDefaults() });

    for (const task of ignore_set) {
      if (!this.tasks_by_name.has(task)) debug(`Warning: Unknown ignoretask ${task}`);
    }
    for (const task of completed_set) {
      if (!this.tasks_by_name.has(task)) debug(`Warning: Unknown completedtask ${task}`);
    }
  }

  public hasDelay(task: Task): boolean {
    if (!task.delay) return false;
    if (!(task.do instanceof Location)) return false;
    return task.do.turnsSpent < undelay(task.delay);
  }

  public getNextTask(): ActiveTask | undefined {
    this.updatePlan();
    const available_tasks = this.tasks.filter((task) => this.available(task));

    if (myPath() !== $path`You, Robot`) return undefined; // Prism broken

    if (args.debug.warby <= myTurncount()) verifyWarStarted();

    // Teleportitis overrides all
    if (have($effect`Teleportitis`)) {
      const teleportitis = teleportitisTask(this, this.tasks);
      if (teleportitis.completed() && removeTeleportitis.ready()) {
        return {
          ...removeTeleportitis,
          active_priority: Prioritization.fixed(Priorities.Always),
        };
      }
      return { ...teleportitis, active_priority: Prioritization.fixed(Priorities.Always) };
    }

    // First, check for any heavily prioritized tasks
    const priority = available_tasks.find((task) => {
      const priority = task.priority?.();
      return priority === Priorities.LastCopyableMonster || priority === Priorities.Free;
    });
    if (priority !== undefined) {
      return {
        ...priority,
      };
    }

    // If a backup target is up try to place it in a useful location
    const backup = backupTargets.find(
      (target) => !target.completed() && target.monster === get("lastCopyableMonster")
    );
    if (backup && have($item`backup camera`) && get("_backUpUses") < 16) {
      const backup_outfit = undelay(backup.outfit) ?? {};
      if ("equip" in backup_outfit) backup_outfit.equip?.push($item`backup camera`);
      else backup_outfit.equip = [$item`backup camera`];

      const possible_locations = available_tasks.filter(
        (task) =>
          (this.hasDelay(task) || undelay(task.killdelayzone)) &&
          this.createOutfit(task).canEquip(backup_outfit)
      );
      if (possible_locations.length > 0) {
        if (args.debug.verbose) {
          printHtml(
            `A backup target (${backup.monster}) is available to place in a delay zone. Available zones:`
          );
          for (const task of possible_locations) {
            printHtml(`${task.name}`);
          }
        }
        return {
          ...possible_locations[0],
          active_priority: Prioritization.fixed(Priorities.Wanderer),
          backup: backup,
        };
      } else if (!new Outfit().canEquip(backup_outfit)) {
        logprint(`Backup ${backup.monster} is ready but we cannot equip its outfit`);
      } else {
        logprint(`Backup ${backup.monster} is ready but no tasks have delay`);
        if (backup.monster !== $monster`Eldritch Tentacle`)
          return {
            name: `Backup ${backup.monster}`,
            completed: () => false,
            do: $location`Noob Cave`,
            active_priority: Prioritization.fixed(Priorities.Wanderer),
            backup: backup,
            limit: { tries: backup.limit_tries },
          };
      }
    }

    // If a wanderer is up try to place it in a useful location
    const wanderer = wandererSources.find((source) => source.available() && source.chance() === 1);
    if (wanderer) {
      // prefer locations where a kill is especially good
      const best_possible_locations = available_tasks.filter(
        (task) => undelay(task.killdelayzone) && canEquipResource(this.createOutfit(task), wanderer)
      );
      if (best_possible_locations.length > 0) {
        if (args.debug.verbose) {
          printHtml(
            `A wanderer (${wanderer.name}) is available to place in a delay zone. Available kill-preferred zones:`
          );
          for (const task of best_possible_locations) {
            printHtml(`${task.name}`);
          }
        }
        return {
          ...best_possible_locations[0],
          active_priority: Prioritization.fixed(Priorities.Wanderer),
          wanderer: wanderer,
        };
      }

      // otherwise, drop the wanderer in a delay location
      const possible_locations = available_tasks.filter(
        (task) => this.hasDelay(task) && canEquipResource(this.createOutfit(task), wanderer)
      );
      if (possible_locations.length > 0) {
        if (args.debug.verbose) {
          printHtml(
            `A wanderer (${wanderer.name}) is available to place in a delay zone. Available zones:`
          );
          for (const task of possible_locations) {
            printHtml(`${task.name}`);
          }
        }
        return {
          ...possible_locations[0],
          active_priority: Prioritization.fixed(Priorities.Wanderer),
          wanderer: wanderer,
        };
      } else {
        logprint(`Wanderer ${wanderer.name} is ready but no tasks have delay`);
      }
    }

    // Finally, choose from all available tasks
    const task_priorities = available_tasks.map((task) => {
      return { ...task, active_priority: Prioritization.from(task) };
    });

    // Sort tasks in a stable way, by priority and then by route
    const scored_tasks: ScoredTask[] = [];
    for (let i = 0; i < task_priorities.length; i++) {
      scored_tasks.push({
        task: task_priorities[i],
        score: task_priorities[i].active_priority.score(),
        index: i,
      });
    }
    scored_tasks.sort((a, b) => {
      if (a.score === b.score) return a.index - b.index;
      return b.score - a.score;
    });
    if (args.debug.verbose) {
      printHtml("");
      printHtml("Available Tasks:");
      for (const scored_task of scored_tasks) {
        const name = scored_task.task.name;
        const reason = scored_task.task.active_priority?.explainWithColor() ?? "Available";
        const score = scored_task.score;
        printHtml(`<u>${name}</u>: ${reason} <font color='#888888'>(${score})</font>`);
      }
      printHtml("");
    }
    if (scored_tasks.length > 0) return scored_tasks[0].task;

    // No next task
    return undefined;
  }

  public execute(task: ActiveTask): void {
    debug(``);
    const reason = task.active_priority?.explain() ?? "";
    const why = reason === "" ? "Route" : reason;
    debug(`Executing ${task.name} [${why}]`, "blue");
    this.checkLimits(
      { ...task, limit: { ...task.limit, unready: false, completed: false } },
      () => true
    ); // ignore unready for this initial check
    if (myAdventures() <= args.debug.halt && myTurncount() >= 1) throw `Running out of adventures!`;

    // Copied from grimoire, to remove the extra printout
    // Determine the proper postcondition for after the task executes.
    const postcondition = task.limit?.guard?.();

    // Acquire any items and effects first, possibly for later execution steps.
    this.acquireItems(task);
    this.acquireEffects(task);

    // Prepare the outfit, with resources.
    const task_combat = task.combat?.clone() ?? new CombatStrategy<CombatActions>();
    const outfit = this.createOutfit(task);

    const task_resources = new CombatResources<CombatActions>();
    this.customize(task, outfit, task_combat, task_resources);
    this.dress(task, outfit);

    // Prepare combat and choices
    this.setCombat(task, task_combat, task_resources);
    this.setChoices(task, this.propertyManager);

    // Actually perform the task
    for (const resource of task_resources.all()) resource.prepare?.();
    this.prepare(task);
    this.do(task);
    while (this.shouldRepeatAdv(task)) {
      set("lastEncounter", "");
      this.do(task);
    }
    this.post(task);

    // Mark that we tried the task, and apply limits
    this.markAttempt(task);
    this.checkLimits(task, postcondition);
    // End copy

    if (task.completed()) {
      debug(`${task.name} completed!`, "blue");
    } else if (!(task.ready?.() ?? true)) {
      debug(`${task.name} not completed! [Again? Not ready]`, "blue");
    } else {
      const priority_explain = Prioritization.from(task).explain();
      if (priority_explain !== "") {
        debug(`${task.name} not completed! [Again? ${priority_explain}]`, "blue");
      } else {
        debug(`${task.name} not completed!`, "blue");
      }
    }
  }

  customize(
    task: ActiveTask,
    outfit: Outfit,
    combat: CombatStrategy<CombatActions>,
    resources: CombatResources<CombatActions>
  ): void {
    const wanderers = task.wanderer ? [task.wanderer] : [];
    for (const wanderer of wanderers) {
      if (!equipFirst(outfit, [wanderer]))
        throw `Wanderer equipment ${wanderer.equip} conflicts with ${task.name}`;
    }

    // Setup a backup
    if (task.backup && args.minor.skipbackups !== true) {
      if (!outfit.equip($item`backup camera`)) throw `Cannot force backup camera on ${task.name}`;
      if (task.backup.outfit && !outfit.equip(undelay(task.backup.outfit)))
        throw `Cannot match equip for backup ${task.backup.monster} on ${task.name}`;
      outfit.equip({ avoid: $items`carnivorous potted plant` });
      combat.startingMacro(
        Macro.if_(
          "!monsterid 49",
          Macro.trySkill($skill`Back-Up to your Last Enemy`).step(task.backup.combat ?? new Macro())
        )
      );
      combat.action("killHard");
    }

    if (undelay(task.freeaction)) {
      // Prepare only as requested by the task
      return;
    }

    // Determine if it is useful to target monsters with an orb (with no predictions).
    // 0. If we have a good orb prediction to cash in on, then use an orb for it.
    // 1. If task.orbtargets is undefined, then use an orb if there are absorb targets.
    // 2. If task.orbtargets() is undefined, an orb is detrimental in this zone, do not use it.
    // 3. Otherwise, use an orb if task.orbtargets() is nonempty, or if there are absorb targets.
    const banish_state = globalStateCache.banishes();
    const orbUsefulFromGoodOrb =
      wanderers.length === 0 &&
      task.active_priority?.has(Priorities.GoodOrb) &&
      (!combat.can("banish") || !banish_state.isFullyBanished(task));
    const orb_targets = task.orbtargets?.() ?? [];
    const orbUsefulFromPotential = orb_targets.length > 0 && !outfit.skipDefaults;
    // Equip initial equipment
    equipInitial(outfit, (orbUsefulFromGoodOrb || orbUsefulFromPotential) ?? false);

    // Prepare combat macro
    if (combat.getDefaultAction() === undefined) combat.action("ignore");

    // Use rock-band flyers if needed
    const blacklist = new Set<Location>(
      $locations`The Copperhead Club, The Black Forest, Oil Peak, The Defiled Cranny, The Haunted Boiler Room, The Outskirts of Cobb's Knob, The Spooky Forest`
    );
    const monster_blacklist = [
      ...getTodaysHolidayWanderers(),
      $monster`sausage goblin`,
      $monster`ninja snowman assassin`,
      $monster`Protagonist`,
      $monster`Quantum Mechanic`,
      $monster`government bureaucrat`,
      $monster`terrible mutant`,
      $monster`angry ghost`,
      $monster`annoyed snake`,
      $monster`slime blob`,
      $monster`Astrologer of Shub-Jigguwatt`,
    ];
    if (get("camelSpit") === 100) monster_blacklist.push($monster`Camel's Toe`); // we will spit
    if (
      have($item`rock band flyers`) &&
      !fastFlyerPossible() &&
      !flyersDone() &&
      (!(task.do instanceof Location) || !blacklist.has(task.do)) &&
      task.name !== "Misc/Protonic Ghost"
    ) {
      const stuncape: OutfitSpec = {
        back: $item`unwrapped knock-off retro superhero cape`,
        modes: { retrocape: ["heck", "hold"] },
      };
      if (get("lovebugsUnlocked") || outfit.canEquip(stuncape)) {
        if (!get("lovebugsUnlocked")) outfit.equip(stuncape);
        combat.macro(
          new Macro().if_(
            `!hpbelow 50 && ${monster_blacklist.map((m) => `!monsterid ${m.id}`).join(" && ")}`,
            new Macro().trySkill($skill`Summon Love Gnats`).tryItem($item`rock band flyers`)
          ),
          undefined,
          true
        );
      }
    }

    // Use red rocket to boost food stats
    if (
      have($item`red rocket`) &&
      myFullness() === 0 &&
      myTurncount() > 1 &&
      !have($effect`Everything Looks Red`)
    ) {
      combat.macro(new Macro().tryItem($item`red rocket`), undefined, true);
    }

    if (wanderers.length === 0) {
      // Set up a banish if needed

      if (combat.can("yellowRay") && !have($effect`Everything Looks Yellow`)) {
        resources.provide("yellowRay", equipFirst(outfit, yellowRaySources));
      }
      let force_item_source: CombatResource | undefined = undefined;
      if (combat.can("forceItems")) {
        force_item_source = equipFirst(outfit, forceItemSources);
        if (force_item_source === undefined && !have($effect`Everything Looks Yellow`))
          force_item_source = equipFirst(outfit, yellowRaySources);
        resources.provide("forceItems", force_item_source);
      }

      if (combat.can("banish") && !banish_state.isFullyBanished(task)) {
        const available_tasks = this.tasks.filter((task) => this.available(task));
        const banishSources = unusedBanishes(banish_state, available_tasks);
        if (task.name === "Hidden City/Bowling") {
          // VERY HARDCODED BACK HACK to make sure we don't allocate the bowling ball
          // when we are about to throw it.
          const nonBowlingBanishSources = banishSources.filter((b) => b.name !== "Bowl Curveball");
          resources.provide("banish", equipFirst(outfit, nonBowlingBanishSources));
        } else {
          resources.provide("banish", equipFirst(outfit, banishSources));
        }
        debug(
          `Banish targets: ${combat
            .where("banish")
            .filter((monster) => !banish_state.already_banished.has(monster))
            .join(", ")}`
        );
        debug(
          `Banishes available: ${Array.from(banishSources)
            .map((b) => ("tracker" in b ? b.tracker : b.do))
            .join(", ")}`
        );
      }

      // Don't equip the orb if we have a bad target
      if (task.active_priority?.has(Priorities.BadOrb)) {
        outfit.equip({ avoid: $items`miniature crystal ball` });
        if (outfit.equips.get($slot`familiar`) === $item`miniature crystal ball`) {
          outfit.equips.delete($slot`familiar`);
        }
      }

      // Equip an orb if we have a good target.
      // (If we have banished all the bad targets, there is no need to force an orb)
      if (orbUsefulFromGoodOrb) {
        outfit.equip($item`miniature crystal ball`);
      }

      // Set up a runaway if there are combats we do not care about
      if (!outfit.skipDefaults) {
        const runawaySources = getRunawaySources(task.do instanceof Location ? task.do : undefined);
        let runaway = undefined;
        if (combat.can("ignore") || combat.can("ignoreSoftBanish")) {
          runaway = equipFirst(outfit, runawaySources);
          resources.provide("ignore", runaway);
          resources.provide("ignoreSoftBanish", runaway);
        }
        if (combat.can("ignoreNoBanish") && myLevel() >= 11) {
          if (runaway !== undefined && !runaway.banishes)
            resources.provide("ignoreNoBanish", runaway);
          else {
            runaway = equipFirst(
              outfit,
              runawaySources.filter((source) => !source.banishes)
            );
            resources.provide("ignoreNoBanish", runaway);
          }
        }
      }

      // Set up a free kill if needed, or if no free kills will ever be needed again
      // (when we have expensive buffs running)
      if (
        combat.can("killFree") ||
        ((combat.can("kill") || combat.can("killItem")) &&
          !task.boss &&
          this.tasks.every((t) => t.completed() || !t.combat?.can("killFree")) &&
          (haveEffect($effect`Shadow Waters`) || step("questL07Cyrptic") >= 1))
      ) {
        resources.provide("killFree", equipFirst(outfit, freekillSources));
      }

      // Use an NC forcer if one is available and another task needs it.
      const ncLocationBanlist = new Set<Location>(
        $locations`The Enormous Greater-Than Sign, The Copperhead Club, The Black Forest`
      );
      const ncTaskBanlist = new Set<string>(["Misc/Protonic Ghost", "War/Flyers Fast"]);
      const ncMonsterBanlist = $monsters`Batsnake, Frozen Solid Snake, ninja snowman assassin`;
      if (
        forceNCPossible() &&
        !(task.do instanceof Location && ncLocationBanlist.has(task.do)) &&
        !ncTaskBanlist.has(task.name) &&
        !have($effect`Teleportitis`) &&
        force_item_source?.equip !== $item`Fourth of May Cosplay Saber` &&
        !get("noncombatForcerActive")
      ) {
        if (
          myTurncount() >= ROUTE_WAIT_TO_NCFORCE &&
          this.tasks.find(
            (t) =>
              t.ncforce !== undefined &&
              this.available(t) &&
              t.name !== task.name &&
              undelay(t.ncforce)
          ) !== undefined
        ) {
          const ncforcer = equipFirst(outfit, forceNCSources);
          if (ncforcer) {
            const ncForce = Macro.if_(
              ncMonsterBanlist.map((m) => `!monsterid ${m.id}`).join(" && "),
              ncforcer.do
            );
            combat.macro(ncForce, undefined, true);
          }
        }
      }
    }

    if (
      wanderers.length === 0 &&
      this.hasDelay(task) &&
      !get("noncombatForcerActive") &&
      !task.backup
    )
      wanderers.push(...equipUntilCapped(outfit, wandererSources));

    const mightKillSomething =
      task.wanderer !== undefined ||
      task.combat?.can("kill") ||
      task.combat?.can("killHard") ||
      task.combat?.can("killItem") ||
      task.combat?.can("killFree") ||
      task.combat?.can("forceItems") ||
      task.combat?.can("yellowRay") ||
      (!resources.has("ignore") && !resources.has("banish"));
    equipCharging(outfit, mightKillSomething ?? false, task.nofightingfamiliars ?? false);

    const mightKillSomethingEasy =
      task.wanderer === undefined && (task.combat?.can("kill") || task.combat?.can("killItem"));
    if (mightKillSomethingEasy && !have($effect`Everything Looks Red`))
      outfit.equip($item`Everfull Dart Holster`);

    if (get("noncombatForcerActive")) {
      // Avoid some things that might override the NC and break the tracking
      outfit.equip({ avoid: $items`Kramco Sausage-o-Matic™` });
    }

    // Prepare full outfit
    if (!outfit.skipDefaults) {
      const freecombat = task.freecombat || wanderers.find((wanderer) => wanderer.chance() === 1);
      const modifier = getModifiersFrom(outfit);

      const glass_useful =
        canChargeVoid() &&
        !modifier.includes("-combat") &&
        !freecombat &&
        ((combat.can("kill") && !resources.has("killFree")) || combat.can("killHard") || task.boss);
      if (glass_useful && get("_voidFreeFights") < 5) outfit.equip($item`cursed magnifying glass`);
      if (!task.boss && !freecombat && !modifier.includes("-combat") && !modifier.includes("ML"))
        outfit.equip($item`carnivorous potted plant`);
      if (glass_useful) outfit.equip($item`cursed magnifying glass`);
    }

    if (orbUsefulFromPotential) {
      outfit.equip($item`miniature crystal ball`);
    }

    equipDefaults(outfit, task.nofightingfamiliars ?? false);
    setModeables(outfit);

    // Kill wanderers
    for (const wanderer of wanderers) {
      for (const monster of undelay(wanderer.monsters)) {
        if (combat.currentStrategy(monster) !== "killHard") {
          combat.action("killHard", monster);
          if (wanderer.action) combat.macro(wanderer.action, monster);
        }
      }
    }

    // Kill holiday wanderers
    const holidayMonsters = getTodaysHolidayWanderers();
    // TODO: better detection of which zones holiday monsters can appear
    if (holidayMonsters.length > 0 && !task.boss) combat.action("ignore", ...holidayMonsters);

    // Upgrade normal kills to free kills if provided
    if (resources.has("killFree") && !task.boss) {
      combat.action(
        "killFree",
        (combat.where("kill") ?? []).filter((mon) => !mon.boss)
      );
      combat.action(
        "killFree",
        (combat.where("killItem") ?? []).filter((mon) => !mon.boss)
      );
      if (combat.getDefaultAction() === "kill") combat.action("killFree");
      if (combat.getDefaultAction() === "killItem") combat.action("killFree");
    }
  }

  createOutfit(task: Task): Outfit {
    const spec = undelay(task.outfit);
    const outfit = new Outfit();

    // Block equipment slots that we cannot actually use
    if (!YouRobot.canUseFamiliar()) outfit.equip(Familiar.none);
    for (const slot of $slots`hat, weapon, off-hand, pants, shirt`) {
      if (!YouRobot.canUse(slot)) outfit.equip(Item.none, slot);
    }

    if (spec !== undefined) outfit.equip(spec); // no error on failure
    return outfit;
  }

  /**
   * Acquire all effects for the task.
   * @param _task The current executing task.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  acquireEffects(task: ActiveTask): void {
    // Do nothing; effects will be added in dress instead
  }

  dress(task: ActiveTask, outfit: Outfit): void {
    const effects: Effect[] = undelay(task.effects) ?? [];
    const other_effects = task.other_effects ?? [];
    applyEffects(outfit.modifier.join(","), [...effects, ...other_effects]);

    try {
      cacheDress(outfit);
    } catch {
      // If we fail to dress, this is maybe just a mafia desync.
      // So refresh our inventory and try again (once).
      debug("Possible mafia desync detected; refreshing...");
      cliExecute("refresh all");
      // Do not try and cache-dress
      outfit.dress();
    }
    if (!get("backupCameraReverserEnabled")) {
      cliExecute("backupcamera reverser on");
    }

    const equipped = [...new Set(Slot.all().map((slot) => equippedItem(slot)))];
    if (args.debug.verboseequip) {
      print(`Equipped: ${equipped.join(", ")}`);
    } else {
      logprint(`Equipped: ${equipped.join(", ")}`);
    }
    logModifiers(outfit);

    if (undelay(task.freeaction)) {
      // Prepare only as requested by the task
      return;
    }

    // HP/MP upkeep
    if (
      (have($effect`Once-Cursed`) || have($effect`Twice-Cursed`) || have($effect`Thrice-Cursed`)) &&
      get("hiddenApartmentProgress") < 7
    ) {
      this.propertyManager.set({
        hpAutoRecoveryItems: ensureRecovery("hpAutoRecoveryItems", [], ["relaxing hot tub"]),
      });
    } else {
      this.propertyManager.set({
        hpAutoRecoveryItems: ensureRecovery("hpAutoRecoveryItems", ["relaxing hot tub"], []),
      });
    }
    if (myHp() < 60 && myHp() < myMaxhp()) restoreHp(myMaxhp() < 60 ? myMaxhp() : 60);

    // Equip stillsuit
    if (
      have(args.minor.stillsuit) &&
      (itemAmount($item`tiny stillsuit`) > 0 ||
        (availableAmount($item`tiny stillsuit`) > 0 &&
          !haveEquipped($item`tiny stillsuit`) &&
          familiarEquippedEquipment(args.minor.stillsuit) !== $item`tiny stillsuit`))
    ) {
      equip(args.minor.stillsuit, $item`tiny stillsuit`);
    }
  }

  setChoices(task: ActiveTask, manager: PropertiesManager): void {
    super.setChoices(task, manager);
    if (equippedAmount($item`June cleaver`) > 0) {
      this.propertyManager.setChoices({
        // June cleaver noncombats
        1467: 3, // +adv
        1468: get("_juneCleaverSkips", 0) < 5 ? 4 : 1,
        1469: get("_juneCleaverSkips", 0) < 5 ? 4 : 3,
        1470: 2, // teacher's pen
        1471: get("_juneCleaverSkips", 0) < 5 ? 4 : 1,
        1472: get("_juneCleaverSkips", 0) < 5 ? 4 : 2,
        1473: get("_juneCleaverSkips", 0) < 5 ? 4 : 2,
        1474: get("_juneCleaverSkips", 0) < 5 ? 4 : 2,
        1475: get("_juneCleaverSkips", 0) < 5 ? 4 : 1,
      });
    }
    this.propertyManager.set({ stillsuitFamiliar: args.minor.stillsuit });
  }

  setCombat(
    task: ActiveTask,
    task_combat: CombatStrategy<CombatActions>,
    task_resources: CombatResources<CombatActions>
  ): void {
    // Always be ready to fight possible wanderers, even if we didn't equip
    // things on purpose, e.g. if we equip Kramco for +item.
    for (const wanderer of wandererSources) {
      if (wanderer.possible()) {
        for (const monster of undelay(wanderer.monsters)) {
          if (task_combat.currentStrategy(monster) !== "killHard") {
            task_combat.action("killHard", monster);
            if (wanderer.action) task_combat.macro(wanderer.action, monster);
          }
        }
        wanderer.prepare?.();
      }
    }

    // The carn potted plant may kill the enemy early,
    // so set up the normal combat as an autoattack.
    if (haveEquipped($item`carnivorous potted plant`)) {
      const macro = task_combat.compile(
        task_resources,
        this.options?.combat_defaults,
        task.do instanceof Location ? task.do : undefined
      );
      task_combat.autoattack(macro);
    }

    super.setCombat(task, task_combat, task_resources);
  }

  do(task: ActiveTask): void {
    const beaten_turns = haveEffect($effect`Beaten Up`);
    const start_advs = myAdventures();

    super.do(task);

    // Crash if we unexpectedly lost the fight
    if (
      !undelay(task.expectbeatenup) &&
      have($effect`Beaten Up`) &&
      haveEffect($effect`Beaten Up`) < 5
    ) {
      // Poetic Justice gives 5
      if (
        haveEffect($effect`Beaten Up`) > beaten_turns || // Turns of beaten-up increased, so we lost
        (haveEffect($effect`Beaten Up`) === beaten_turns &&
          // Turns of beaten-up was constant but adventures went down, so we lost fight while already beaten up
          myAdventures() < start_advs)
      ) {
        print(
          `Fight was lost (debug info: ${beaten_turns} => ${haveEffect(
            $effect`Beaten Up`
          )}, (${start_advs} => ${myAdventures()}); stop.`
        );
        throw `Fight was lost (debug info: ${beaten_turns} => ${haveEffect(
          $effect`Beaten Up`
        )}, (${start_advs} => ${myAdventures()}); stop.`;
      }
    }
  }

  post(task: ActiveTask): void {
    super.post(task);

    // Try to fix evil tracking after backing up
    if (get("lastCopyableMonster") === $monster`giant swarm of ghuol whelps`) visitUrl("crypt.php");

    if (
      task.active_priority?.has(Priorities.BadOrb) &&
      !haveEquipped($item`miniature crystal ball`)
    )
      resetBadOrb();
    if (get("_latteBanishUsed") && shouldFinishLatte()) refillLatte();
    autosellJunk();
    for (const poisoned of $effects`Hardly Poisoned at All, A Little Bit Poisoned, Somewhat Poisoned, Really Quite Poisoned, Majorly Poisoned, Toad In The Hole`) {
      if (have(poisoned)) uneffect(poisoned);
    }
    globalStateCache.invalidate();
  }

  initPropertiesManager(manager: PropertiesManager): void {
    super.initPropertiesManager(manager);
    manager.set({
      louvreGoal: 7,
      louvreDesiredGoal: 7,
      requireBoxServants: false,
      autoAbortThreshold: "-0.05",
      recoveryScript: "",
      removeMalignantEffects: false,
      choiceAdventureScript: "looprobot_choice.ash",
      mpAutoRecoveryItems: ensureRecovery(
        "mpAutoRecoveryItems",
        ["black cherry soda", "doc galaktik's invigorating tonic"],
        [
          "rest in your campaway tent",
          "rest at the chateau",
          "rest at your campground",
          "sleep on your clan sofa",
        ]
      ),
      hpAutoRecoveryItems: ensureRecovery(
        "hpAutoRecoveryItems",
        ["scroll of drastic healing", "doc galaktik's homeopathic elixir"],
        [
          "rest in your campaway tent",
          "rest at the chateau",
          "rest at your campground",
          "sleep on your clan sofa",
          "gauze garter",
          "filthy poultice",
        ]
      ),
    });
    manager.setChoices({
      1106: 3, // Ghost Dog Chow
      1107: 1, // tennis ball
      1340: 3, // Is There A Doctor In The House?
      1341: 1, // Cure her poison
    });
  }

  updatePlan(): void {
    // Note order matters for these strategy updates
    globalStateCache.invalidate();
    summonStrategy.update(); // Update summon plan with current state
    keyStrategy.update(); // Update key plan with current state
    pullStrategy.update(); // Update pull plan with current state
  }
}

function autosellJunk(): void {
  if (myPath() !== $path`You, Robot`) return; // final safety
  if (myMeat() >= 10000) return;
  if (myTurncount() >= 1000) return; // stop after breaking ronin
  if (have($item`pork elf goodies sack`)) use($item`pork elf goodies sack`);
  if (have($item`MayDay™ supply package`)) use($item`MayDay™ supply package`);

  // Sell junk items
  const junk = $items`hamethyst, baconstone, meat stack, dense meat stack, facsimile dictionary, space blanket, 1\,970 carat gold, black snake skin, demon skin, hellion cube, adder bladder, weremoose spit, Knob Goblin firecracker, wussiness potion, diamond-studded cane, Knob Goblin tongs, Knob Goblin scimitar, eggbeater, red-hot sausage fork, Knob Goblin pants, awful poetry journal, black pixel, pile of dusty animal bones, 1952 Mickey Mantle card, liquid ice, fat stacks of cash, juniper berries, peach, pear, plum`;
  for (const item of junk) {
    if (have(item)) autosell(item, itemAmount(item));
  }

  // Use wallets
  const wallets = $items`ancient vinyl coin purse, black pension check, old leather wallet, Gathered Meat-Clip, old coin purse`;
  for (const item of wallets) {
    if (have(item)) use(item, itemAmount(item));
  }

  // Sell a few other items if we have to
  const lastresorts = $items`keg shield, perforated battle paddle, bottle opener belt buckle, beer bomb, Kokomo Resort Pass, giant pinky ring, Eye Agate, Azurite, Lapis Lazuli`;
  for (const item of lastresorts) {
    if (myMeat() >= 1000) return;
    if (have(item)) autosell(item, itemAmount(item));
  }
}

function resetBadOrb(): boolean {
  if (get("hiddenBowlingAlleyProgress") !== 8) return false;

  const shrine = $location`An Overgrown Shrine (Southeast)`;

  if (!canAdventure(shrine)) return false;

  if (get("_juneCleaverFightsLeft") === 0 && haveEquipped($item`June cleaver`))
    cliExecute("unequip june cleaver");

  try {
    const encounter = visitUrl(toUrl(shrine));
    if (!encounter.includes("Fire When Ready")) {
      print("Unable to stare longingly at a shrine ball cradle");
    }
    // Walk away
    runChoice(6);
    return true;
  } catch (e) {
    print(`We ran into an issue when gazing at a shrine for balls: ${e}.`, "red");
  }

  return false;
}

function ensureRecovery(property: string, items: string[], avoid: string[]): string {
  const recovery_property = get(property).split(";");
  for (const item of items) {
    if (!recovery_property.includes(item)) {
      recovery_property.push(item);
    }
  }
  return recovery_property.filter((v) => !avoid.includes(v)).join(";");
}

const modifierNames: { [name: string]: string } = {
  combat: "Combat Rate",
  item: "Item Drop",
  meat: "Meat Drop",
  ml: "Monster Level",
  "stench res": "Stench Resistance",
  "hot res": "Hot Resistance",
  "cold res": "Cold Resistance",
  "spooky res": "Spooky Resistance",
  "sleaze res": "Sleaze Resistance",
  init: "Initiative",
  "booze drop": "Booze Drop",
  "food drop": "Food Drop",
  da: "Damage Absorption",
};

function logModifiers(outfit: Outfit) {
  const maximizer = outfit.modifier.join(",").toLowerCase();
  for (const modifier of Object.keys(modifierNames)) {
    if (maximizer.includes(modifier)) {
      const name = modifierNames[modifier];
      const value = numericModifier(modifierNames[modifier]);
      logprint(`= ${name}: ${value}`);
    }
  }
}

function verifyWarStarted() {
  if (step("questL12War") >= 1) return;

  const failReasons = [];
  if (!atLevel(70)) failReasons.push("Not at level 12");
  if (!myBasestat($stat`Mysticality`)) failReasons.push("Myst is not at 70");
  if (!myBasestat($stat`Moxie`)) failReasons.push("Moxie is not at 70");
  if (
    !have($item`beer helmet`) ||
    !have($item`distressed denim pants`) ||
    !have($item`bejeweled pledge pin`)
  )
    failReasons.push("No war outfit");
  if (step("questL10Garbage") >= 9) failReasons.push("Castle top not ready");
  if (failReasons.length === 0 && !YouRobot.canUse($slot`hat`))
    failReasons.push("Not switched to hat");
  if (failReasons.length === 0 && step("questL12War") >= 1)
    failReasons.push("Not enraging the war");
  if (failReasons.length === 0) failReasons.push("No idea");

  const baseMessage = `You are at turn ${myTurncount()} but you have not started the war! War is supposed to start around turn 110. Please investigate why.`;
  const failReasonsMessage = `${failReasons.join(". ")}.`;
  logprint(`Failed to start war by ${myTurncount()}: ${failReasonsMessage}`);
  throw `${baseMessage} Problem hint: ${failReasonsMessage}`;
}
