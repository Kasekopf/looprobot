import {
  cliExecute,
  Effect,
  Familiar,
  familiarWeight,
  haveEquipped,
  Item,
  itemAmount,
  Location,
  Monster,
  myClass,
  myFamiliar,
  myFury,
  myMaxmp,
  myMeat,
  myMp,
  myTurncount,
  retrieveItem,
  Skill,
  totalTurnsPlayed,
  useSkill,
} from "kolmafia";
import {
  $class,
  $effect,
  $familiar,
  $item,
  $items,
  $monster,
  $skill,
  AprilingBandHelmet,
  CinchoDeMayo,
  Counter,
  get,
  getKramcoWandererChance,
  have,
  Macro,
  set,
  SourceTerminal,
} from "libram";
import {
  CombatResource as BaseCombatResource,
  DelayedMacro,
  OutfitSpec,
  step,
} from "grimoire-kolmafia";
import { atLevel } from "../lib";
import { args } from "../args";
import { killMacro } from "./combat";
import { BanishState } from "./state";
import { customRestoreMp } from "./moods";
import { oresNeeded } from "../tasks/level8";
import { Task } from "./task";

export interface Resource {
  name: string;
  available: () => boolean;
  prepare?: () => void;
  equip?: Item | Familiar | OutfitSpec | OutfitSpec[];
  effect?: Effect;
  chance?: () => number;
}

export type CombatResource = Resource & BaseCombatResource;

export type BanishSource = CombatResource &
  (
    | {
        do: Item | Skill;
      }
    | {
        do: Macro | DelayedMacro;
        tracker: Item | Skill;
      }
  );

function getTracker(source: BanishSource): Item | Skill {
  if ("tracker" in source) return source.tracker;
  return source.do;
}

const banishSources: BanishSource[] = [
  {
    name: "Bowl Curveball",
    available: () =>
      have($item`cosmic bowling ball`) || get("cosmicBowlingBallReturnCombats") === 0,
    do: $skill`Bowl a Curveball`,
  },
  {
    name: "Spring Shoes Kick Away",
    available: () => have($item`spring shoes`) && !have($effect`Everything Looks Green`),
    equip: $item`spring shoes`,
    do: Macro.skill($skill`Spring Kick`).skill($skill`Spring Away`),
    tracker: $skill`Spring Kick`,
  },
  {
    name: "Feel Hatred",
    available: () => get("_feelHatredUsed") < 3 && have($skill`Emotionally Chipped`),
    do: $skill`Feel Hatred`,
  },
  {
    name: "Latte",
    available: () =>
      (!get("_latteBanishUsed") || (get("_latteRefillsUsed") < 2 && myTurncount() < 1000)) && // Save one refill for aftercore
      have($item`latte lovers member's mug`),
    prepare: refillLatte,
    do: $skill`Throw Latte on Opponent`,
    equip: $item`latte lovers member's mug`,
  },
  {
    name: "Reflex Hammer",
    available: () => get("_reflexHammerUsed") < 3 && have($item`Lil' Doctor™ bag`),
    do: $skill`Reflex Hammer`,
    equip: $item`Lil' Doctor™ bag`,
  },
  {
    name: "Snokebomb",
    available: () => get("_snokebombUsed") < 3 && have($skill`Snokebomb`),
    prepare: () => {
      if (myMp() < 50 && myMaxmp() >= 50) customRestoreMp(50);
    },
    do: $skill`Snokebomb`,
    equip: [
      // for MP
      { equip: $items`sea salt scrubs` },
      { equip: $items`hopping socks` },
    ],
  },
  {
    name: "KGB dart",
    available: () =>
      get("_kgbTranquilizerDartUses") < 3 && have($item`Kremlin's Greatest Briefcase`),
    do: $skill`KGB tranquilizer dart`,
    equip: $item`Kremlin's Greatest Briefcase`,
  },
  {
    name: "Middle Finger",
    available: () => !get("_mafiaMiddleFingerRingUsed") && have($item`mafia middle finger ring`),
    do: $skill`Show them your ring`,
    equip: $item`mafia middle finger ring`,
  },
  {
    name: "Monkey Paw",
    available: () => have($item`cursed monkey's paw`) && get("_monkeyPawWishesUsed", 0) === 0,
    equip: $item`cursed monkey's paw`,
    do: $skill`Monkey Slap`,
  },
  {
    name: "Spring Shoes Kick",
    available: () => have($item`spring shoes`),
    equip: $item`spring shoes`,
    do: () => Macro.skill($skill`Spring Kick`).step(killMacro()),
    tracker: $skill`Spring Kick`,
  },
  {
    name: "Batter Up",
    available: () =>
      have($skill`Batter Up!`) && myClass() === $class`Seal Clubber` && myFury() >= 5,
    do: $skill`Batter Up!`,
    equip: { weapon: $item`seal-clubbing club` },
  },
];

// Return a list of all banishes not allocated to some available task
export function unusedBanishes(banishState: BanishState, tasks: Task[]): BanishSource[] {
  const used_banishes = new Set<Item | Skill>();
  for (const task of tasks) {
    if (task.combat === undefined) continue;
    if (task.ignore_banishes?.()) continue;
    for (const monster of task.combat.where("banish")) {
      const banished_with = banishState.already_banished.get(monster);
      if (banished_with !== undefined) used_banishes.add(banished_with);
    }
  }

  return banishSources.filter(
    (banish) => banish.available() && !used_banishes.has(getTracker(banish))
  );
}

export interface WandererSource extends Resource {
  monsters: Monster[] | (() => Monster[]);
  chance: () => number;
  action?: DelayedMacro;
  possible: () => boolean; // If it is possible to encounter this on accident in the current character state.
}

export const wandererSources: WandererSource[] = [
  {
    name: "VHS Tape (ML)",
    available: () =>
      Counter.get("Spooky VHS Tape Monster") <= 0 &&
      get("spookyVHSTapeMonster") === $monster`giant swarm of ghuol whelps`,
    equip: [
      {
        offhand: $item`barrel lid`,
        equip: $items`unbreakable umbrella, Jurassic Parka, backup camera`,
        modes: {
          parka: "spikolodon",
          backupcamera: "ml",
          umbrella: "broken",
        },
      },
      {
        equip: $items`unbreakable umbrella, Jurassic Parka, backup camera`,
        modes: {
          parka: "spikolodon",
          backupcamera: "ml",
          umbrella: "broken",
        },
      },
    ],
    monsters: () => [get("spookyVHSTapeMonster") ?? $monster`none`],
    chance: () => 1,
    possible: () => Counter.get("Spooky VHS Tape Monster") <= 0,
  },
  {
    name: "VHS Tape",
    available: () => Counter.get("Spooky VHS Tape Monster") <= 0,
    equip: [{}],
    monsters: () => [get("spookyVHSTapeMonster") ?? $monster`none`],
    chance: () => 1,
    possible: () => Counter.get("Spooky VHS Tape Monster") <= 0,
  },
  {
    name: "Digitize",
    available: () => SourceTerminal.have() && Counter.get("Digitize Monster") <= 0,
    equip: [
      { equip: $items`Space Trip safety headphones` },
      {
        equip: $items`unwrapped knock-off retro superhero cape`,
        modes: { retrocape: ["heck", "hold"] },
      },
      {},
    ],
    monsters: () => [get("_sourceTerminalDigitizeMonster") ?? $monster`none`],
    chance: () => 1,
    action: () => {
      if (
        familiarWeight($familiar`Grey Goose`) <= 10 &&
        get("_sourceTerminalDigitizeMonster") === $monster`sausage goblin`
      )
        return new Macro().trySkill($skill`Emit Matter Duplicating Drones`);
      else return new Macro();
    },
    possible: () => SourceTerminal.have() && Counter.get("Digitize Monster") <= 5,
  },
  {
    name: "Voted",
    available: () =>
      have($item`"I Voted!" sticker`) &&
      totalTurnsPlayed() % 11 === 1 &&
      get("lastVoteMonsterTurn") < totalTurnsPlayed() &&
      get("_voteFreeFights") < 3 &&
      myTurncount() > 2 &&
      atLevel(5) &&
      get("desertExploration") > 0, // wait until the desert starts
    equip: [
      {
        equip: $items`"I Voted!" sticker, unwrapped knock-off retro superhero cape`,
        modes: { retrocape: ["heck", "hold"] },
      },
      { equip: $items`"I Voted!" sticker` },
    ],
    monsters: [
      $monster`government bureaucrat`,
      $monster`terrible mutant`,
      $monster`angry ghost`,
      $monster`annoyed snake`,
      $monster`slime blob`,
    ],
    chance: () => 1, // when available
    possible: () => haveEquipped($item`"I Voted!" sticker`),
  },
  {
    name: "Cursed Magnifying Glass",
    available: () =>
      have($item`cursed magnifying glass`) &&
      get("_voidFreeFights") < 5 &&
      get("cursedMagnifyingGlassCount") >= 13,
    equip: $item`cursed magnifying glass`,
    monsters: [$monster`void guy`, $monster`void slab`, $monster`void spider`],
    chance: () => 1, // when available
    possible: () => haveEquipped($item`cursed magnifying glass`),
  },
  {
    name: "Goth",
    available: () => have($familiar`Artistic Goth Kid`) && get("_hipsterAdv") < 7,
    equip: $familiar`Artistic Goth Kid`,
    monsters: [
      $monster`Black Crayon Beast`,
      $monster`Black Crayon Beetle`,
      $monster`Black Crayon Constellation`,
      $monster`Black Crayon Golem`,
      $monster`Black Crayon Demon`,
      $monster`Black Crayon Man`,
      $monster`Black Crayon Elemental`,
      $monster`Black Crayon Crimbo Elf`,
      $monster`Black Crayon Fish`,
      $monster`Black Crayon Goblin`,
      $monster`Black Crayon Hippy`,
      $monster`Black Crayon Hobo`,
      $monster`Black Crayon Shambling Monstrosity`,
      $monster`Black Crayon Manloid`,
      $monster`Black Crayon Mer-kin`,
      $monster`Black Crayon Frat Orc`,
      $monster`Black Crayon Penguin`,
      $monster`Black Crayon Pirate`,
      $monster`Black Crayon Flower`,
      $monster`Black Crayon Slime`,
      $monster`Black Crayon Undead Thing`,
      $monster`Black Crayon Spiraling Shape`,
    ],
    chance: () => [0.5, 0.4, 0.3, 0.2, 0.1, 0.1, 0.1, 0][get("_hipsterAdv")],
    possible: () => myFamiliar() === $familiar`Artistic Goth Kid`,
  },
  {
    name: "Hipster",
    available: () => have($familiar`Mini-Hipster`) && get("_hipsterAdv") < 7,
    equip: $familiar`Mini-Hipster`,
    monsters: [
      $monster`angry bassist`,
      $monster`blue-haired girl`,
      $monster`evil ex-girlfriend`,
      $monster`peeved roommate`,
      $monster`random scenester`,
    ],
    chance: () => [0.5, 0.4, 0.3, 0.2, 0.1, 0.1, 0.1, 0][get("_hipsterAdv")],
    possible: () => myFamiliar() === $familiar`Mini-Hipster`,
  },
  {
    name: "Kramco + Candelabra",
    available: () =>
      have($item`Kramco Sausage-o-Matic™`) &&
      // eslint-disable-next-line libram/verify-constants
      have($item`Roman Candelabra`) &&
      // eslint-disable-next-line libram/verify-constants
      !have($effect`Everything Looks Purple`) &&
      have($familiar`Left-Hand Man`) &&
      myTurncount() > 5,
    equip: [
      // eslint-disable-next-line libram/verify-constants
      { equip: $items`Kramco Sausage-o-Matic™, Space Trip safety headphones, Roman Candelabra` },
      {
        // eslint-disable-next-line libram/verify-constants
        equip: $items`Kramco Sausage-o-Matic™, unwrapped knock-off retro superhero cape, Roman Candelabra`,
        modes: { retrocape: ["heck", "hold"] },
      },
    ],
    monsters: [$monster`sausage goblin`],
    chance: () => getKramcoWandererChance(),
    // eslint-disable-next-line libram/verify-constants
    action: Macro.trySkill($skill`Blow the Purple Candle!`)
      .attack()
      .repeat(),
    possible: () => haveEquipped($item`Kramco Sausage-o-Matic™`),
  },
  {
    name: "Kramco",
    available: () =>
      have($item`Kramco Sausage-o-Matic™`) &&
      // Start when there will be no waste from the goose for backups
      (myTurncount() > 5 ||
        familiarWeight($familiar`Grey Goose`) === 6 ||
        familiarWeight($familiar`Grey Goose`) === 7),
    equip: [
      { equip: $items`Kramco Sausage-o-Matic™, Space Trip safety headphones` },
      {
        equip: $items`Kramco Sausage-o-Matic™, unwrapped knock-off retro superhero cape`,
        modes: { retrocape: ["heck", "hold"] },
      },
      { equip: $items`Kramco Sausage-o-Matic™` },
    ],
    monsters: [$monster`sausage goblin`],
    chance: () => getKramcoWandererChance(),
    action: () => {
      const result = new Macro();
      if (
        familiarWeight($familiar`Grey Goose`) <= 7 &&
        haveEquipped($item`Space Trip safety headphones`) &&
        itemAmount($item`magical sausage casing`) < 15
      )
        result.trySkill($skill`Emit Matter Duplicating Drones`);
      return result;
    },
    possible: () => haveEquipped($item`Kramco Sausage-o-Matic™`),
  },
];

export function canChargeVoid(): boolean {
  return get("_voidFreeFights") < 5 && get("cursedMagnifyingGlassCount") < 13;
}

export interface RunawaySource extends CombatResource {
  do: Macro;
  banishes: boolean;
  chance: () => number;
}

export const runawayValue =
  have($item`Greatest American Pants`) || have($item`navel ring of navel gazing`)
    ? 0.8 * get("valueOfAdventure")
    : get("valueOfAdventure");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getRunawaySources(_location?: Location) {
  return [
    {
      name: "Latte (Refill)",
      available: () =>
        (!get("_latteBanishUsed") || get("_latteRefillsUsed") < 2) && // Save one refill for aftercore
        have($item`latte lovers member's mug`) &&
        shouldFinishLatte(),
      prepare: refillLatte,
      do: new Macro().skill($skill`Throw Latte on Opponent`),
      chance: () => 1,
      equip: $item`latte lovers member's mug`,
      banishes: true,
    },
    {
      name: "Bowl Curveball",
      available: () =>
        have($item`cosmic bowling ball`) || get("cosmicBowlingBallReturnCombats") === 0,
      do: new Macro().skill($skill`Bowl a Curveball`),
      chance: () => 1,
      banishes: true,
    },
    {
      name: "Spring Shoes",
      available: () => have($item`spring shoes`) && !have($effect`Everything Looks Green`),
      do: new Macro().skill($skill`Spring Away`),
      chance: () => 1,
      equip: $item`spring shoes`,
      banishes: false,
    },
    {
      name: "GAP",
      available: () => have($item`Greatest American Pants`),
      equip: $item`Greatest American Pants`,
      do: new Macro().runaway(),
      chance: () => (get("_navelRunaways") < 3 ? 1 : 0.2),
      banishes: false,
    },
    {
      name: "Navel Ring",
      available: () => have($item`navel ring of navel gazing`),
      equip: $item`navel ring of navel gazing`,
      do: new Macro().runaway(),
      chance: () => (get("_navelRunaways") < 3 ? 1 : 0.2),
      banishes: false,
    },
    {
      name: "Peppermint Parasol",
      available: () => have($item`peppermint parasol`) && get("_navelRunaways") < 9,
      do: new Macro().item($item`peppermint parasol`),
      chance: () => (get("_navelRunaways") < 3 ? 1 : 0.2),
      banishes: false,
    },
  ];
}

export interface FreekillSource extends CombatResource {
  do: Item | Skill;
}

export const freekillSources: FreekillSource[] = [
  {
    name: "Lil' Doctor™ bag",
    available: () => have($item`Lil' Doctor™ bag`) && get("_chestXRayUsed") < 3,
    do: $skill`Chest X-Ray`,
    equip: $item`Lil' Doctor™ bag`,
  },
  {
    name: "Gingerbread Mob Hit",
    available: () => have($skill`Gingerbread Mob Hit`) && !get("_gingerbreadMobHitUsed"),
    do: $skill`Gingerbread Mob Hit`,
  },
  {
    name: "Shattering Punch",
    available: () => have($skill`Shattering Punch`) && get("_shatteringPunchUsed") < 3,
    do: $skill`Shattering Punch`,
  },
  {
    name: "Replica bat-oomerang",
    available: () => have($item`replica bat-oomerang`) && get("_usedReplicaBatoomerang") < 3,
    do: $item`replica bat-oomerang`,
  },
  {
    name: "The Jokester's gun",
    available: () => have($item`The Jokester's gun`) && !get("_firedJokestersGun"),
    do: $skill`Fire the Jokester's Gun`,
    equip: $item`The Jokester's gun`,
  },
  {
    name: "Shadow Brick",
    available: () => have($item`shadow brick`) && get("_shadowBricksUsed") < 13,
    do: $item`shadow brick`,
  },
  {
    name: "Jurassic Parka",
    available: () =>
      have($skill`Torso Awareness`) &&
      have($item`Jurassic Parka`) &&
      !have($effect`Everything Looks Yellow`),
    equip: { equip: $items`Jurassic Parka`, modes: { parka: "dilophosaur" } },
    do: $skill`Spit jurassic acid`,
  },
];

/**
 * Return true if we have all of our final latte ingredients, but they are not in the latte.
 */
export function shouldFinishLatte(): boolean {
  if (!have($item`latte lovers member's mug`)) return false;
  if (myTurncount() >= 1000) return false;

  // Check that we have all the proper ingredients
  for (const ingredient of ["wing", "cajun", "vitamins"])
    if (!get("latteUnlocks").includes(ingredient)) return false;
  // Check that the latte is not already finished
  return !["Meat Drop: 40", "Combat Rate: 10", "Experience (familiar): 3"].every((modifier) =>
    get("latteModifier").includes(modifier)
  );
}

/**
 * Refill the latte, using as many final ingredients as possible.
 */
export function refillLatte(): void {
  if (!get("_latteBanishUsed")) return;
  const modifiers = [];
  if (get("latteUnlocks").includes("wing")) modifiers.push("wing");
  if (get("latteUnlocks").includes("cajun")) modifiers.push("cajun");
  if (get("latteUnlocks").includes("vitamins")) modifiers.push("vitamins");
  modifiers.push("cinnamon", "pumpkin", "vanilla"); // Always unlocked
  cliExecute(`latte refill ${modifiers.slice(0, 3).join(" ")}`);
}

export type YellowRaySource = CombatResource;
export const yellowRaySources: YellowRaySource[] = [
  {
    name: "Jurassic Parka",
    available: () => have($skill`Torso Awareness`) && have($item`Jurassic Parka`),
    equip: { equip: $items`Jurassic Parka`, modes: { parka: "dilophosaur" } },
    do: $skill`Spit jurassic acid`,
  },
  {
    name: "Yellow Rocket",
    available: () => myMeat() >= 250 && have($item`Clan VIP Lounge key`),
    prepare: () => retrieveItem($item`yellow rocket`),
    do: $item`yellow rocket`,
  },
  {
    name: "Retro Superhero Cape",
    available: () => have($item`unwrapped knock-off retro superhero cape`),
    equip: {
      equip: $items`unwrapped knock-off retro superhero cape`,
      modes: { retrocape: ["heck", "kiss"] },
    },
    do: $skill`Unleash the Devil's Kiss`,
  },
];

export function yellowRayPossible(): boolean {
  if (have($effect`Everything Looks Yellow`)) return false;
  return yellowRaySources.find((s) => s.available()) !== undefined;
}

export type ForceItemSource = CombatResource;
export const forceItemSources: ForceItemSource[] = [
  {
    name: "Saber",
    available: () => have($item`Fourth of May Cosplay Saber`) && get("_saberForceUses") < 5,
    prepare: () => set("choiceAdventure1387", 3),
    equip: $item`Fourth of May Cosplay Saber`,
    do: $skill`Use the Force`,
  },
  {
    name: "Envy",
    available: () => have($skill`Emotionally Chipped`) && get("_feelEnvyUsed") < 3,
    do: Macro.skill($skill`Feel Envy`).step(killMacro()),
  },
];

export function forceItemPossible(): boolean {
  return yellowRayPossible() || forceItemSources.find((s) => s.available()) !== undefined;
}

export type ForceNCSorce = CombatResource & { do: Macro };
export const forceNCSources: ForceNCSorce[] = [
  {
    name: "Parka",
    available: () =>
      have($skill`Torso Awareness`) &&
      have($item`Jurassic Parka`) &&
      get("_spikolodonSpikeUses") + args.minor.saveparka < 5,
    equip: { equip: $items`Jurassic Parka`, modes: { parka: "spikolodon" } },
    // Note the externalIf is evaluated only once (at script run)
    do: Macro.trySkill($skill`Summon Love Gnats`)
      .externalIf(!get("lovebugsUnlocked"), Macro.trySkill($skill`Sweat Flood`))
      .skill($skill`Launch spikolodon spikes`),
  },
];

export function forceNCPossible(): boolean {
  return (
    forceNCSources.find((s) => s.available()) !== undefined ||
    noncombatForceNCSources.find((s) => s.available()) !== undefined
  );
}

type ForceNCSource = {
  available: () => boolean;
  do: () => void;
};

const tuba = $item`Apriling band tuba`;

export const noncombatForceNCSources: ForceNCSource[] = [
  {
    available: () => (AprilingBandHelmet.canJoinSection() || have(tuba)) && tuba.dailyusesleft > 0,
    do: () => AprilingBandHelmet.play(tuba, true),
  },
  {
    available: () => CinchoDeMayo.currentCinch() >= 60,
    do: () => useSkill($skill`Cincho: Fiesta Exit`),
  },
];

export function tryForceNC(): boolean {
  if (get("noncombatForcerActive")) return true;
  noncombatForceNCSources.find((source) => source.available())?.do();
  return get("noncombatForcerActive");
}

export function tryPlayApriling(modifier: string): void {
  if (!AprilingBandHelmet.have()) return;

  if (modifier.includes("+combat")) {
    AprilingBandHelmet.conduct("Apriling Band Battle Cadence");
  }

  if (modifier.includes("-combat")) {
    if (get("noncombatForcerActive")) return;
    AprilingBandHelmet.conduct("Apriling Band Patrol Beat");
  }

  if (modifier.includes("food") || modifier.includes("booze")) {
    AprilingBandHelmet.conduct("Apriling Band Celebration Bop");
  }
}

export type BackupTarget = {
  monster: Monster;
  completed: () => boolean;
  outfit?: OutfitSpec | (() => OutfitSpec);
  combat?: Macro;
  limit_tries: number;
};
export const backupTargets: BackupTarget[] = [
  {
    monster: $monster`Camel's Toe`,
    completed: () =>
      (itemAmount($item`star`) >= 8 && itemAmount($item`line`) >= 7) ||
      have($item`Richard's star key`) ||
      get("nsTowerDoorKeysUsed").includes("Richard's star key") ||
      args.minor.skipbackups,
    outfit: { modifier: "item" },
    limit_tries: 3,
  },
  {
    monster: $monster`mountain man`,
    completed: () => oresNeeded() === 0 || args.minor.skipbackups,
    outfit: { modifier: "item" },
    limit_tries: 2,
  },
  {
    monster: $monster`sausage goblin`,
    completed: () =>
      itemAmount($item`magical sausage casing`) >= 12 ||
      myTurncount() > 10 ||
      step("questM20Necklace") >= 1,
    outfit: { familiar: $familiar`Grey Goose` },
    combat: Macro.trySkill($skill`Emit Matter Duplicating Drones`),
    limit_tries: 6,
  },
  {
    monster: $monster`ninja snowman assassin`,
    completed: () =>
      (have($item`ninja rope`) && have($item`ninja carabiner`) && have($item`ninja crampons`)) ||
      step("questL08Trapper") >= 3,
    outfit: {
      equip: $items`June cleaver, Jurassic Parka, unwrapped knock-off retro superhero cape`,
      modes: { retrocape: ["heck", "hold"] },
    },
    limit_tries: 2,
  },
  {
    monster: $monster`Eldritch Tentacle`,
    completed: () => args.minor.skipbackups,
    limit_tries: 16,
  },
];
