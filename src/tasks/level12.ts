import {
  cliExecute,
  effectModifier,
  equippedAmount,
  haveEquipped,
  Item,
  itemAmount,
  monkeyPaw,
  myBasestat,
  myHp,
  myMaxhp,
  myTurncount,
  restoreHp,
  retrieveItem,
  runCombat,
  sell,
  use,
  visitUrl,
} from "kolmafia";
import {
  $coinmaster,
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  $slot,
  $stat,
  AutumnAton,
  ensureEffect,
  get,
  have,
  Macro,
  set,
} from "libram";
import { Priority, Quest, Task } from "../engine/task";
import { Guards, OutfitSpec, step } from "grimoire-kolmafia";
import { Priorities } from "../engine/priority";
import { CombatStrategy, killMacro } from "../engine/combat";
import { atLevel, debug, YouRobot } from "../lib";
import { forceItemPossible, yellowRayPossible } from "../engine/resources";
import { args, toTempPref } from "../args";
import { customRestoreMp, fillHp } from "../engine/moods";

export function flyersDone(buffer = 50): boolean {
  return get("flyeredML") >= 10000 + buffer;
}

export function fastFlyerPossible(): boolean {
  if (args.minor.flyer) return false;
  if (!have($item`pocket wish`)) return false;
  return true;
}

const warHeroes = [
  $monster`C.A.R.N.I.V.O.R.E. Operative`,
  $monster`Glass of Orange Juice`,
  $monster`Neil`,
  $monster`Slow Talkin' Elliot`,
  $monster`Zim Merman`,
  $monster`Brutus, the toga-clad lout`,
  $monster`Danglin' Chad`,
  $monster`Monty Basingstoke-Pratt, IV`,
  $monster`Next-generation Frat Boy`,
  $monster`War Frat Streaker`,
];

function warOutfit(): Item[] {
  if (args.minor.hippy)
    return $items`reinforced beaded headband, bullet-proof corduroys, round purple sunglasses`;
  return $items`beer helmet, distressed denim pants, bejeweled pledge pin`;
}

function warFlyer(): Item {
  if (args.minor.hippy) return $item`jam band flyers`;
  else return $item`rock band flyers`;
}

function flyersTasks(after: string[]): Task[] {
  return [
    {
      name: "Flyers Start",
      after: after,
      ready: () => YouRobot.canUse($slot`hat`),
      completed: () => have(warFlyer()) || get("sidequestArenaCompleted") !== "none",
      outfit: { equip: warOutfit() },
      do: (): void => {
        visitUrl("bigisland.php?place=concert&pwd");
      },
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Flyers Fast",
      after: ["Flyers Start"],
      ready: () => fastFlyerPossible() && (YouRobot.canUseFamiliar() || myTurncount() > 200),
      completed: () => flyersDone(),
      do: () => {
        retrieveItem($item`hair spray`);
        cliExecute(`genie monster ice cube`);
        visitUrl("main.php");
      },
      outfit: {
        equip: $items`unwrapped knock-off retro superhero cape`,
      },
      combat: new CombatStrategy()
        .macro(Macro.tryItem(warFlyer()).tryItem($item`hair spray`))
        .kill(),
      limit: { tries: 1 },
    },
    {
      name: "Flyers End",
      after: ["Flyers Start"],
      priority: () => Priorities.Free,
      ready: () => flyersDone() && YouRobot.canUse($slot`hat`), // Buffer for mafia tracking
      completed: () => get("sidequestArenaCompleted") !== "none",
      outfit: { equip: warOutfit() },
      do: (): void => {
        visitUrl("bigisland.php?place=concert&pwd");
        cliExecute("refresh inv");
        if (have(warFlyer())) {
          debug("Mafia tracking was incorrect for rock band flyers; continuing to flyer...");
          set(
            toTempPref("flyeredML_buffer"),
            get(toTempPref("flyeredML_buffer"), 0) + (get("flyeredML") - 9900)
          );
          set("flyeredML", 9900);
        } else if (get(toTempPref("flyeredML_buffer"), 0) > 0) {
          const real = get("flyeredML") + get(toTempPref("flyeredML_buffer"), 0);
          debug(`Mafia tracking was incorrect for rock band flyers; quest completed at ${real}`);
        }
      },
      freeaction: true,
      limit: {
        soft: 10,
        message: "See https://kolmafia.us/threads/flyeredml-tracking-wrong.27567/",
      },
    },
  ];
}

function lighthouseTasks(after: string[]): Task[] {
  return [
    // Saber into more lobsterfrogmen
    // Or backup into the Boss Bat's lair
    {
      name: "Lighthouse",
      after: after,
      ready: () => step("questL04Bat") >= 3 || have($item`Fourth of May Cosplay Saber`),
      completed: () =>
        itemAmount($item`barrel of gunpowder`) >= 5 ||
        get("sidequestLighthouseCompleted") !== "none" ||
        !have($item`backup camera`) ||
        !have($item`Fourth of May Cosplay Saber`),
      priority: (): Priority => {
        if (AutumnAton.have()) {
          if ($location`Sonofa Beach`.turnsSpent === 0) return Priorities.GoodAutumnaton;
          else if (myTurncount() < 400) return Priorities.BadAutumnaton;
        }
        return Priorities.None;
      },
      do: $location`Sonofa Beach`,
      outfit: (): OutfitSpec => {
        if (AutumnAton.have() && $location`Sonofa Beach`.turnsSpent === 0) return {};
        if (AutumnAton.have() || !have($item`Fourth of May Cosplay Saber`))
          return { modifier: "+combat" };

        // Look for the first lobsterfrogman
        if (
          get("_saberForceMonster") !== $monster`lobsterfrogman` ||
          get("_saberForceMonsterCount") === 0
        ) {
          return { modifier: "+combat", equip: $items`Fourth of May Cosplay Saber` };
        }

        // Reuse the force to track more lobsterfrogman
        if (get("_saberForceMonsterCount") === 1 && itemAmount($item`barrel of gunpowder`) < 4) {
          return { equip: $items`Fourth of May Cosplay Saber` };
        }

        return {};
      },
      combat: new CombatStrategy()
        .macro(() => {
          if (
            equippedAmount($item`Fourth of May Cosplay Saber`) > 0 &&
            !AutumnAton.have() &&
            get("_saberForceUses") < 5 &&
            (get("_saberForceMonster") !== $monster`lobsterfrogman` ||
              get("_saberForceMonsterCount") === 0 ||
              (get("_saberForceMonsterCount") === 1 && itemAmount($item`barrel of gunpowder`) < 4))
          ) {
            return new Macro().skill($skill`Use the Force`);
          }
          return new Macro();
        })
        .kill($monster`lobsterfrogman`),
      orbtargets: () => undefined,
      expectbeatenup: () => get("lastEncounter") === "Zerg Rush",
      choices: { 1387: 2 },
      limit: {
        tries: 20,
        guard: Guards.create(
          () => itemAmount($item`figurine of a sleek seal`),
          (sleek) =>
            !AutumnAton.have() ||
            $location`Sonofa Beach`.turnsSpent > 0 ||
            ($location`Sonofa Beach`.turnsSpent === 0 &&
              itemAmount($item`figurine of a sleek seal`) === sleek + 3)
        ),
      },
    },
    {
      name: "Lighthouse Basic",
      after: [...after, "Lighthouse"],
      priority: (): Priority => {
        if (AutumnAton.have()) {
          if ($location`Sonofa Beach`.turnsSpent === 0) return Priorities.GoodAutumnaton;
          else return Priorities.BadAutumnaton;
        }
        return Priorities.None;
      },
      completed: () =>
        itemAmount($item`barrel of gunpowder`) >= 5 ||
        get("sidequestLighthouseCompleted") !== "none",
      do: $location`Sonofa Beach`,
      outfit: { modifier: "+combat" },
      combat: new CombatStrategy().kill($monster`lobsterfrogman`),
      orbtargets: () => undefined,
      expectbeatenup: () => get("lastEncounter") === "Zerg Rush",
      limit: { soft: 40 },
    },
    {
      name: "Lighthouse End",
      after: ["Lighthouse Basic"],
      ready: () => YouRobot.canUse($slot`hat`),
      completed: () => get("sidequestLighthouseCompleted") !== "none",
      outfit: { equip: warOutfit() },
      do: (): void => {
        visitUrl("bigisland.php?place=lighthouse&action=pyro&pwd");
      },
      freeaction: true,
      limit: { tries: 1 },
    },
  ];
}

function junkyardTasks(after: string[]): Task[] {
  return [
    {
      name: "Junkyard Start",
      after: after,
      ready: () => YouRobot.canUse($slot`hat`),
      completed: () =>
        have($item`molybdenum magnet`) || get("sidequestJunkyardCompleted") !== "none",
      outfit: { equip: warOutfit() },
      do: (): void => {
        visitUrl("bigisland.php?action=junkman&pwd");
      },
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Junkyard Hammer",
      after: ["Junkyard Start"],
      prepare: (): void => {
        fillHp();
        customRestoreMp(50);
      },
      ready: () => YouRobot.canUse($slot`hat`),
      completed: () =>
        have($item`molybdenum hammer`) || get("sidequestJunkyardCompleted") !== "none",
      acquire: [{ item: $item`seal tooth` }],
      outfit: {
        equip: [...warOutfit(), $item`Space Trip safety headphones`, $item`autumn debris shield`],
        familiar: have($familiar`Reagnimated Gnome`)
          ? $familiar`Reagnimated Gnome`
          : have($familiar`Cookbookbat`)
          ? $familiar`Cookbookbat`
          : have($familiar`Nosy Nose`)
          ? $familiar`Nosy Nose`
          : undefined,
        avoid: $items`carnivorous potted plant`,
      },
      do: $location`Next to that Barrel with Something Burning in it`,
      orbtargets: () => $monsters`batwinged gremlin, batwinged gremlin (tool)`,
      combat: new CombatStrategy()
        .macro(
          new Macro()
            .trySkill($skill`Curse of Weaksauce`)
            .trySkill($skill`Micrometeorite`)
            .while_(
              "!match whips out && !times 28 && !hpbelow 30",
              new Macro().item($item`seal tooth`)
            )
            .if_("match whips out", new Macro().item(`molybdenum magnet`)),
          $monster`batwinged gremlin (tool)`
        )
        .banish($monster`A.M.C. gremlin`)
        .kill($monster`batwinged gremlin (tool)`)
        .banish($monsters`batwinged gremlin, vegetable gremlin`),
      nofightingfamiliars: true,
      limit: { soft: 15 },
    },
    {
      name: "Junkyard Wrench",
      after: ["Junkyard Start"],
      prepare: (): void => {
        fillHp();
        customRestoreMp(50);
      },
      ready: () => YouRobot.canUse($slot`hat`),
      completed: () =>
        have($item`molybdenum crescent wrench`) || get("sidequestJunkyardCompleted") !== "none",
      acquire: [{ item: $item`seal tooth` }],
      outfit: {
        equip: [...warOutfit(), $item`Space Trip safety headphones`, $item`autumn debris shield`],
        familiar: have($familiar`Reagnimated Gnome`)
          ? $familiar`Reagnimated Gnome`
          : have($familiar`Cookbookbat`)
          ? $familiar`Cookbookbat`
          : have($familiar`Nosy Nose`)
          ? $familiar`Nosy Nose`
          : undefined,
        avoid: $items`carnivorous potted plant`,
      },
      do: $location`Over Where the Old Tires Are`,
      orbtargets: () => $monsters`erudite gremlin, erudite gremlin (tool)`,
      combat: new CombatStrategy()
        .macro(
          new Macro()
            .trySkill($skill`Curse of Weaksauce`)
            .trySkill($skill`Micrometeorite`)
            .while_(
              "!match whips out && !times 28 && !hpbelow 30",
              new Macro().item($item`seal tooth`)
            )
            .if_("match whips out", new Macro().item(`molybdenum magnet`)),
          $monster`erudite gremlin (tool)`
        )
        .banish($monster`A.M.C. gremlin`)
        .kill($monster`erudite gremlin (tool)`)
        .banish($monsters`erudite gremlin, spider gremlin`),
      nofightingfamiliars: true,
      limit: { soft: 15 },
    },
    {
      name: "Junkyard Pliers",
      after: ["Junkyard Start"],
      acquire: [{ item: $item`seal tooth` }],
      prepare: (): void => {
        fillHp();
        customRestoreMp(50);
      },
      ready: () => YouRobot.canUse($slot`hat`),
      completed: () =>
        have($item`molybdenum pliers`) || get("sidequestJunkyardCompleted") !== "none",
      outfit: {
        equip: [...warOutfit(), $item`Space Trip safety headphones`, $item`autumn debris shield`],
        familiar: have($familiar`Reagnimated Gnome`)
          ? $familiar`Reagnimated Gnome`
          : have($familiar`Cookbookbat`)
          ? $familiar`Cookbookbat`
          : have($familiar`Nosy Nose`)
          ? $familiar`Nosy Nose`
          : undefined,
        avoid: $items`carnivorous potted plant`,
      },
      do: $location`Near an Abandoned Refrigerator`,
      orbtargets: () => $monsters`spider gremlin, spider gremlin (tool)`,
      combat: new CombatStrategy()
        .macro(
          new Macro()
            .trySkill($skill`Curse of Weaksauce`)
            .trySkill($skill`Micrometeorite`)
            .while_(
              "!match whips out && !times 28 && !hpbelow 30",
              new Macro().item($item`seal tooth`)
            )
            .if_("match whips out", new Macro().item(`molybdenum magnet`)),
          $monster`spider gremlin (tool)`
        )
        .banish($monster`A.M.C. gremlin`)
        .kill($monster`spider gremlin (tool)`)
        .banish($monsters`batwinged gremlin, spider gremlin`),
      nofightingfamiliars: true,
      limit: { soft: 15 },
    },
    {
      name: "Junkyard Screwdriver",
      after: ["Junkyard Start"],
      prepare: (): void => {
        fillHp();
        customRestoreMp(50);
      },
      ready: () => YouRobot.canUse($slot`hat`),
      completed: () =>
        have($item`molybdenum screwdriver`) || get("sidequestJunkyardCompleted") !== "none",
      acquire: [{ item: $item`seal tooth` }],
      outfit: {
        equip: [...warOutfit(), $item`Space Trip safety headphones`, $item`autumn debris shield`],
        familiar: have($familiar`Reagnimated Gnome`)
          ? $familiar`Reagnimated Gnome`
          : have($familiar`Cookbookbat`)
          ? $familiar`Cookbookbat`
          : have($familiar`Nosy Nose`)
          ? $familiar`Nosy Nose`
          : undefined,
        avoid: $items`carnivorous potted plant`,
      },
      do: $location`Out by that Rusted-Out Car`,
      orbtargets: () => $monsters`vegetable gremlin, vegetable gremlin (tool)`,
      combat: new CombatStrategy()
        .macro(
          new Macro()
            .trySkill($skill`Curse of Weaksauce`)
            .trySkill($skill`Micrometeorite`)
            .while_(
              "!match whips out && !times 28 && !hpbelow 30",
              new Macro().item($item`seal tooth`)
            )
            .if_("match whips out", new Macro().item(`molybdenum magnet`)),
          $monster`vegetable gremlin (tool)`
        )
        .banish($monster`A.M.C. gremlin`)
        .kill($monster`vegetable gremlin (tool)`)
        .banish($monsters`erudite gremlin, vegetable gremlin`),
      nofightingfamiliars: true,
      limit: { soft: 15 },
    },
    {
      name: "Junkyard End",
      after: ["Junkyard Hammer", "Junkyard Wrench", "Junkyard Pliers", "Junkyard Screwdriver"],
      ready: () => YouRobot.canUse($slot`hat`),
      completed: () => get("sidequestJunkyardCompleted") !== "none",
      outfit: {
        equip: warOutfit(),
      },
      do: (): void => {
        visitUrl("bigisland.php?action=junkman&pwd");
      },
      freeaction: true,
      limit: { tries: 1 },
    },
  ];
}

function orchardTasks(turninAfter: string): Task[] {
  return [
    {
      name: "Orchard Hatching",
      after: ["Enrage"],
      completed: () =>
        have($item`filthworm hatchling scent gland`) ||
        have($effect`Filthworm Larva Stench`) ||
        have($item`filthworm drone scent gland`) ||
        have($effect`Filthworm Drone Stench`) ||
        have($item`filthworm royal guard scent gland`) ||
        have($effect`Filthworm Guard Stench`) ||
        have($item`heart of the filthworm queen`) ||
        get("sidequestOrchardCompleted") !== "none",
      do: $location`The Hatching Chamber`,
      choices: { 1387: 3 },
      outfit: () => {
        if (yellowRayPossible()) return {};
        if (have($effect`Everything Looks Yellow`)) {
          const equips = [];
          equips.push($item`Space Trip safety headphones`);

          if (have($item`bat wings`) && get("_batWingsSwoopUsed") < 11)
            equips.push($item`bat wings`);
          else equips.push($item`unwrapped knock-off retro superhero cape`);
          if (have($item`industrial fire extinguisher`) && get("_fireExtinguisherCharge") >= 10)
            equips.push($item`industrial fire extinguisher`);

          if (
            equips.includes($item`bat wings`) ||
            equips.includes($item`industrial fire extinguisher`)
          ) {
            if (have($item`Greatest American Pants`)) equips.push($item`Greatest American Pants`);
            else if (have($item`navel ring of navel gazing`))
              equips.push($item`navel ring of navel gazing`);
          }
          return {
            equip: equips,
            modes: { retrocape: ["heck", "hold"] },
            modifier: "item",
          };
        } else return { equip: $items`Space Trip safety headphones` };
      },
      combat: new CombatStrategy()
        .yellowRay($monster`larval filthworm`)
        .startingMacro(Macro.trySkill($skill`Extract Jelly`))
        .macro(() =>
          Macro.externalIf(
            have($effect`Everything Looks Yellow`),
            Macro.externalIf(have($item`bat wings`), Macro.trySkill($skill`Swoop like a Bat`))
              .if_("match gland", Macro.runaway())
              .externalIf(
                haveEquipped($item`industrial fire extinguisher`) &&
                  get("_fireExtinguisherCharge") >= 10,
                Macro.trySkill($skill`Fire Extinguisher: Polar Vortex`)
              )
              .if_("match gland", Macro.runaway())
              .externalIf(get("_feelEnvyUsed") < 3, Macro.trySkill($skill`Feel Envy`))
              .step(killMacro())
          )
        ),
      limit: { soft: 10 },
    },
    {
      name: "Orchard Feeding",
      after: ["Orchard Hatching"],
      completed: () =>
        have($item`filthworm drone scent gland`) ||
        have($effect`Filthworm Drone Stench`) ||
        have($item`filthworm royal guard scent gland`) ||
        have($effect`Filthworm Guard Stench`) ||
        have($item`heart of the filthworm queen`) ||
        get("sidequestOrchardCompleted") !== "none",
      do: $location`The Feeding Chamber`,
      choices: { 1387: 3 },
      outfit: () => {
        if (yellowRayPossible()) return {};
        if (have($effect`Everything Looks Yellow`)) {
          const equips = [];
          equips.push($item`Space Trip safety headphones`);

          if (have($item`bat wings`) && get("_batWingsSwoopUsed") < 11)
            equips.push($item`bat wings`);
          else equips.push($item`unwrapped knock-off retro superhero cape`);
          if (have($item`industrial fire extinguisher`) && get("_fireExtinguisherCharge") >= 10)
            equips.push($item`industrial fire extinguisher`);

          if (
            equips.includes($item`bat wings`) ||
            equips.includes($item`industrial fire extinguisher`)
          ) {
            if (have($item`Greatest American Pants`)) equips.push($item`Greatest American Pants`);
            else if (have($item`navel ring of navel gazing`))
              equips.push($item`navel ring of navel gazing`);
          }
          return {
            equip: equips,
            modes: { retrocape: ["heck", "hold"] },
            modifier: "item",
          };
        } else return { equip: $items`Space Trip safety headphones` };
      },
      combat: new CombatStrategy()
        .yellowRay($monster`filthworm drone`)
        .startingMacro(Macro.trySkill($skill`Extract Jelly`))
        .macro(() =>
          Macro.externalIf(
            have($effect`Everything Looks Yellow`),
            Macro.externalIf(have($item`bat wings`), Macro.trySkill($skill`Swoop like a Bat`))
              .if_("match gland", Macro.runaway())
              .externalIf(
                haveEquipped($item`industrial fire extinguisher`) &&
                  get("_fireExtinguisherCharge") >= 10,
                Macro.trySkill($skill`Fire Extinguisher: Polar Vortex`)
              )
              .if_("match gland", Macro.runaway())
              .externalIf(get("_feelEnvyUsed") < 3, Macro.trySkill($skill`Feel Envy`))
              .step(killMacro())
          )
        ),
      effects: $effects`Filthworm Larva Stench`,
      limit: { soft: 10 },
    },
    {
      name: "Orchard Guard",
      after: ["Orchard Feeding"],
      completed: () =>
        have($item`filthworm royal guard scent gland`) ||
        have($effect`Filthworm Guard Stench`) ||
        have($item`heart of the filthworm queen`) ||
        get("sidequestOrchardCompleted") !== "none",
      do: $location`The Royal Guard Chamber`,
      effects: $effects`Filthworm Drone Stench`,
      choices: { 1387: 3 },
      outfit: () => {
        if (yellowRayPossible()) return {};
        if (have($effect`Everything Looks Yellow`)) {
          const equips = [];
          equips.push($item`Space Trip safety headphones`);

          if (have($item`bat wings`) && get("_batWingsSwoopUsed") < 11)
            equips.push($item`bat wings`);
          else equips.push($item`unwrapped knock-off retro superhero cape`);
          if (have($item`industrial fire extinguisher`) && get("_fireExtinguisherCharge") >= 10)
            equips.push($item`industrial fire extinguisher`);

          if (
            equips.includes($item`bat wings`) ||
            equips.includes($item`industrial fire extinguisher`)
          ) {
            if (have($item`Greatest American Pants`)) equips.push($item`Greatest American Pants`);
            else if (have($item`navel ring of navel gazing`))
              equips.push($item`navel ring of navel gazing`);
          }
          return {
            equip: equips,
            modes: { retrocape: ["heck", "hold"] },
            modifier: "item",
          };
        } else return { equip: $items`Space Trip safety headphones` };
      },
      combat: new CombatStrategy()
        .yellowRay($monster`filthworm royal guard`)
        .startingMacro(Macro.trySkill($skill`Extract Jelly`))
        .macro(() =>
          Macro.externalIf(
            have($effect`Everything Looks Yellow`),
            Macro.externalIf(have($item`bat wings`), Macro.trySkill($skill`Swoop like a Bat`))
              .if_("match gland", Macro.runaway())
              .externalIf(
                haveEquipped($item`industrial fire extinguisher`) &&
                  get("_fireExtinguisherCharge") >= 10,
                Macro.trySkill($skill`Fire Extinguisher: Polar Vortex`)
              )
              .if_("match gland", Macro.runaway())
              .externalIf(get("_feelEnvyUsed") < 3, Macro.trySkill($skill`Feel Envy`))
              .step(killMacro())
          )
        ),
      limit: { soft: 10 },
    },
    {
      name: "Orchard Queen",
      after: ["Orchard Guard"],
      completed: () =>
        have($item`heart of the filthworm queen`) || get("sidequestOrchardCompleted") !== "none",
      do: $location`The Filthworm Queen's Chamber`,
      effects: $effects`Filthworm Guard Stench`,
      combat: new CombatStrategy().kill().macro(Macro.trySkill($skill`Extract Jelly`)),
      limit: { tries: 2 }, // allow wanderer
      boss: true,
    },
    {
      name: "Orchard Finish",
      after: ["Orchard Queen", turninAfter],
      ready: () => YouRobot.canUse($slot`hat`),
      completed: () => get("sidequestOrchardCompleted") !== "none",
      outfit: { equip: warOutfit() },
      do: (): void => {
        visitUrl("bigisland.php?place=orchard&action=stand&pwd");
      },
      freeaction: true,
      limit: { tries: 1 },
    },
  ];
}

function nunsTasks(after: string[]): Task[] {
  return [
    {
      name: "Nuns",
      after: after,
      ready: () => YouRobot.canUse($slot`hat`),
      completed: () => get("sidequestNunsCompleted") !== "none" || !args.minor.nuns,
      priority: () => (have($effect`Winklered`) ? Priorities.Effect : Priorities.None),
      prepare: () => {
        if (have($item`SongBoom™ BoomBox`) && get("boomBoxSong") !== "Total Eclipse of Your Meat")
          cliExecute("boombox meat");
        if (!get("concertVisited") && get("sidequestArenaCompleted") !== "none")
          ensureEffect($effect`Winklered`);
        $items`flapper fly, autumn dollar, pink candy heart`
          .filter((i) => have(i, 2) && !have(effectModifier(i, "Effect")))
          .forEach((i) => use(i));
        const effects = $effects`Frosty, Sinuses For Miles, Let's Go Shopping!, A View to Some Meat`;
        for (const effect of effects) {
          if (!have($item`cursed monkey's paw`) || get("_monkeyPawWishesUsed") >= 5) continue;
          if (have(effect)) continue;
          monkeyPaw(effect);
        }
        if (have($item`savings bond`)) ensureEffect($effect`Earning Interest`);
        fillHp();
      },
      do: $location`The Themthar Hills`,
      outfit: () => {
        return {
          modifier: "meat",
          equip: warOutfit(),
        };
      },
      freecombat: true, // Do not equip cmg or carn plant
      combat: new CombatStrategy().killHard(),
      limit: { soft: 30 },
      boss: true,
    },
  ];
}

export function getWarQuest(): Quest {
  if (args.minor.hippy) return getWarQuestHippy();
  else return getWarQuestFrat();
}

function getWarQuestFrat(): Quest {
  return {
    name: "War",
    tasks: [
      {
        name: "Start",
        after: [],
        ready: () => atLevel(12) && councilSafe(),
        completed: () => step("questL12War") !== -1,
        do: () => visitUrl("council.php"),
        limit: { tries: 1 },
        freeaction: true,
      },
      {
        name: "Outfit Hippy",
        after: ["Misc/Unlock Island"],
        ready: () =>
          (get("skillLevel144") === 0 ||
            atLevel(12) ||
            get("_universeCalculated") >= get("skillLevel144")) &&
          myTurncount() >= 150,
        completed: () =>
          (have($item`filthy corduroys`) && have($item`filthy knitted dread sack`)) ||
          (have($item`beer helmet`) &&
            have($item`distressed denim pants`) &&
            have($item`bejeweled pledge pin`)),
        do: $location`Hippy Camp`,
        limit: { soft: 10 },
        choices: () => {
          return {
            136: have($item`filthy corduroys`) ? 2 : 1,
            137: have($item`filthy corduroys`) ? 1 : 2,
          };
        },
        outfit: () => {
          if (forceItemPossible())
            return {
              modifier: "+combat",
            };
          else
            return {
              modifier: "item",
            };
        },
        combat: new CombatStrategy().forceItems().macro(Macro.trySkill($skill`Extract Jelly`)),
      },
      {
        name: "Outfit",
        after: ["Start", "Outfit Hippy"],
        ready: () => YouRobot.canUse($slot`hat`),
        completed: () =>
          have($item`beer helmet`) &&
          have($item`distressed denim pants`) &&
          have($item`bejeweled pledge pin`),
        do: $location`Frat House`,
        limit: { soft: 10 },
        choices: { 142: 3, 143: 3, 144: 3, 145: 1, 146: 3, 1433: 3 },
        outfit: () => {
          if (forceItemPossible())
            return {
              equip: $items`filthy corduroys, filthy knitted dread sack`,
              modifier: "+combat",
            };
          else
            return {
              equip: $items`filthy corduroys, filthy knitted dread sack`,
              modifier: "item",
            };
        },
        combat: new CombatStrategy().forceItems(),
      },
      {
        name: "Enrage",
        after: ["Start", "Misc/Unlock Island", "Misc/Unlock Island Submarine", "Outfit"],
        ready: () =>
          myBasestat($stat`mysticality`) >= 70 &&
          myBasestat($stat`moxie`) >= 70 &&
          YouRobot.canUse($slot`hat`),
        completed: () => step("questL12War") >= 1,
        prepare: () => {
          // Restore a bit more HP than usual
          if (myHp() < 80 && myHp() < myMaxhp()) restoreHp(myMaxhp() < 80 ? myMaxhp() : 80);
        },
        outfit: () => {
          const result = <OutfitSpec>{
            equip: warOutfit(),
            modifier: "-combat",
          };
          if (!have($skill`Comprehensive Cartography`))
            result.equip?.push($item`candy cane sword cane`);
          return result;
        },
        combat: new CombatStrategy().macro(Macro.trySkill($skill`Extract Jelly`)),
        do: $location`Wartime Hippy Camp (Frat Disguise)`,
        choices: () => {
          if (haveEquipped($item`candy cane sword cane`))
            return { 139: 4, 140: 4, 141: 3, 142: 3, 143: 3, 144: 3, 145: 1, 146: 3, 1433: 3 };
          else return { 139: 3, 140: 3, 141: 3, 142: 3, 143: 3, 144: 3, 145: 1, 146: 3, 1433: 3 };
        },
        limit: { soft: 20 },
      },
      ...flyersTasks(["Enrage"]),
      ...lighthouseTasks(["Enrage"]),
      ...junkyardTasks(["Enrage"]),
      {
        name: "Phase 1",
        after: ["Flyers Start", "Junkyard End"],
        ready: () => false,
        completed: () => warPhaseOneDone(),
        do: () => {
          // Use this task only for routing
          throw `Task War/Phase 1 should never run`;
        },
        limit: { tries: 0 },
      },
      {
        name: "Open Orchard",
        after: ["Flyers End", "Lighthouse End", "Junkyard End"],
        ready: () => YouRobot.canUse($slot`hat`),
        completed: () => get("hippiesDefeated") >= 64,
        outfit: () => {
          if (
            have($item`Sheriff moustache`) &&
            have($item`Sheriff badge`) &&
            have($item`Sheriff pistol`) &&
            get("_assertYourAuthorityCast", 0) < 3
          )
            return {
              equip: [
                ...warOutfit(),
                $item`Sheriff moustache`,
                $item`Sheriff badge`,
                $item`Sheriff pistol`,
              ],
            };
          else return { equip: warOutfit() };
        },
        do: $location`The Battlefield (Frat Uniform)`,
        post: dimesForGarters,
        combat: new CombatStrategy()
          .killHard(warHeroes)
          .kill()
          .macro(
            Macro.trySkill($skill`%fn, let's pledge allegiance to a Zone`)
              .trySkill($skill`Extract Jelly`)
              .trySkill($skill`Assert your Authority`)
          ),
        limit: { tries: 10 },
      },
      ...orchardTasks("Open Orchard"),
      {
        name: "Open Nuns",
        after: ["Orchard Finish"],
        ready: () => YouRobot.canUse($slot`hat`),
        completed: () => get("hippiesDefeated") >= 192,
        outfit: {
          equip: warOutfit(),
        },
        do: $location`The Battlefield (Frat Uniform)`,
        combat: new CombatStrategy()
          .kill()
          .killHard(warHeroes)
          .macro(Macro.trySkill($skill`Extract Jelly`)),
        limit: { tries: 9 },
      },
      ...nunsTasks(["Open Nuns"]),
      {
        name: "Clear",
        after: ["Open Nuns", "Nuns"],
        ready: () => YouRobot.canUse($slot`hat`),
        completed: () => get("hippiesDefeated") >= 1000,
        outfit: {
          equip: warOutfit(),
        },
        do: $location`The Battlefield (Frat Uniform)`,
        post: dimesForGarters,
        combat: new CombatStrategy()
          .kill()
          .killHard(warHeroes)
          .macro(Macro.trySkill($skill`Extract Jelly`)),
        limit: { tries: 55 },
      },
      {
        name: "Boss",
        after: ["Clear"],
        ready: () => YouRobot.canUse($slot`hat`),
        completed: () => step("questL12War") === 999,
        outfit: {
          equip: warOutfit(),
        },
        prepare: () => {
          dimesForGarters();
          fillHp();
        },
        do: (): void => {
          visitUrl("bigisland.php?place=camp&whichcamp=1&confirm7=1");
          visitUrl("bigisland.php?action=bossfight&pwd");
          runCombat();
          visitUrl("council.php");
          cliExecute("refresh all");
        },
        combat: new CombatStrategy().killHard().macro(Macro.trySkill($skill`Extract Jelly`)),
        limit: { tries: 2 }, // Possible cleaver
        boss: true,
      },
    ],
  };
}

function getWarQuestHippy(): Quest {
  return {
    name: "War",
    tasks: [
      {
        name: "Start",
        after: [],
        ready: () => atLevel(12) && councilSafe(),
        completed: () => step("questL12War") !== -1,
        do: () => visitUrl("council.php"),
        limit: { tries: 1 },
        freeaction: true,
      },
      {
        name: "Outfit Hippy",
        after: ["Misc/Unlock Island"],
        ready: () =>
          (get("skillLevel144") === 0 ||
            atLevel(12) ||
            get("_universeCalculated") >= get("skillLevel144")) &&
          myTurncount() >= 150,
        completed: () =>
          (have($item`filthy corduroys`) && have($item`filthy knitted dread sack`)) ||
          (have($item`beer helmet`) &&
            have($item`distressed denim pants`) &&
            have($item`bejeweled pledge pin`)),
        do: $location`Hippy Camp`,
        limit: { soft: 10 },
        choices: () => {
          return {
            136: have($item`filthy corduroys`) ? 2 : 1,
            137: have($item`filthy corduroys`) ? 1 : 2,
          };
        },
        outfit: () => {
          if (forceItemPossible())
            return {
              modifier: "+combat",
            };
          else
            return {
              modifier: "item",
            };
        },
        combat: new CombatStrategy().forceItems().macro(Macro.trySkill($skill`Extract Jelly`)),
      },
      {
        name: "Outfit",
        after: ["Start", "Outfit Hippy"],
        ready: () => YouRobot.canUse($slot`hat`),
        completed: () =>
          have($item`reinforced beaded headband`) &&
          have($item`bullet-proof corduroys`) &&
          have($item`round purple sunglasses`),
        do: $location`Hippy Camp`,
        limit: { soft: 10 },
        outfit: {
          equip: $items`filthy corduroys, filthy knitted dread sack`,
        },
      },
      {
        name: "Enrage",
        after: ["Start", "Misc/Unlock Island", "Misc/Unlock Island Submarine", "Outfit"],
        ready: () =>
          myBasestat($stat`mysticality`) >= 70 &&
          myBasestat($stat`moxie`) >= 70 &&
          YouRobot.canUse($slot`hat`),
        completed: () => step("questL12War") >= 1,
        prepare: () => {
          // Restore a bit more HP than usual
          if (myHp() < 80 && myHp() < myMaxhp()) restoreHp(myMaxhp() < 80 ? myMaxhp() : 80);
        },
        outfit: () => {
          const result = <OutfitSpec>{
            equip: warOutfit(),
            modifier: "-combat",
          };
          if (!have($skill`Comprehensive Cartography`))
            result.equip?.push($item`candy cane sword cane`);
          return result;
        },
        do: $location`Wartime Frat House (Hippy Disguise)`,
        choices: () => {
          if (haveEquipped($item`candy cane sword cane`))
            return { 139: 4, 140: 4, 141: 3, 142: 3, 143: 4, 144: 4, 145: 1, 146: 3, 1433: 3 };
          else return { 139: 3, 140: 3, 141: 3, 142: 3, 143: 3, 144: 3, 145: 1, 146: 3, 1433: 3 };
        },
        limit: { soft: 20 },
      },
      ...nunsTasks(["Enrage"]),
      ...orchardTasks("Enrage"),
      {
        name: "Open Lighthouse",
        after: ["Nuns", "Orchard Finish"],
        ready: () => YouRobot.canUse($slot`hat`),
        completed: () => get("fratboysDefeated") >= 64,
        outfit: () => {
          if (
            have($item`Sheriff moustache`) &&
            have($item`Sheriff badge`) &&
            have($item`Sheriff pistol`) &&
            get("_assertYourAuthorityCast", 0) < 3
          )
            return {
              equip: [
                ...warOutfit(),
                $item`Sheriff moustache`,
                $item`Sheriff badge`,
                $item`Sheriff pistol`,
              ],
            };
          else return { equip: warOutfit() };
        },
        do: $location`The Battlefield (Hippy Uniform)`,
        post: dimesForGarters,
        combat: new CombatStrategy()
          .killHard(warHeroes)
          .kill()
          .macro(
            Macro.trySkill($skill`%fn, let's pledge allegiance to a Zone`)
              .trySkill($skill`Extract Jelly`)
              .trySkill($skill`Assert your Authority`)
          ),
        limit: { tries: 20 },
      },
      ...lighthouseTasks(["Open Lighthouse"]),
      {
        name: "Phase 1",
        after: ["Lighthouse"],
        ready: () => false,
        completed: () => warPhaseOneDone(),
        do: () => {
          // Use this task only for routing
          throw `Task War/Phase 1 should never run`;
        },
        limit: { tries: 0 },
      },
      {
        name: "Open Junkyard",
        after: ["Lighthouse End"],
        ready: () => YouRobot.canUse($slot`hat`),
        completed: () => get("fratboysDefeated") >= 192,
        outfit: {
          equip: warOutfit(),
        },
        do: $location`The Battlefield (Hippy Uniform)`,
        combat: new CombatStrategy()
          .kill()
          .killHard(warHeroes)
          .macro(Macro.trySkill($skill`Extract Jelly`)),
        limit: { tries: 18 },
      },
      ...junkyardTasks(["Open Junkyard"]),
      {
        name: "Open Arena",
        after: ["Junkyard End"],
        ready: () => YouRobot.canUse($slot`hat`),
        completed: () => get("fratboysDefeated") >= 458,
        outfit: {
          equip: warOutfit(),
        },
        do: $location`The Battlefield (Hippy Uniform)`,
        combat: new CombatStrategy()
          .kill()
          .killHard(warHeroes)
          .macro(Macro.trySkill($skill`Extract Jelly`)),
        limit: { tries: 50 },
      },
      ...flyersTasks(["Open Arena"]),
      {
        name: "Clear",
        after: ["Flyers End"],
        ready: () => YouRobot.canUse($slot`hat`),
        completed: () => get("fratboysDefeated") >= 1000,
        outfit: {
          equip: warOutfit(),
        },
        do: $location`The Battlefield (Hippy Uniform)`,
        post: dimesForGarters,
        combat: new CombatStrategy()
          .kill()
          .killHard(warHeroes)
          .macro(Macro.trySkill($skill`Extract Jelly`)),
        limit: { tries: 55 },
      },
      {
        name: "Boss",
        after: ["Clear"],
        ready: () => YouRobot.canUse($slot`hat`),
        completed: () => step("questL12War") === 999,
        outfit: {
          equip: warOutfit(),
        },
        prepare: () => {
          dimesForGarters();
          fillHp();
        },
        do: (): void => {
          visitUrl("bigisland.php?place=camp&whichcamp=2&confirm7=1");
          visitUrl("bigisland.php?action=bossfight&pwd");
          runCombat();
          visitUrl("council.php");
          cliExecute("refresh all");
        },
        combat: new CombatStrategy().killHard().macro(Macro.trySkill($skill`Extract Jelly`)),
        limit: { tries: 2 }, // Possible cleaver
        boss: true,
      },
    ],
  };
}

export function councilSafe(): boolean {
  // Check if it is safe to visit the council without making the war outfit worse
  // (It is harder to get the hippy outfit after the war starts)
  return (
    !atLevel(12) ||
    (have($item`filthy corduroys`) && have($item`filthy knitted dread sack`)) ||
    (have($item`beer helmet`) &&
      have($item`distressed denim pants`) &&
      have($item`bejeweled pledge pin`)) ||
    (args.minor.hippy &&
      have($item`reinforced beaded headband`) &&
      have($item`bullet-proof corduroys`) &&
      have($item`round purple sunglasses`))
  );
}

function dimesForGarters(): void {
  if (myTurncount() >= 1000) return;
  if (args.minor.hippy) {
    if (itemAmount($item`filthy poultice`) >= 20) return;
    const to_sell = $items`red class ring, blue class ring, white class ring, PADL Phone, beer helmet, distressed denim pants, bejeweled pledge pin`;
    for (const it of to_sell) {
      if (itemAmount(it) > 0) sell(it.buyer, itemAmount(it), it);
    }

    if ($coinmaster`Dimemaster`.availableTokens >= 2) cliExecute("make * filthy poultice");
  } else {
    const to_sell = $items`pink clay bead, purple clay bead, green clay bead, communications windchimes, bullet-proof corduroys, round purple sunglasses, reinforced beaded headband`;
    for (const it of to_sell) {
      if (itemAmount(it) > 0) sell(it.buyer, itemAmount(it), it);
    }

    if (itemAmount($item`gauze garter`) < 20) {
      if ($coinmaster`Quartersmaster`.availableTokens >= 2) cliExecute(`make * gauze garter`);
    } else if (args.minor.warProfiteering)
      if ($coinmaster`Quartersmaster`.availableTokens >= 5)
        cliExecute("make * commemorative war stein");
  }
}

export function warPhaseOneDone() {
  if ($location`Sonofa Beach`.turnsSpent === 0) return false;
  if (args.minor.hippy) return true;
  return have($item`rock band flyers`) || get("sidequestArenaCompleted") !== "none";
}
