import { CombatStrategy, killMacro } from "../engine/combat";
import {
  canEquip,
  cliExecute,
  familiarWeight,
  haveEquipped,
  Item,
  myLevel,
  myTurncount,
  numericModifier,
  runChoice,
  runCombat,
  use,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  $slot,
  BeachComb,
  ClosedCircuitPayphone,
  ensureEffect,
  get,
  have,
  Macro,
  set,
} from "libram";
import { Priorities } from "../engine/priority";
import { Quest, Task } from "../engine/task";
import {
  atLevel,
  levelingStartCompleted,
  NO_ADVENTURE_SPENT,
  NO_ADVENTURE_SPENT_OR_HOLIDAY,
  primestatId,
  YouRobot,
} from "../lib";
import { fillHp } from "../engine/moods";
import { OutfitSpec, step } from "grimoire-kolmafia";
import { args } from "../args";

const robotSetup = [
  "Robot/Scavenge",
  "Robot/CPU Energy",
  "Robot/Equip Top Initial",
  "Robot/Equip Right Initial",
];

const buffTasks: Task[] = [
  {
    name: "Cloud Talk",
    after: robotSetup,
    priority: () => Priorities.Free,
    completed: () =>
      have($effect`That's Just Cloud-Talk, Man`) ||
      get("_campAwayCloudBuffs", 0) > 0 ||
      !get("getawayCampsiteUnlocked"),
    do: () => visitUrl("place.php?whichplace=campaway&action=campaway_sky"),
    freeaction: true,
    limit: { tries: 1 },
  },
  {
    name: "Nellyville",
    after: [...robotSetup, "Misc/2002 Store"],
    priority: () => Priorities.Free,
    completed: () => have($effect`Hot in Herre`) || !have($item`Charter: Nellyville`),
    do: () => use($item`Charter: Nellyville`),
    freeaction: true,
    limit: { tries: 1 },
  },
  {
    name: "Fortune",
    after: robotSetup,
    completed: () =>
      get("_clanFortuneBuffUsed") || !have($item`Clan VIP Lounge key`) || levelingStartCompleted(),
    priority: () => Priorities.Start,
    do: () => cliExecute("fortune buff susie"),
    freeaction: true,
    limit: { tries: 1 },
  },
  {
    name: "Defective Game Grid",
    after: robotSetup,
    completed: () =>
      have($effect`Video... Games?`) ||
      get("_defectiveTokenUsed") ||
      !have($item`defective Game Grid token`),
    priority: () => Priorities.Free,
    do: () => use($item`defective Game Grid token`),
    freeaction: true,
    limit: { tries: 1 },
  },
  {
    name: "Wish Warm Shoulders",
    after: robotSetup,
    completed: () =>
      have($effect`Warm Shoulders`) ||
      (!have($item`pocket wish`) &&
        (!have($item`genie bottle`) || get("_genieWishesUsed") >= 3) &&
        (!have($item`cursed monkey's paw`) || get("_monkeyPawWishesUsed") >= 5)) ||
      myTurncount() >= 20 ||
      levelingStartCompleted(),
    priority: () => Priorities.Start,
    do: () => {
      if (have($item`pocket wish`) || (have($item`genie bottle`) && get("_genieWishesUsed") < 3))
        cliExecute("genie effect warm shoulders");
      else cliExecute("monkeypaw effect warm shoulders");
    },
    freeaction: true,
    limit: { tries: 1 },
  },
  {
    name: "Wish Blue Swayed",
    after: robotSetup,
    completed: () =>
      have($effect`Blue Swayed`) ||
      (!have($item`pocket wish`) &&
        (!have($item`genie bottle`) || get("_genieWishesUsed") >= 3) &&
        (!have($item`cursed monkey's paw`) || get("_monkeyPawWishesUsed") >= 5)) ||
      myTurncount() >= 20 ||
      levelingStartCompleted(),
    priority: () => Priorities.Start,
    do: () => {
      if (have($item`pocket wish`) || (have($item`genie bottle`) && get("_genieWishesUsed") < 3))
        cliExecute("genie effect blue swayed");
      else cliExecute("monkeypaw effect blue swayed");
    },
    freeaction: true,
    limit: { tries: 1 },
  },
];
const getBuffsPreLOV = buffTasks.map((t) => t.name);
const getBuffs = [...getBuffsPreLOV, "LOV Tunnel"];

const unscaledLeveling: Task[] = [
  {
    name: "LOV Tunnel",
    after: getBuffsPreLOV,
    priority: () => Priorities.Start,
    completed: () => get("_loveTunnelUsed") || !get("loveTunnelAvailable"),
    do: $location`The Tunnel of L.O.V.E.`,
    choices: { 1222: 1, 1223: 1, 1224: primestatId(), 1225: 1, 1226: 2, 1227: 1, 1228: 3 },
    combat: new CombatStrategy().killHard(),
    limit: { tries: 1 },
    outfit: { equip: $items`Space Trip safety headphones` },
    freecombat: true,
  },
  {
    name: "Daycare",
    after: getBuffs,
    priority: () => Priorities.Free,
    ready: () => get("daycareOpen"),
    completed: () => get("_daycareGymScavenges") !== 0,
    do: (): void => {
      if ((get("daycareOpen") || get("_daycareToday")) && !get("_daycareSpa"))
        cliExecute("daycare myst");
      visitUrl("place.php?whichplace=town_wrong&action=townwrong_boxingdaycare");
      runChoice(3);
      runChoice(2);
    },
    outfit: {
      modifier: "exp",
    },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Bastille",
    after: getBuffs,
    priority: () => Priorities.Free,
    ready: () => have($item`Bastille Battalion control rig`),
    completed: () => get("_bastilleGames") !== 0,
    do: () => cliExecute(`bastille myst cannon`),
    limit: { tries: 1 },
    freeaction: true,
    outfit: {
      modifier: "exp",
    },
  },
  {
    name: "Snojo",
    after: getBuffs,
    priority: () => Priorities.Start,
    prepare: (): void => {
      if (get("snojoSetting") === null) {
        visitUrl("place.php?whichplace=snojo&action=snojo_controller");
        runChoice(primestatId());
      }
      fillHp();
    },
    completed: () =>
      get("_snojoFreeFights") >= 10 || !get("snojoAvailable") || levelingStartCompleted(),
    do: $location`The X-32-F Combat Training Snowman`,
    post: (): void => {
      if (get("_snojoFreeFights") === 10) cliExecute("hottub"); // Clean -stat effects
    },
    combat: new CombatStrategy().killHard().macro(() => killMacro(undefined, true, true)),
    outfit: () => {
      const result = <OutfitSpec>{
        equip: $items`cursed monkey's paw, unwrapped knock-off retro superhero cape`,
        modes: { retrocape: ["heck", "hold"] },
      };
      if (canEquip($item`Space Trip safety headphones`))
        result.equip?.push($item`Space Trip safety headphones`);
      else if (get("_monkeyPawWishesUsed") === 0) result.equip?.push($item`cursed monkey's paw`);
      return result;
    },
    limit: { tries: 10, guard: NO_ADVENTURE_SPENT },
    freecombat: true,
  },
  {
    name: "Neverending Party",
    after: getBuffs,
    priority: () => Priorities.Start,
    completed: () =>
      get("_neverendingPartyFreeTurns") >= 10 ||
      !get("neverendingPartyAlways") ||
      levelingStartCompleted(),
    do: $location`The Neverending Party`,
    choices: { 1322: 2, 1324: 5 },
    combat: new CombatStrategy().killHard().macro(() => killMacro(undefined, true, true)),
    outfit: () => {
      if (canEquip($item`Space Trip safety headphones`))
        return { equip: $items`Space Trip safety headphones` };
      else return { equip: $items`cursed monkey's paw` };
    },
    limit: { tries: 11, guard: NO_ADVENTURE_SPENT_OR_HOLIDAY },
    freecombat: true,
  },
  {
    name: "Speakeasy",
    after: getBuffs,
    priority: () => Priorities.Start,
    completed: () =>
      get("_speakeasyFreeFights") >= 3 || !get("ownsSpeakeasy") || levelingStartCompleted(),
    do: $location`An Unusually Quiet Barroom Brawl`,
    choices: { 1322: 2, 1324: 5 },
    combat: new CombatStrategy().killHard().macro(() => killMacro(undefined, true, true)),
    outfit: () => {
      if (canEquip($item`Space Trip safety headphones`))
        return { equip: $items`Space Trip safety headphones` };
      else return { equip: $items`cursed monkey's paw` };
    },
    limit: { tries: 3, guard: NO_ADVENTURE_SPENT },
    freecombat: true,
  },
  {
    name: "Shadow Rift",
    after: getBuffs,
    priority: () => {
      if (have($effect`Shadow Affinity`)) return [Priorities.Start, Priorities.MinorEffect];
      else return [Priorities.Start];
    },
    ready: () => atLevel(7) && step("questL07Cyrptic") !== -1 && YouRobot.canUse($slot`weapon`),
    completed: () =>
      !have($item`closed-circuit pay phone`) ||
      (get("_shadowAffinityToday") &&
        !have($effect`Shadow Affinity`) &&
        get("encountersUntilSRChoice") !== 0),
    prepare: () => {
      if (!get("_shadowAffinityToday")) ClosedCircuitPayphone.chooseQuest(() => 2);
    },
    do: $location`Shadow Rift (The Misspelled Cemetary)`,
    post: (): void => {
      if (have(ClosedCircuitPayphone.rufusTarget() as Item)) {
        use($item`closed-circuit pay phone`);
      }
    },
    choices: { 1498: 1 },
    combat: new CombatStrategy()
      .macro((): Macro => {
        const result = new Macro();
        // Use all but the last extinguisher uses on polar vortex.
        const vortex_count = (get("_fireExtinguisherCharge") - 40) / 10;
        const vortex_cap = haveEquipped($item`Space Trip safety headphones`)
          ? 10
          : familiarWeight($familiar`Grey Goose`) === 20
          ? 2
          : 3;
        if (vortex_count > 0 && haveEquipped($item`industrial fire extinguisher`)) {
          for (let i = 0; i < vortex_count && i < vortex_cap; i++)
            result.trySkill($skill`Fire Extinguisher: Polar Vortex`);
        }
        if (
          haveEquipped($item`Space Trip safety headphones`) &&
          haveEquipped($item`Flash Liquidizer Ultra Dousing Accessory`)
        )
          result.while_("hasskill 7448 && !pastround 20", Macro.skill($skill`Douse Foe`));
        return result;
      }, $monster`shadow slab`)
      .killHard()
      .macro(() => {
        if (haveEquipped($item`Space Trip safety headphones`)) return new Macro();
        return killMacro(undefined, true, true);
      }),
    outfit: () => {
      const result: OutfitSpec = {
        equip: $items`Space Trip safety headphones, unwrapped knock-off retro superhero cape`,
        modifier: "item",
        modes: { retrocape: ["heck", "hold"] },
        avoid: $items`broken champagne bottle`,
        familiar: $familiar`Grey Goose`,
      };
      if (
        !canEquip($item`Space Trip safety headphones`) &&
        (!have($item`cursed monkey's paw`) || get("_monkeyPawWishesUsed") > 0)
      )
        result.equip?.push($item`candy cane sword cane`);

      //TODO: plan how many fire extinguishers need to be saved
      if (
        have($item`industrial fire extinguisher`) &&
        get("_fireExtinguisherCharge") >= 50 // Leave some for harem
      )
        result.equip?.push($item`industrial fire extinguisher`);
      else result.equip?.push($item`June cleaver`);
      if (have($item`Flash Liquidizer Ultra Dousing Accessory`) && get("_douseFoeUses") < 3)
        result.equip?.push($item`Flash Liquidizer Ultra Dousing Accessory`);

      if (!canEquip($item`Space Trip safety headphones`))
        result.equip?.push($item`cursed monkey's paw`);
      if (familiarWeight($familiar`Grey Goose`) !== 20) result.equip?.push($item`Jurassic Parka`);
      return result;
    },
    boss: true,
    freecombat: true,
    limit: { tries: 12, guard: NO_ADVENTURE_SPENT },
  },
];

export const LevelingQuest: Quest = {
  name: "Leveling",
  tasks: [
    ...buffTasks,
    ...unscaledLeveling,
    {
      name: "Leaflet",
      after: [],
      priority: () => Priorities.Free,
      ready: () => myLevel() >= 9,
      completed: () => get("leafletCompleted"),
      do: (): void => {
        visitUrl("council.php");
        cliExecute("leaflet");
        set("leafletCompleted", true);
      },
      freeaction: true,
      limit: { tries: 1 },
      outfit: {
        modifier: "exp",
      },
    },
    {
      name: "God Lobster",
      after: [],
      ready: () => have($familiar`God Lobster`) && myTurncount() >= 90 && YouRobot.canUseFamiliar(),
      completed: () => get("_godLobsterFights") >= 3,
      do: (): void => {
        visitUrl("main.php?fightgodlobster=1");
        runCombat();
        runChoice(3);
      },
      combat: new CombatStrategy().killHard(),
      outfit: {
        equip: $items`June cleaver, Space Trip safety headphones`,
        familiar: $familiar`God Lobster`,
        modifier: "exp",
      },
      limit: { tries: 3 },
      freecombat: true,
    },
    {
      name: "Acquire Mouthwash",
      completed: () =>
        // eslint-disable-next-line libram/verify-constants
        !have($item`Sept-Ember Censer`) ||
        have(mouthWash) ||
        args.minor.saveember ||
        myLevel() >= 7,
      do: (): void => {
        // Grab Embers
        visitUrl("shop.php?whichshop=september");

        // Grab Bembershoot
        visitUrl(`shop.php?whichshop=september&action=buyitem&quantity=1&whichrow=1516&pwd`);

        // Grab Mouthwashes
        visitUrl("shop.php?whichshop=september&action=buyitem&quantity=3&whichrow=1512&pwd");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Mouthwash",
      after: ["Cloud Talk", "Nellyville", "Defective Game Grid", "Misc/Cut Melodramedary", "Acquire Mouthwash"],
      priority: () => Priorities.Start,
      completed: () => !have(mouthWash),
      do: () => {
        // Use potions for cold resistance
        if (have($item`rainbow glitter candle`)) use($item`rainbow glitter candle`);
        if (have($item`pec oil`)) use($item`pec oil`);
        if (have($skill`Emotionally Chipped`) && get("_feelPeacefulUsed") < 3)
          ensureEffect($effect`Feeling Peaceful`);
        if (have($item`MayDay™ supply package`)) use($item`MayDay™ supply package`);
        if (have($item`scroll of Protection from Bad Stuff`))
          use($item`scroll of Protection from Bad Stuff`);
        if (have($item`bottle of antifreeze`)) use($item`bottle of antifreeze`);
        if (have($item`recording of Rolando's Rondo of Resisto`))
          use($item`recording of Rolando's Rondo of Resisto`);
        if (BeachComb.available()) BeachComb.tryHead(BeachComb.head.COLD);

        // If we are below the minimum cold resistance, wish away the difference
        const coldMinimum = 33;
        const wishableEffects = [
          $effect`Fever From the Flavor`,
          $effect`Boilermade`,
          $effect`Inner Warmth`,
          $effect`Super Structure`,
          $effect`Icy Composition`,
        ];
        for (const effect of wishableEffects) {
          if (numericModifier("Cold Resistance") >= coldMinimum) break;
          if (have(effect)) continue;
          if (
            have($item`pocket wish`) ||
            (have($item`genie bottle`) && get("_genieWishesUsed") < 3)
          )
            cliExecute(`genie effect ${effect.name}`);
          else if (have($item`cursed monkey's paw`) && get("_monkeyPawWishesUsed") < 5)
            cliExecute(`monkeypaw effect ${effect.name}`);
          else break;
        }
        use(mouthWash);
      },
      outfit: () => {
        if (have($familiar`Trick-or-Treating Tot`) && have($item`li'l candy corn costume`))
          return {
            familiar: $familiar`Trick-or-Treating Tot`,
            modifier: "cold res",
          };
        return {
          familiar: $familiar`Exotic Parrot`,
          modifier: "cold res",
        };
      },
      limit: { tries: 4 },
      freeaction: true,
    },
    {
      name: "All",
      after: unscaledLeveling.map((t) => t.name),
      completed: () => true,
      do: (): void => {
        throw `Should never run`;
      },
      limit: { tries: 0 },
    },
  ],
};

// eslint-disable-next-line libram/verify-constants
const mouthWash = $item`Mmm-brr! brand mouthwash`;
