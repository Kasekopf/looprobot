import {
  familiarWeight,
  haveEquipped,
  Location,
  Monster,
  myBasestat,
  myFamiliar,
  myPrimestat,
  Stat,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $skill,
  $slot,
  $stat,
  byStat,
  get,
  have,
  Macro,
  Switch,
} from "libram";
import { ActionDefaults, CombatStrategy as BaseCombatStrategy } from "grimoire-kolmafia";
import { atLevel, YouRobot } from "../lib";

const myActions = [
  "ignore", // Task doesn't care what happens
  "ignoreSoftBanish", // Do not seek out a banish, but it is advantageous to have it
  "ignoreNoBanish", // Task doesn't care what happens, as long as it is not banished
  "kill", // Task needs to kill it, with or without a free kill
  "killFree", // Task needs to kill it with a free kill
  "killHard", // Task needs to kill it without using a free kill (i.e., boss, or already free)
  "banish", // Task doesn't care what happens, but banishing is useful
  "abort", // Abort the macro and the script; an error has occured
  "killItem", // Kill with an item boost,
  "yellowRay", // Kill with a drop-everything YR action
  "forceItems", // Force items to drop with a YR or saber
] as const;
export type CombatActions = (typeof myActions)[number];
export class CombatStrategy extends BaseCombatStrategy.withActions(myActions) {}
export class MyActionDefaults implements ActionDefaults<CombatActions> {
  ignore(target?: Monster | Location) {
    return this.kill(target);
  }

  ignoreSoftBanish(target?: Monster | Location) {
    return this.ignore(target);
  }

  kill(target?: Monster | Location) {
    return killMacro(target);
  }

  killHard(target?: Monster | Location) {
    return killMacro(target, true);
  }

  ignoreNoBanish(target?: Monster | Location) {
    return this.kill(target);
  }

  killFree() {
    return this.abort();
  } // Abort if no resource provided

  banish(target?: Monster | Location) {
    return this.ignore(target);
  }

  abort() {
    return new Macro().abort();
  }

  killItem(target?: Monster | Location) {
    return this.kill(target);
  }

  yellowRay(target?: Monster | Location) {
    return this.killItem(target);
  }

  forceItems(target?: Monster | Location) {
    return this.killItem(target);
  }
}

function statToLevel(): Stat {
  if (myBasestat(myPrimestat()) < 104) return myPrimestat();
  if (myBasestat($stat`Moxie`) < 70) return $stat`Moxie`;
  if (myBasestat($stat`Mysticality`) < 70 && myPrimestat() !== $stat`Muscle`)
    return $stat`Mysticality`;
  return Stat.none;
}

const dartParts: Switch<string, string[]> = {
  Muscle: ["Wing", "Tentacle", "Face", "Handle", "Mouth", "Fin", "Ear"],
  Mysticality: [
    "Stem",
    "Tail",
    "Beak",
    "Shell",
    "Nothing",
    "Stern",
    "Foot",
    "Wall",
    "Ear",
    "Body",
    "Trunk",
  ],
  Moxie: ["Arm", "Wheel", "Eye"],
  default: [],
};

function attemptDartThrows(part: undefined | string | string[]): Macro {
  const result = new Macro();
  if (part === undefined) return result;

  const partList = typeof part === "string" ? [part] : part;
  for (const p of partList) {
    result.step(`while hasskill Darts: Throw at ${p}; skill Darts: Throw at ${p}; endwhile;`);
  }
  return result;
}

export function dartMacro(hard?: boolean): Macro {
  const result = new Macro();
  if (haveEquipped($item`Everfull Dart Holster`)) {
    if (!hard) result.trySkill($skill`Darts: Aim for the Bullseye`);

    if (!atLevel(12)) result.step(attemptDartThrows(byStat(dartParts)));
    result.step(attemptDartThrows("butt"));
    result.step(attemptDartThrows("torso"));
    if (get("_dartsLeft") >= 2) result.trySkill($skill`Darts: Throw at %part1`);
  }
  return result;
}

export function killMacro(target?: Monster | Location, hard?: boolean, withSlap = false): Macro {
  const result = new Macro();

  // Level with the Grey Goose if available
  if (myFamiliar() === $familiar`Grey Goose` && familiarWeight($familiar`Grey Goose`) >= 20) {
    switch (statToLevel()) {
      case $stat`Muscle`:
        result.trySkill($skill`Convert Matter to Protein`);
        break;
      case $stat`Mysticality`:
        result.trySkill($skill`Convert Matter to Energy`);
        break;
      case $stat`Moxie`:
        result.trySkill($skill`Convert Matter to Pomade`);
        break;
      case Stat.none:
        break;
    }
  }

  result.step(dartMacro(hard));
  if (withSlap) result.trySkill($skill`Monkey Slap`);
  result.trySkill($skill`Summon Love Mosquito`);

  if (haveEquipped($item`candy cane sword cane`) && have($effect`Shadow Affinity`))
    result.trySkill($skill`Surprisingly Sweet Slash`).trySkill($skill`Surprisingly Sweet Stab`);
  if (haveEquipped($item`June cleaver`)) return result.attack().repeat();
  else if (YouRobot.getPartId("bottom") === 2) return result.skill($skill`Crotch Burn`).repeat();
  else if (YouRobot.getPartId("left") === 1)
    return result.skill($skill`Swing Pound-O-Tron`).repeat();
  else if (YouRobot.canUse($slot`weapon`)) return result.attack().repeat();

  return result.attack().repeat();
  // throw `Unable to plan to kill this monster; try equipping a weapon`;
}
