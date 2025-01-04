import { itemAmount, myAdventures, myDaycount, numericModifier, use, visitUrl } from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  ensureEffect,
  get,
  have,
  Macro,
} from "libram";
import { Quest } from "../engine/task";
import { Outfit, step } from "grimoire-kolmafia";
import { Priorities } from "../engine/priority";
import { CombatStrategy, killMacro } from "../engine/combat";
import { atLevel, canLevelGoose, tryLevelGoose } from "../lib";
import { councilSafe } from "./level12";
import { stenchPlanner } from "../engine/outfit";

export const BatQuest: Quest = {
  name: "Bat",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(4),
      completed: () => step("questL04Bat") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      priority: () => (councilSafe() ? Priorities.Free : Priorities.BadMood),
      freeaction: true,
    },
    {
      name: "Bat Wings Sonar 1",
      priority: () => Priorities.Free,
      after: [],
      ready: () => have($item`bat wings`) && myAdventures() >= 1,
      completed: () => get("batWingsBatHoleEntrance", false),
      do: $location`The Bat Hole Entrance`,
      prepare: () => {
        if (numericModifier("stench resistance") < 1) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("stench resistance") < 1)
          throw `Unable to ensure stench res for guano junction`;
      },
      post: () => {
        if (have($item`sonar-in-a-biscuit`)) use($item`sonar-in-a-biscuit`);
      },
      outfit: { modifier: "10 stench res", equip: $items`bat wings` },
      limit: { tries: 1 },
    },
    {
      name: "Bat Wings Sonar 2",
      priority: () => Priorities.Free,
      after: ["Bat Wings Sonar 1"],
      ready: () => have($item`bat wings`) && myAdventures() >= 1,
      completed: () => get("batWingsGuanoJunction", false),
      do: $location`Guano Junction`,
      prepare: () => {
        if (numericModifier("stench resistance") < 1) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("stench resistance") < 1)
          throw `Unable to ensure stench res for guano junction`;
      },
      post: () => {
        if (have($item`sonar-in-a-biscuit`)) use($item`sonar-in-a-biscuit`);
      },
      outfit: { modifier: "10 stench res", equip: $items`bat wings` },
      limit: { tries: 1 },
    },
    {
      name: "Bat Wings Sonar 3",
      priority: () => Priorities.Free,
      after: ["Bat Wings Sonar 2"],
      ready: () => have($item`bat wings`) && myAdventures() >= 1,
      completed: () => get("batWingsBatratBurrow", false),
      do: $location`The Batrat and Ratbat Burrow`,
      prepare: () => {
        if (numericModifier("stench resistance") < 1) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("stench resistance") < 1)
          throw `Unable to ensure stench res for guano junction`;
      },
      post: () => {
        if (have($item`sonar-in-a-biscuit`)) use($item`sonar-in-a-biscuit`);
      },
      outfit: { modifier: "10 stench res", equip: $items`bat wings` },
      limit: { tries: 1 },
    },
    {
      name: "Bat Wings Bean",
      priority: () => Priorities.Free,
      after: ["Bat Wings Sonar 3"],
      ready: () => have($item`bat wings`) && myAdventures() >= 1,
      completed: () => get("batWingsBeanbatChamber", false),
      do: $location`The Beanbat Chamber`,
      prepare: () => {
        if (numericModifier("stench resistance") < 1) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("stench resistance") < 1)
          throw `Unable to ensure stench res for guano junction`;
      },
      post: () => {
        if (have($item`sonar-in-a-biscuit`)) use($item`sonar-in-a-biscuit`);
      },
      outfit: { modifier: "10 stench res", equip: $items`bat wings` },
      limit: { tries: 1 },
    },
    {
      name: "Get Sonar 1",
      after: [],
      priority: () => {
        const jar_needed =
          !have($item`killing jar`) &&
          !have($familiar`Melodramedary`) &&
          (get("gnasirProgress") & 4) === 0 &&
          get("desertExploration") < 100;
        if (
          jar_needed &&
          get("lastEncounter") === "banshee librarian" &&
          have($skill`Emotionally Chipped`) &&
          get("_feelEnvyUsed") < 3 &&
          get("_feelNostalgicUsed") < 3
        )
          return Priorities.Wanderer;
        else return Priorities.None;
      },
      completed: () => step("questL04Bat") + itemAmount($item`sonar-in-a-biscuit`) >= 1,
      do: $location`Guano Junction`,
      ready: () => stenchPlanner.maximumPossible(true) >= 1,
      prepare: () => {
        if (numericModifier("stench resistance") < 1) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("stench resistance") < 1)
          throw `Unable to ensure stench res for guano junction`;
      },
      post: () => {
        if (have($item`sonar-in-a-biscuit`)) use($item`sonar-in-a-biscuit`);
      },
      outfit: (): Outfit => {
        if (
          !have($skill`Comprehensive Cartography`) &&
          have($item`industrial fire extinguisher`) &&
          get("_fireExtinguisherCharge") >= 20 &&
          !get("fireExtinguisherBatHoleUsed")
        )
          return stenchPlanner.outfitFor(1, {
            equip: $items`industrial fire extinguisher`,
          });
        else return stenchPlanner.outfitFor(1, { modifier: "item" });
      },
      choices: { 1427: 1 },
      combat: new CombatStrategy()
        .macro(() => {
          const result = Macro.trySkill($skill`Fire Extinguisher: Zone Specific`);
          const jar_needed =
            !have($item`killing jar`) &&
            !have($familiar`Melodramedary`) &&
            (get("gnasirProgress") & 4) === 0 &&
            get("desertExploration") < 100;
          if (jar_needed && get("lastEncounter") === "banshee librarian") {
            return result
              .trySkill($skill`Feel Nostalgic`)
              .trySkill($skill`Feel Envy`)
              .step(killMacro());
          }
          return result;
        })
        .kill($monster`screambat`)
        .killItem(),
      limit: { tries: 10 },
    },
    {
      name: "Use Sonar 1",
      after: ["Get Sonar 1"],
      priority: () => Priorities.Free,
      completed: () => step("questL04Bat") >= 1,
      do: () => use($item`sonar-in-a-biscuit`),
      limit: { tries: 3 },
      freeaction: true,
    },
    {
      name: "Get Sonar 2",
      after: ["Use Sonar 1"],
      completed: () => step("questL04Bat") + itemAmount($item`sonar-in-a-biscuit`) >= 2,
      priority: () =>
        step("questL11Shen") === 999 ||
        have($item`The Stankara Stone`) ||
        (myDaycount() === 1 && step("questL11Shen") > 1)
          ? Priorities.None
          : Priorities.BadMood,
      prepare: () => {
        if (numericModifier("stench resistance") < 1) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("stench resistance") < 1)
          throw `Unable to ensure stench res for guano junction`;
      },
      do: $location`Guano Junction`,
      post: () => {
        if (have($item`sonar-in-a-biscuit`)) use($item`sonar-in-a-biscuit`);
      },
      outfit: { modifier: "item, 10 stench res" },
      combat: new CombatStrategy().kill($monster`screambat`).killItem(),
      limit: { tries: 10 },
    },
    {
      name: "Use Sonar 2",
      after: ["Get Sonar 2"],
      priority: () => Priorities.Free,
      completed: () => step("questL04Bat") >= 2,
      do: () => use($item`sonar-in-a-biscuit`),
      limit: { tries: 3 },
      freeaction: true,
    },
    {
      name: "Get Sonar 3",
      after: ["Use Sonar 2"],
      completed: () => step("questL04Bat") + itemAmount($item`sonar-in-a-biscuit`) >= 3,
      prepare: () => {
        if (numericModifier("stench resistance") < 1) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("stench resistance") < 1)
          throw `Unable to ensure stench res for guano junction`;
      },
      do: $location`Guano Junction`,
      post: () => {
        if (have($item`sonar-in-a-biscuit`)) use($item`sonar-in-a-biscuit`);
      },
      outfit: { modifier: "item, 10 stench res" },
      combat: new CombatStrategy().kill($monster`screambat`).killItem(),
      limit: { tries: 10 },
    },
    {
      name: "Use Sonar 3",
      after: ["Get Sonar 3"],
      priority: () => Priorities.Free,
      completed: () => step("questL04Bat") >= 3,
      do: () => use($item`sonar-in-a-biscuit`),
      limit: { tries: 3 },
      freeaction: true,
    },
    {
      name: "Lobsterfrogman Drop",
      after: ["Use Sonar 3"],
      ready: () => get("lastCopyableMonster") === $monster`lobsterfrogman`,
      priority: () =>
        get("lastCopyableMonster") === $monster`lobsterfrogman`
          ? Priorities.LastCopyableMonster
          : Priorities.None,
      completed: () =>
        step("questL04Bat") >= 4 ||
        itemAmount($item`barrel of gunpowder`) >= 5 ||
        get("sidequestLighthouseCompleted") !== "none" ||
        !have($item`backup camera`) ||
        (have($item`Fourth of May Cosplay Saber`) &&
          (get("_saberForceUses") < 5 || get("_saberForceMonsterCount") > 0)),
      do: $location`The Boss Bat's Lair`,
      combat: new CombatStrategy()
        .macro(new Macro().trySkill($skill`Back-Up to your Last Enemy`))
        .kill($monsters`Boss Bat, lobsterfrogman`),
      outfit: { equip: $items`backup camera` },
      limit: { tries: 4 },
    },
    {
      name: "Boss Bat",
      after: ["Bat/Use Sonar 3", "Lobsterfrogman Drop"],
      priority: () => {
        if ($location`The Boss Bat's Lair`.turnsSpent < 4) return Priorities.None;
        return canLevelGoose(6);
      },
      completed: () => step("questL04Bat") >= 4,
      prepare: () => tryLevelGoose(6),
      do: $location`The Boss Bat's Lair`,
      outfit: () => {
        if ($location`The Boss Bat's Lair`.turnsSpent < 4) return {};
        return { familiar: $familiar`Grey Goose`, avoid: $items`miniature crystal ball` };
      },
      combat: new CombatStrategy()
        .macro(Macro.trySkill($skill`Emit Matter Duplicating Drones`), $monster`Boss Bot`)
        .killHard($monster`Boss Bot`)
        .ignore(),
      limit: { soft: 10 },
      delay: 6,
    },
    {
      name: "Finish",
      after: ["Boss Bat"],
      priority: () => (councilSafe() ? Priorities.Free : Priorities.BadMood),
      completed: () => step("questL04Bat") === 999,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
