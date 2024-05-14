import { $item, $skill, $slot, $stat, get, have } from "libram";
import { Priorities } from "../engine/priority";
import { Quest } from "../engine/task";
import { YouRobot } from "../lib";
import { Guards, step } from "grimoire-kolmafia";
import { itemAmount, myAdventures, myBasestat, myPrimestat, use } from "kolmafia";

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
      name: "CPU Shirt",
      after: ["CPU Potions", "CPU Energy"],
      priority: () => Priorities.Free,
      ready: () => YouRobot.energy() >= 50 && myAdventures() >= 10,
      completed: () => YouRobot.haveUpgrade("robot_shirt") || have($skill`Torso Awareness`),
      do: () => YouRobot.doUpgrade("robot_shirt"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Absorb AAA Battery",
      after: ["CPU Potions"],
      priority: () => Priorities.Free,
      completed: () => false,
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
      ready: () => YouRobot.energy() >= YouRobot.expectedChronolithCost(),
      do: () => YouRobot.doChronolith(),
      limit: {
        guard: Guards.create(
          () => myAdventures(),
          (adv) => adv < myAdventures()
        ),
      },
    },
    {
      name: "Scavenge",
      after: [],
      completed: () => {
        // Scavenge just enough to get 10 scrap total for Top-Familiar and Right-Scrap
        let scrapNeeded = 0;
        if (!YouRobot.canUseFamiliar() && !levelingStartCompleted()) scrapNeeded += 5;
        if (YouRobot.getPartId("right") !== 3 && !scrapBufferCompleted()) scrapNeeded += 5;
        return YouRobot.scrap() >= scrapNeeded;
      },
      do: () => YouRobot.doScavenge(),
      limit: { tries: 3 },
    },
    {
      name: "Equip Top Initial",
      after: [],
      priority: () => Priorities.Free,
      completed: () => YouRobot.canUseFamiliar() || levelingStartCompleted(),
      ready: () => YouRobot.scrap() >= 5,
      do: () => YouRobot.doSwitchPart("top", 4),
      limit: { tries: 1 },
    },
    {
      name: "Equip Right Initial",
      after: ["Equip Top Initial"],
      priority: () => Priorities.Free,
      completed: () => YouRobot.getPartId("right") === 3 || scrapBufferCompleted(),
      ready: () => YouRobot.scrap() >= 5,
      do: () => YouRobot.doSwitchPart("right", 3),
      limit: { tries: 1 },
    },
    {
      name: "Equip Left Initial",
      after: ["Equip Top Initial", "Equip Right Initial"],
      priority: () => Priorities.Free,
      completed: () => YouRobot.canUse($slot`weapon`),
      ready: () => YouRobot.scrap() >= 15,
      do: () => YouRobot.doSwitchPart("left", 4),
      limit: { tries: 1 },
    },
    {
      name: "Equip Bottom Initial",
      after: ["Equip Top Initial", "Equip Right Initial", "Equip Bottom Initial"],
      priority: () => Priorities.Free,
      completed: () => YouRobot.canUse($slot`pants`),
      ready: () => YouRobot.scrap() >= 15,
      do: () => YouRobot.doSwitchPart("bottom", 4),
      limit: { tries: 1 },
    },
  ],
};

export function levelingStartCompleted(): boolean {
  /**
   * Start the run by leveling to L11 and leveling needed offstats to 70.
   * Keep using the Grey Goose familiar for most turns until then.
   *
   * @returns true once this leveling is complete.
   */
  return (
    myBasestat(myPrimestat()) >= 104 &&
    myBasestat($stat`Mysticality`) >= 70 &&
    myBasestat($stat`Moxie`) >= 70
  );
}

function scrapBufferCompleted(): boolean {
  /**
   * Start the run by building up a scrap buffer of all needed scrap.
   * Do not use an off-hand until then.
   *
   * @return true once this scrap buffer is complete.
   */
  let scrapNeeded = 0;

  // We only need scrap to switch to a hat (and back) 3 times.
  if (step("questL10Garbage") < 20) scrapNeeded += 20;
  if (!have($item`rock band flyers`) && get("sidequestArenaCompleted") === "none")
    scrapNeeded += 20;
  if (step("questL12War") < 999) scrapNeeded += 20;

  if (YouRobot.canUse($slot`hat`)) scrapNeeded -= 15; // we may be in the middle of a phase

  return YouRobot.scrap() >= scrapNeeded;
}
