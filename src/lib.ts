import { Guards, step } from "grimoire-kolmafia";
import {
  appearanceRates,
  cliExecute,
  familiarWeight,
  Item,
  Location,
  Monster,
  myAdventures,
  myBasestat,
  myFamiliar,
  myLevel,
  myPrimestat,
  myRobotEnergy,
  myRobotScraps,
  Phylum,
  print,
  runChoice,
  Slot,
  Stat,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $location,
  $monsters,
  $skill,
  $slot,
  $stat,
  AprilingBandHelmet,
  AugustScepter,
  get,
  getTodaysHolidayWanderers,
  have,
  Snapper,
} from "libram";
import { makeValue, ValueFunctions } from "garbo-lib";
import { Priority } from "./engine/task";
import { Priorities } from "./engine/priority";

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
    const raw = Math.min(25 + get("youRobotPoints"), 37) * 0.85 ** get("_energyCollected");
    // Return a lower bound since it rounds inconsistently (randomly?)
    return Math.floor(raw);
  }

  static doChronolith(): void {
    visitUrl("place.php?whichplace=scrapheap&action=sh_chronobo");
  }

  static expectedChronolithCost(): number {
    return get("_chronolithNextCost");
  }

  static doStatbot(stat: Stat) {
    visitUrl("place.php?whichplace=scrapheap&action=sh_upgrade");
    if (stat === $stat`Muscle`) runChoice(1);
    else if (stat === $stat`Mysticality`) runChoice(2);
    else if (stat === $stat`Moxie`) runChoice(3);
  }

  static expectedStatbotCost(uses = 1): number {
    return (10 + get("statbotUses")) * uses + ((uses - 1) * uses) / 2;
  }

  static haveUpgrade(upgrade: Upgrade): boolean {
    return get("youRobotCPUUpgrades").includes(upgrade);
  }

  static doUpgrade(upgrade: Upgrade): boolean {
    if (this.haveUpgrade(upgrade)) return true;
    visitUrl("place.php?whichplace=scrapheap&action=sh_configure");
    visitUrl("choice.php?whichchoice=1445&show=cpus");
    visitUrl(`choice.php?pwd&whichchoice=1445&part=cpus&show=cpus&option=2&p=${upgrade}`);
    return this.haveUpgrade(upgrade);
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

  static doSwitchPart(which: "top" | "left" | "right" | "bottom", id: number): boolean {
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

export function levelingStartCompleted(): boolean {
  /**
   * Start the run by leveling to L11 and leveling needed offstats to 70.
   * Keep using the Grey Goose familiar for most turns until then.
   *
   * @returns true once this leveling is complete.
   */
  return (
    myBasestat(myPrimestat()) >= 104 &&
    (myBasestat($stat`Mysticality`) >= 70 || myPrimestat() === $stat`Muscle`) &&
    myBasestat($stat`Moxie`) >= 70
  );
}

export const NO_ADVENTURE_SPENT = Guards.create(
  () => myAdventures(),
  (adv) => myAdventures() >= adv
);

export const NO_ADVENTURE_SPENT_OR_HOLIDAY = Guards.create(
  () => myAdventures(),
  (adv) => myAdventures() >= adv || getTodaysHolidayWanderers().length > 0
);

export function tryEnsureLucky(): boolean {
  if (have($effect`Lucky!`)) return true;
  if (have($item`11-leaf clover`)) {
    use($item`11-leaf clover`);
    return true;
  }
  if (AugustScepter.canCast(2)) {
    useSkill($skill`Aug. 2nd: Find an Eleven-Leaf Clover Day`);
    return true;
  }
  if (have($item`Eight Days a Week Pill Keeper`) && !get("_freePillKeeperUsed")) {
    cliExecute("pillkeeper lucky");
    return true;
  }
  return false;
}

export function isChronoWorthIt(): boolean {
  const currentAdventures = myAdventures();
  const currentPoints = Math.min(25 + get("youRobotPoints"), 37);
  let futureAdventures = currentAdventures;
  let currentEnergy = YouRobot.energy();
  let numEnergyCollects = get("_energyCollected");

  while (futureAdventures > 0 && numEnergyCollects < 15) {
    futureAdventures -= 1;
    // Use floor to be conservative for now,
    // since the observed gains are inconsistent (random rounding?)
    currentEnergy += Math.floor(currentPoints * 0.85 ** numEnergyCollects);
    numEnergyCollects += 1;

    if (currentEnergy >= YouRobot.expectedChronolithCost()) {
      break;
    }
  }

  return (
    currentEnergy >= YouRobot.expectedChronolithCost() && futureAdventures + 9 > currentAdventures
  );
}

export function canLevelGoose(goal = 6): Priority {
  if (!have($familiar`Grey Goose`)) return Priorities.None;
  if (familiarWeight($familiar`Grey Goose`) >= goal) return Priorities.GoodGoose;
  if (!have($item`Ghost Dog Chow`)) return Priorities.BadGoose;
  return Priorities.None;
}

export function tryLevelGoose(goal = 6): void {
  if (myFamiliar() !== $familiar`Grey Goose`) return;
  while (familiarWeight($familiar`Grey Goose`) < goal && have($item`Ghost Dog Chow`))
    use($item`Ghost Dog Chow`);
  if (
    familiarWeight($familiar`Grey Goose`) < goal &&
    have($item`Apriling band piccolo`) &&
    $item`Apriling band piccolo`.dailyusesleft > 0
  )
    AprilingBandHelmet.play($item`Apriling band piccolo`, true);
}
