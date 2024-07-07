import { $item, $items, $location, $skill, $slot, $stat, AutumnAton, get, have, set } from "libram";
import { Priorities } from "../engine/priority";
import { Quest } from "../engine/task";
import { atLevel, levelingStartCompleted, YouRobot } from "../lib";
import { Guards, step } from "grimoire-kolmafia";
import {
  ceil,
  cliExecute,
  itemAmount,
  myAdventures,
  myBasestat,
  myPrimestat,
  myTurncount,
  Stat,
  use,
} from "kolmafia";
import { flyersDone } from "./level12";
import { toTempPref } from "../args";

const BATTERIES = $items`battery (car), battery (lantern), battery (9-Volt), battery (D), battery (AA)`;
export const RobotQuest: Quest = {
  name: "Robot",
  tasks: [
    {
      name: "CPU Potions",
      after: [],
      priority: () => Priorities.Free,
      ready: () => YouRobot.energy() >= 50,
      completed: () => YouRobot.haveUpgrade("robot_potions"),
      do: () => YouRobot.doUpgrade("robot_potions"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "CPU Energy",
      after: ["CPU Potions"],
      priority: () => Priorities.Free,
      ready: () => YouRobot.energy() >= 50,
      completed: () => YouRobot.haveUpgrade("robot_energy"),
      do: () => YouRobot.doUpgrade("robot_energy"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "First Chronolith",
      after: ["CPU Potions", "CPU Energy"],
      priority: () => Priorities.Free,
      completed: () => myAdventures() > 5 || myTurncount() > 5,
      ready: () => YouRobot.energy() >= YouRobot.expectedChronolithCost(),
      do: () => YouRobot.doChronolith(),
      limit: {
        guard: Guards.create(
          () => myAdventures(),
          (adv) => adv < myAdventures()
        ),
      },
      freeaction: true,
    },
    {
      name: "CPU Shirt",
      after: ["CPU Potions", "CPU Energy", "First Chronolith"],
      priority: () => Priorities.Free,
      ready: () => YouRobot.energy() >= 50,
      completed: () => YouRobot.haveUpgrade("robot_shirt") || have($skill`Torso Awareness`),
      do: () => YouRobot.doUpgrade("robot_shirt"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Breakdown Batteries",
      after: ["Misc/Untinkerer Finish"],
      priority: () => Priorities.Free,
      completed: () => myTurncount() >= 1000,
      ready: () => BATTERIES.find((i) => have(i)) !== undefined,
      do: () => {
        for (const b of BATTERIES) {
          if (have(b)) cliExecute(`untinker ${b.name}`);
        }
      },
      limit: {
        guard: Guards.create(
          () => BATTERIES.reduce((sum, bat) => sum + itemAmount(bat), 0),
          (bat) => bat > BATTERIES.reduce((sum, bat) => sum + itemAmount(bat), 0)
        ),
      },
      freeaction: true,
    },
    {
      name: "Absorb AAA Battery",
      after: ["CPU Potions"],
      priority: () => Priorities.Free,
      completed: () => myTurncount() >= 1000,
      ready: () => have($item`battery (AAA)`) && YouRobot.energy() < 50,
      do: () => use($item`battery (AAA)`),
      limit: {
        guard: Guards.create(
          () => itemAmount($item`battery (AAA)`),
          (bat) => bat > itemAmount($item`battery (AAA)`)
        ),
      },
      freeaction: true,
    },
    {
      name: "Absorb Robo Battery",
      after: ["CPU Potions"],
      priority: () => Priorities.Free,
      completed: () => false,
      ready: () => have($item`robo-battery`),
      do: () => use($item`robo-battery`),
      limit: {
        guard: Guards.create(
          () => itemAmount($item`robo-battery`),
          (bat) => bat > itemAmount($item`robo-battery`)
        ),
      },
      freeaction: true,
    },
    {
      name: "Chronolith",
      after: ["CPU Potions", "CPU Energy", "CPU Shirt"],
      priority: () => Priorities.Free,
      completed: () => false,
      ready: () => YouRobot.energy() >= YouRobot.expectedChronolithCost() + statbotEnergyBuffer(),
      do: () => YouRobot.doChronolith(),
      limit: {
        guard: Guards.create(
          () => myAdventures(),
          (adv) => adv < myAdventures()
        ),
      },
      freeaction: true,
    },
    {
      name: "Scavenge",
      after: [],
      priority: () => Priorities.Start,
      ready: () => myAdventures() > 0,
      completed: () => {
        // Scavenge just enough to get 10 scrap total for Top-Familiar and Right-Scrap
        let scrapNeeded = 0;
        if (!YouRobot.canUseFamiliar() && !levelingStartCompleted()) scrapNeeded += 5;
        if (YouRobot.getPartId("right") !== 3 && !scrapBufferCompleted()) scrapNeeded += 5;
        // If moxie class, we need more scrap to get a way to attack
        // (or else KoL does not let us adventure in most zones)
        if (myPrimestat() === $stat`Moxie` && !YouRobot.canUse($slot`weapon`)) scrapNeeded += 15;
        return YouRobot.scrap() >= scrapNeeded;
      },
      do: () => YouRobot.doScavenge(),
      limit: { tries: myPrimestat() === $stat`Moxie` ? 5 : 3 },
      freeaction: true,
    },
    {
      name: "Equip Top Initial",
      after: [],
      priority: () => Priorities.Free,
      completed: () => YouRobot.canUseFamiliar() || levelingStartCompleted(),
      ready: () => YouRobot.scrap() >= 5,
      do: () => YouRobot.doSwitchPart("top", 2),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Equip Right Initial",
      after: ["Equip Top Initial"],
      priority: () => Priorities.Free,
      completed: () => YouRobot.getPartId("right") === 3 || scrapBufferCompleted(),
      ready: () => YouRobot.scrap() >= 5,
      do: () => YouRobot.doSwitchPart("right", 3),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Equip Left Initial",
      after: ["Equip Top Initial", "Equip Right Initial"],
      priority: () => Priorities.Free,
      completed: () => YouRobot.canUse($slot`weapon`),
      ready: () => YouRobot.scrap() >= 15,
      do: () => YouRobot.doSwitchPart("left", 4),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Equip Bottom Initial",
      after: ["Equip Top Initial", "Equip Right Initial", "Equip Left Initial"],
      priority: () => Priorities.Free,
      completed: () => YouRobot.canUse($slot`pants`),
      ready: () => YouRobot.scrap() >= 15,
      do: () => YouRobot.doSwitchPart("bottom", 4),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Equip Right Final",
      after: [
        "Equip Top Initial",
        "Equip Right Initial",
        "Equip Left Initial",
        "Equip Bottom Initial",
      ],
      priority: () => Priorities.Free,
      completed: () => YouRobot.canUse($slot`off-hand`),
      ready: () => YouRobot.scrap() >= 15 && scrapBufferCompleted(),
      do: () => YouRobot.doSwitchPart("right", 4),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Equip Hat Phase 1",
      after: ["Giant/Ground", "War/Outfit Frat"],
      priority: () => Priorities.Free,
      ready: () =>
        step("questL11Shen") >= 5 &&
        atLevel(12) &&
        myBasestat($stat`Moxie`) >= 70 &&
        myBasestat($stat`Mysticality`) >= 70,
      completed: () =>
        YouRobot.canUse($slot`hat`) ||
        (step("questL10Garbage") >= 10 &&
          (have($item`rock band flyers`) || get("sidequestArenaCompleted") !== "none")),
      do: () => YouRobot.doSwitchPart("top", 4),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Unequip Hat Phase 1",
      after: ["Equip Hat Phase 1", "Giant/Top Floor", "War/Flyers Start", "War/Junkyard End"],
      completed: () =>
        YouRobot.canUseFamiliar() || flyersDone() || get(toTempPref("hatSwapped1"), false),
      do: () => {
        YouRobot.doSwitchPart("top", 2);
        set(toTempPref("hatSwapped1"), true);
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Equip Hat Phase 2",
      after: ["Unequip Hat Phase 1", "Knob/Harem", "Crypt/Finish"],
      priority: () => (get("gooseDronesRemaining") > 0 ? Priorities.GoodDrone : Priorities.None),
      ready: () => flyersDone(),
      completed: () =>
        YouRobot.canUse($slot`hat`) ||
        (step("questL12War") === 999 && step("questL05Goblin") === 999),
      do: () => YouRobot.doSwitchPart("top", 4),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Unequip Hat Phase 2",
      after: ["Equip Hat Phase 2", "War/Boss Hippie", "Knob/King"],
      ready: () => $location`Sonofa Beach`.turnsSpent >= 1 || !AutumnAton.have(),
      completed: () => YouRobot.canUseFamiliar(),
      do: () => YouRobot.doSwitchPart("top", 2),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Statbot L11",
      ready: () => YouRobot.energy() >= YouRobot.expectedStatbotCost() && myTurncount() >= 10,
      completed: () => atLevel(11),
      do: () => YouRobot.doStatbot(myPrimestat()),
      limit: { tries: 10 },
      freeaction: true,
    },
    {
      name: "Statbot L12",
      after: ["Giant/Ground"],
      ready: () => YouRobot.energy() >= YouRobot.expectedStatbotCost() && myTurncount() >= 100,
      completed: () =>
        atLevel(12) && myBasestat($stat`Moxie`) >= 70 && myBasestat($stat`Mysticality`) >= 70,
      do: () => {
        if (!atLevel(12)) YouRobot.doStatbot(myPrimestat());
        else if (myBasestat($stat`Moxie`) < 70) YouRobot.doStatbot($stat`Moxie`);
        else if (myBasestat($stat`Mysticality`) < 70) YouRobot.doStatbot($stat`Mysticality`);
      },
      limit: { tries: 10 },
      freeaction: true,
    },
    {
      name: "Statbot L13",
      after: [
        "Mosquito/Finish",
        "Tavern/Finish",
        "Bat/Finish",
        "Knob/King",
        "Friar/Finish",
        "Crypt/Finish",
        "McLargeHuge/Finish",
        "Orc Chasm/Finish",
        "Giant/Finish",
        "Macguffin/Finish",
        "War/Boss Hippie",
      ],
      ready: () => YouRobot.energy() >= YouRobot.expectedStatbotCost(),
      completed: () => atLevel(13),
      do: () => YouRobot.doStatbot(myPrimestat()),
      limit: { tries: 4 },
      freeaction: true,
    },
  ],
};

function scrapBufferCompleted(): boolean {
  /**
   * Start the run by building up a scrap buffer of all needed scrap.
   * Do not use an off-hand until then.
   *
   * @return true once this scrap buffer is complete.
   */
  let scrapNeeded = 0;

  if (!YouRobot.canUse($slot`off-hand`)) scrapNeeded += 15;

  // We only need scrap to switch to a hat (and back) 3 times.
  if (
    step("questL10Garbage") < 20 ||
    (!have($item`rock band flyers`) && get("sidequestArenaCompleted") === "none")
  )
    scrapNeeded += 20;
  if (step("questL12War") < 999) scrapNeeded += 20;

  if (YouRobot.canUse($slot`hat`)) scrapNeeded -= 15; // we may be in the middle of a phase

  return YouRobot.scrap() >= scrapNeeded;
}

function statbotUsesNeeded(stat: Stat, goal: number) {
  if (myBasestat(stat) >= goal) return 0;
  return ceil((goal - myBasestat(stat)) / 5);
}

function statbotEnergyBuffer(): number {
  if (myTurncount() >= 300) {
    const cost = YouRobot.expectedStatbotCost(statbotUsesNeeded(myPrimestat(), 148));

    // Compute (a lower bound of) the energy from the remaining run
    let expectedEnergy = 0;
    if (step("questL11Pyramid") < 999) expectedEnergy += 14; // Ed
    // The hippy boss-killing tracking is a bit broken when it first dies
    if (step("warProgress") < 999 && get("hippiesDefeated") < 1000) expectedEnergy += 32; // Hippy boss
    if (step("questL04Bat") < 4) expectedEnergy += 32; // Bat boss
    const warFights = Math.ceil((1000 - get("hippiesDefeated")) / 32);
    expectedEnergy += 2 * warFights; // War

    if (expectedEnergy >= cost) return 0;
    else return cost - expectedEnergy;
  } else if (myAdventures() >= 25) {
    if (!atLevel(11)) return YouRobot.expectedStatbotCost(statbotUsesNeeded(myPrimestat(), 104));
    else
      return YouRobot.expectedStatbotCost(
        statbotUsesNeeded(myPrimestat(), 125) +
          statbotUsesNeeded($stat`Mysticality`, 70) +
          statbotUsesNeeded($stat`Moxie`, 70)
      );
  }
  return 0;
}
