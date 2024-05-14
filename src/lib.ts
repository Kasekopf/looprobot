import { step } from "grimoire-kolmafia";
import {
  appearanceRates,
  Item,
  Location,
  Monster,
  myFamiliar,
  myLevel,
  myPrimestat,
  myRobotEnergy,
  myRobotScraps,
  Phylum,
  print,
  round,
  Slot,
  visitUrl,
} from "kolmafia";
import { $familiar, $item, $location, $monsters, $skill, $slot, $stat, get, have, Snapper } from "libram";
import { makeValue, ValueFunctions } from "garbo-lib";

export function debug(message: string, color?: string): void {
  if (color) {
    print(message, color);
  } else {
    print(message);
  }
}

// From phccs
export function convertMilliseconds(milliseconds: number): string {
  const seconds = milliseconds / 1000;
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = Math.round((seconds - minutes * 60) * 1000) / 1000;
  const hours = Math.floor(minutes / 60);
  const minutesLeft = Math.round(minutes - hours * 60);
  return (
    (hours !== 0 ? `${hours} hours, ` : "") +
    (minutesLeft !== 0 ? `${minutesLeft} minutes, ` : "") +
    (secondsLeft !== 0 ? `${secondsLeft} seconds` : "")
  );
}

export function atLevel(level: number): boolean {
  return myLevel() >= level;
}

const legionForms = [
  $item`Loathing Legion abacus`,
  $item`Loathing Legion can opener`,
  $item`Loathing Legion chainsaw`,
  $item`Loathing Legion corkscrew`,
  $item`Loathing Legion defibrillator`,
  $item`Loathing Legion double prism`,
  $item`Loathing Legion electric knife`,
  $item`Loathing Legion flamethrower`,
  $item`Loathing Legion hammer`,
  $item`Loathing Legion helicopter`,
  $item`Loathing Legion jackhammer`,
  $item`Loathing Legion kitchen sink`,
  $item`Loathing Legion knife`,
  $item`Loathing Legion many-purpose hook`,
  $item`Loathing Legion moondial`,
  $item`Loathing Legion necktie`,
  $item`Loathing Legion pizza stone`,
  $item`Loathing Legion rollerblades`,
  $item`Loathing Legion tape measure`,
  $item`Loathing Legion tattoo needle`,
  $item`Loathing Legion universal screwdriver`,
];
export function haveLoathingLegion(): boolean {
  return legionForms.some((item) => have(item));
}

export function tuneSnapper(phylum: Phylum) {
  if (myFamiliar() === $familiar`Red-Nosed Snapper` && Snapper.getTrackedPhylum() !== phylum) {
    Snapper.trackPhylum(phylum);
  }
}

let cachedHaveFlorest: boolean | undefined = undefined;
export function haveFlorest(): boolean {
  if (step("questL02Larva") === -1) return false; // we cannot check yet
  if (cachedHaveFlorest === undefined) {
    const village = visitUrl("forestvillage.php");
    cachedHaveFlorest = village.includes("action=fv_friar");
  }
  return cachedHaveFlorest;
}

export function underStandard(): boolean {
  // Change when the path leaves Standard
  return false;
}

const microphoneForms = [
  $item`Loathing Idol Microphone`,
  $item`Loathing Idol Microphone (75% charged)`,
  $item`Loathing Idol Microphone (50% charged)`,
  $item`Loathing Idol Microphone (25% charged)`,
];
export function haveLoathingIdolMicrophone(): boolean {
  return microphoneForms.some((item) => have(item));
}

export function getMonsters(where?: Location): Monster[] {
  if (where === undefined) return [];
  if (where === $location`The VERY Unquiet Garves`) {
    // Workaround
    return $monsters`basic lihc, party skelteon, corpulent zobmie, grave rober zmobie, senile lihc, slick lihc, gluttonous ghuol, gaunt ghuol`;
  }
  return Object.entries(appearanceRates(where)) // Get the maximum HP in the location
    .filter((i) => i[1] > 0)
    .map((i) => Monster.get(i[0]));
}

export function primestatId(): number {
  switch (myPrimestat()) {
    case $stat`Muscle`:
      return 1;
    case $stat`Mysticality`:
      return 2;
    case $stat`Moxie`:
      return 3;
  }
  return 1;
}

export function cosmicBowlingBallReady() {
  return have($item`cosmic bowling ball`) || get("cosmicBowlingBallReturnCombats") === 0;
}

let _valueFunctions: ValueFunctions | undefined = undefined;
function garboValueFunctions(): ValueFunctions {
  if (!_valueFunctions) {
    _valueFunctions = makeValue({
      itemValues: new Map([[$item`fake hand`, 50000]]),
    });
  }
  return _valueFunctions;
}

export function garboValue(item: Item, useHistorical = false): number {
  return garboValueFunctions().value(item, useHistorical);
}

export function garboAverageValue(...items: Item[]): number {
  return garboValueFunctions().averageValue(...items);
}

type Upgrade = "robot_shirt" | "robot_energy" | "robot_potions";

export class YouRobot {
  static scrap(): number {
    return myRobotScraps();
  }

  static doScavenge(): void {
    visitUrl("place.php?whichplace=scrapheap&action=sh_scrounge");
  }

  static energy(): number {
    return myRobotEnergy();
  }

  static doCollectEnergy(): void {
    visitUrl("place.php?whichplace=scrapheap&action=sh_getpower");
  }

  static expectedEnergyNextCollect(): number {
    const raw = (25 + get("youRobotPoints")) * 0.85 ** get("_energyCollected");
    return round(raw);
  }

  static doChronolith(): void {
    visitUrl("place.php?whichplace=scrapheap&action=sh_chronobo");
  }

  static expectedChronolithCost(): number {
    return get("_chronolithNextCost");
  }

  static haveUpgrade(upgrade: Upgrade): boolean {
    return get("youRobotCPUUpgrades").includes(upgrade);
  }

  static getPartId(which: "top" | "left" | "right" | "bottom") {
    switch (which) {
      case "top":
        return get("youRobotTop");
      case "left":
        return get("youRobotLeft");
      case "right":
        return get("youRobotRight");
      case "bottom":
        return get("youRobotBottom");
    }
  }

  static switchPart(which: "top" | "left" | "right" | "bottom", id: number): boolean {
    if (this.getPartId(which) === id) return true;
    visitUrl("place.php?whichplace=scrapheap&action=sh_configure");
    visitUrl(`choice.php?whichchoice=1445&show=${which}`);
    visitUrl(`choice.php?whichchoice=1445&part=${which}&show=${which}&option=1&p=${id}`);
    return this.getPartId(which) === id;
  }

  static canUseFamiliar(): boolean {
    return this.getPartId("top") === 2;
  }

  static canUse(slot: Slot): boolean {
    if (slot === $slot`familiar`) return this.getPartId("top") === 2;
    if (slot === $slot`hat`) return this.getPartId("top") === 4;
    if (slot === $slot`weapon`) return this.getPartId("left") === 4;
    if (slot === $slot`off-hand`) return this.getPartId("right") === 4;
    if (slot === $slot`pants`) return this.getPartId("bottom") === 4;
    if (slot === $slot`shirt`)
      return have($skill`Torso Awareness`) || this.haveUpgrade("robot_shirt");
    return true;
  }
}
