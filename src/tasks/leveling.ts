import { CombatStrategy } from "../engine/combat";
import {
  cliExecute,
  Item,
  myLevel,
  myPrimestat,
  myTurncount,
  runChoice,
  use,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  $stat,
  ClosedCircuitPayphone,
  get,
  have,
  Macro,
  set,
} from "libram";
import { Priorities } from "../engine/priority";
import { Quest, Task } from "../engine/task";
import { primestatId } from "../lib";
import { fillHp } from "../engine/moods";
import { OutfitSpec } from "grimoire-kolmafia";

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
    name: "Fortune",
    after: robotSetup,
    completed: () => get("_clanFortuneBuffUsed") || !have($item`Clan VIP Lounge key`),
    priority: () => Priorities.Free,
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
      (!have($item`pocket wish`) && (!have($item`genie bottle`) || get("_genieWishesUsed") >= 3)) ||
      myTurncount() >= 20,
    priority: () => Priorities.Free,
    do: () => cliExecute("genie effect warm shoulders"),
    freeaction: true,
    limit: { tries: 1 },
  },
  {
    name: "Wish Blue Swayed",
    after: robotSetup,
    completed: () =>
      have($effect`Blue Swayed`) ||
      (!have($item`pocket wish`) && (!have($item`genie bottle`) || get("_genieWishesUsed") >= 3)) ||
      myTurncount() >= 20,
    priority: () => Priorities.Free,
    do: () => cliExecute("genie effect blue swayed"),
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
    priority: () => Priorities.Free,
    ready: () => get("loveTunnelAvailable"),
    completed: () => get("_loveTunnelUsed"),
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
      if ((get("daycareOpen") || get("_daycareToday")) && !get("_daycareSpa")) {
        switch (myPrimestat()) {
          case $stat`Muscle`:
            cliExecute("daycare muscle");
            break;
          case $stat`Mysticality`:
            cliExecute("daycare myst");
            break;
          case $stat`Moxie`:
            cliExecute("daycare moxie");
            break;
        }
      }
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
    do: () =>
      cliExecute(`bastille ${myPrimestat() === $stat`Mysticality` ? "myst" : myPrimestat()}`),
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
    completed: () => get("_snojoFreeFights") >= 10 || !get("snojoAvailable"),
    do: $location`The X-32-F Combat Training Snowman`,
    post: (): void => {
      if (get("_snojoFreeFights") === 10) cliExecute("hottub"); // Clean -stat effects
    },
    combat: new CombatStrategy().killHard(),
    outfit: { equip: $items`Space Trip safety headphones` },
    limit: { tries: 10 },
    freecombat: true,
  },
  {
    name: "Neverending Party",
    after: getBuffs,
    priority: () => Priorities.Start,
    completed: () => get("_neverendingPartyFreeTurns") >= 10 || !get("neverendingPartyAlways"),
    do: $location`The Neverending Party`,
    choices: { 1322: 2, 1324: 5 },
    combat: new CombatStrategy().killHard(),
    outfit: { equip: $items`Space Trip safety headphones` },
    limit: { tries: 11 },
    freecombat: true,
  },
  {
    name: "Speakeasy",
    after: getBuffs,
    priority: () => Priorities.Start,
    completed: () => get("_speakeasyFreeFights") >= 3 || !get("ownsSpeakeasy"),
    do: $location`An Unusually Quiet Barroom Brawl`,
    choices: { 1322: 2, 1324: 5 },
    combat: new CombatStrategy().killHard(),
    outfit: { equip: $items`Space Trip safety headphones` },
    limit: { tries: 3 },
    freecombat: true,
  },
  {
    name: "Shadow Rift",
    after: getBuffs,
    priority: () => Priorities.Start,
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
        const result = Macro.while_("hasskill 226", Macro.skill($skill`Perpetrate Mild Evil`));
        // Use all but the last extinguisher uses on polar vortex.
        const vortex_count = (get("_fireExtinguisherCharge") - 40) / 10;
        if (vortex_count > 0) {
          for (let i = 0; i < vortex_count; i++)
            result.trySkill($skill`Fire Extinguisher: Polar Vortex`);
        }
        result.while_("hasskill 7448 && !pastround 20", Macro.skill($skill`Douse Foe`));
        return result;
      }, $monster`shadow slab`)
      .killHard(),
    outfit: () => {
      const result: OutfitSpec = {
        equip: $items`Space Trip safety headphones, June cleaver`,
        modifier: "item",
        avoid: $items`broken champagne bottle`,
      };
      //TODO: plan how many fire extinguishers need to be saved
      if (
        have($item`industrial fire extinguisher`) &&
        get("_fireExtinguisherCharge") >= 50 // Leave some for harem
      )
        result.equip?.push($item`industrial fire extinguisher`);
      if (have($item`Flash Liquidizer Ultra Dousing Accessory`) && get("_douseFoeUses") < 3)
        result.equip?.push($item`Flash Liquidizer Ultra Dousing Accessory`);
      return result;
    },
    boss: true,
    freecombat: true,
    limit: { tries: 12 },
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
