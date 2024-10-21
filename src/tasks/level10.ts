import {
  cliExecute,
  containsText,
  haveEquipped,
  itemAmount,
  myDaycount,
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
  $monsters,
  $skill,
  $slot,
  get,
  have,
  Macro,
} from "libram";
import { CombatStrategy, killMacro } from "../engine/combat";
import { atLevel, YouRobot } from "../lib";
import { Quest } from "../engine/task";
import { step } from "grimoire-kolmafia";
import { Priorities } from "../engine/priority";
import { councilSafe } from "./level12";
import { forceItemPossible, tryForceNC, tryPlayApriling } from "../engine/resources";
import { summonStrategy } from "./summons";
import { args } from "../args";

export const GiantQuest: Quest = {
  name: "Giant",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(10),
      completed: () => step("questL10Garbage") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      priority: () => (councilSafe() ? Priorities.Free : Priorities.BadMood),
      freeaction: true,
    },
    {
      // Use the cosplay saber (only) to guarentee the last sonar if we need to
      name: "Force Bean",
      after: ["Bat/Use Sonar 2"],
      completed: () =>
        have($item`enchanted bean`) ||
        step("questL10Garbage") >= 1 ||
        step("questL04Bat") + itemAmount($item`sonar-in-a-biscuit`) >= 3 ||
        !have($item`Fourth of May Cosplay Saber`),
      do: $location`The Beanbat Chamber`,
      outfit: {
        modifier: "item",
        equip: $items`miniature crystal ball`,
        avoid: $items`broken champagne bottle`,
      },
      combat: new CombatStrategy()
        .kill($monster`screambat`)
        .kill()
        .forceItems($monsters`magical fruit bat, musical fruit bat, beanbat`),
      limit: { soft: 10 },
    },
    {
      name: "Get Bean",
      after: ["Bat/Use Sonar 2", "Force Bean"],
      completed: () => have($item`enchanted bean`) || step("questL10Garbage") >= 1,
      do: $location`The Beanbat Chamber`,
      outfit: {
        modifier: "item",
        equip: $items`miniature crystal ball`,
        avoid: $items`broken champagne bottle`,
      },
      combat: new CombatStrategy()
        .kill($monster`screambat`)
        .banish($monsters`magical fruit bat, musical fruit bat`)
        .killItem($monster`beanbat`),
      limit: { soft: 10 },
    },
    {
      name: "Grow Beanstalk",
      after: ["Start", "Get Bean"],
      completed: () => step("questL10Garbage") >= 1,
      do: () => use($item`enchanted bean`),
      outfit: { equip: $items`spring shoes` },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Airship YR Healer",
      after: ["Grow Beanstalk"],
      prepare: () => tryPlayApriling("-combat"),
      completed: () => have($item`amulet of extreme plot significance`) || have($item`S.O.C.K.`),
      do: $location`The Penultimate Fantasy Airship`,
      choices: () => {
        return { 178: 2, 1387: 3 };
      },
      post: () => {
        if (have($effect`Temporary Amnesia`)) cliExecute("uneffect Temporary Amnesia");
      },
      orbtargets: () => {
        if (have($item`Fourth of May Cosplay Saber`) && !have($item`bat wings`)) {
          if (have($item`Mohawk wig`)) return $monsters`Quiet Healer`;
          else return $monsters`Quiet Healer, Burly Sidekick`;
        } else {
          return undefined; // Avoid orb dancing if we are using a real YR
        }
      },
      limit: { soft: 50 },
      delay: () =>
        have($item`Plastic Wrap Immateria`) ? 25 : have($item`Gauze Immateria`) ? 20 : 15, // After that, just look for noncombats
      outfit: () => {
        if (forceItemPossible())
          return { modifier: "-combat", avoid: $items`Kramco Sausage-o-Matic™`, equip: $items`bat wings` };
        else
          return {
            modifier: "-combat, item",
            avoid: $items`broken champagne bottle`,
            equip: $items`bat wings`
          };
      },
      combat: new CombatStrategy()
        .macro(() => {
          if (have($item`Mohawk wig`)) return new Macro();
          if (haveEquipped($item`Fourth of May Cosplay Saber`) && get("_saberForceUses") < 5)
            return Macro.skill($skill`Use the Force`);
          if (have($skill`Emotionally Chipped`) && get("_feelEnvyUsed") < 3)
            return Macro.skill($skill`Feel Envy`).step(killMacro());
          return new Macro();
        }, $monster`Burly Sidekick`)
        .forceItems($monster`Quiet Healer`),
    },
    {
      name: "Airship",
      after: ["Airship YR Healer"],
      completed: () => have($item`S.O.C.K.`),
      do: $location`The Penultimate Fantasy Airship`,
      choices: () => {
        return { 178: 2 };
      },
      post: () => {
        if (have($effect`Temporary Amnesia`)) cliExecute("uneffect Temporary Amnesia");
      },
      orbtargets: () => [],
      outfit: () => {
        if (get("_saberForceUses") < 5 && !have($item`Mohawk wig`) && !have($item`bat wings`)) {
          return {
            modifier: "-combat",
            weapon: $item`Fourth of May Cosplay Saber`,
            avoid: $items`Kramco Sausage-o-Matic™`,
            equip: $items`bat wings`,
          };
        } else {
          return {
            modifier: "-combat",
            equip: $items`bat wings`,
          };
        }
      },
      limit: { soft: 50 },
      delay: () =>
        have($item`Plastic Wrap Immateria`) ? 25 : have($item`Gauze Immateria`) ? 20 : 15, // After that, just look for noncombats
      combat: new CombatStrategy().macro(() => {
        if (have($item`Mohawk wig`)) return new Macro();
        if (have($skill`Emotionally Chipped`) && get("_feelEnvyUsed") < 3)
          return Macro.skill($skill`Feel Envy`).step(killMacro());
        if (haveEquipped($item`Fourth of May Cosplay Saber`) && get("_saberForceUses") < 5 && !have($item`bat wings`))
          return Macro.skill($skill`Use the Force`);
        return new Macro();
      }, $monster`Burly Sidekick`),
    },
    {
      name: "Basement Search",
      after: ["Airship"],
      completed: () =>
        containsText(
          $location`The Castle in the Clouds in the Sky (Basement)`.noncombatQueue,
          "Mess Around with Gym"
        ) || step("questL10Garbage") >= 8,
      prepare: () => {
        tryForceNC();
        tryPlayApriling("-combat");
      },
      do: $location`The Castle in the Clouds in the Sky (Basement)`,
      outfit: () => {
        if (!have($effect`Citizen of a Zone`) && have($familiar`Patriotic Eagle`)) {
          return { modifier: "-combat", familiar: $familiar`Patriotic Eagle` };
        }
        return { modifier: "-combat" };
      },
      combat: new CombatStrategy().startingMacro(
        Macro.trySkill($skill`%fn, let's pledge allegiance to a Zone`)
      ),
      choices: { 670: 5, 669: 1, 671: 4 },
      ncforce: true,
      limit: { soft: 20 },
    },
    {
      name: "Basement Finish",
      after: ["Basement Search"],
      completed: () => step("questL10Garbage") >= 8,
      do: $location`The Castle in the Clouds in the Sky (Basement)`,
      outfit: { equip: $items`amulet of extreme plot significance` },
      choices: { 670: 4 },
      limit: { tries: 1 },
    },
    {
      name: "Ground",
      after: ["Basement Finish"],
      prepare: () => tryPlayApriling("-combat"),
      completed: () => step("questL10Garbage") >= 9,
      do: $location`The Castle in the Clouds in the Sky (Ground Floor)`,
      choices: { 672: 3, 673: 3, 674: 3, 1026: 2 },
      outfit: () => {
        if (have($item`electric boning knife`)) return {};
        else return { modifier: "-combat" };
      },
      limit: { turns: 12 },
      delay: 10,
    },
    {
      name: "Ground Knife",
      after: ["Ground", "Tower/Wall of Meat"],
      completed: () =>
        have($item`electric boning knife`) ||
        step("questL13Final") > 8 ||
        have($item`Great Wolf's rocket launcher`) ||
        have($item`Drunkula's bell`) ||
        have($skill`Garbage Nova`),
      do: $location`The Castle in the Clouds in the Sky (Ground Floor)`,
      choices: { 672: 3, 673: 3, 674: 3, 1026: 2 },
      outfit: { modifier: "-combat" },
      limit: { soft: 20 },
      delay: 10,
    },
    {
      name: "Top Floor",
      after: ["Ground"],
      prepare: () => tryPlayApriling("-combat"),
      ready: () => !have($item`Mohawk wig`) || YouRobot.canUse($slot`hat`),
      completed: () => step("questL10Garbage") >= 10,
      do: $location`The Castle in the Clouds in the Sky (Top Floor)`,
      outfit: { equip: $items`Mohawk wig`, modifier: "-combat" },
      orbtargets: () => [],
      combat: new CombatStrategy().killHard($monster`Burning Snake of Fire`),
      choices: () => {
        return {
          675: 4,
          676: 4,
          677: 1,
          678: 1,
          679: 1,
          1431: haveEquipped($item`Mohawk wig`) ? 4 : 1,
        };
      },
      limit: { soft: 20 },
    },
    {
      name: "Finish",
      after: ["Top Floor"],
      priority: () => (councilSafe() ? Priorities.Free : Priorities.BadMood),
      completed: () => step("questL10Garbage") === 999,
      do: () => visitUrl("council.php"),
      limit: { soft: 10 },
      freeaction: true,
    },
    {
      name: "Unlock HITS",
      after: ["Top Floor"],
      ready: () => !canSkipHITS(),
      completed: () =>
        have($item`steam-powered model rocketship`) ||
        (have($item`star chart`) && itemAmount($item`star`) >= 8 && itemAmount($item`line`) >= 7) ||
        have($item`Richard's star key`) ||
        get("nsTowerDoorKeysUsed").includes("Richard's star key"),
      do: $location`The Castle in the Clouds in the Sky (Top Floor)`,
      outfit: { modifier: "-combat" },
      combat: new CombatStrategy().killHard($monster`Burning Snake of Fire`),
      choices: { 675: 4, 676: 4, 677: 2, 678: 3, 679: 1, 1431: 4 },
      limit: { soft: 20 },
    },
  ],
};

export function canSkipHITS() {
  if (myDaycount() > 1 && step("questL11Shen") <= 5) return false;
  if (have($item`Richard's star key`)) return true;
  if (get("nsTowerDoorKeysUsed").includes("Richard's star key")) return true;

  if (!have($item`star chart`)) {
    if (!have($item`Cargo Cultist Shorts`)) return false;
    if (!have($item`greasy desk bell`) && get("_cargoPocketEmptied")) return false;
  }
  if (itemAmount($item`star`) < 8 || itemAmount($item`line`) < 7) {
    if (summonStrategy.getSourceFor($monster`Camel's Toe`) === undefined) return false;
    if (!have($familiar`Melodramedary`) && args.minor.skipbackups) return false;
  }
  return true;
}
