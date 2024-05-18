import {
  buy,
  cliExecute,
  closetAmount,
  familiarWeight,
  Item,
  itemAmount,
  myAscensions,
  myFamiliar,
  myHash,
  myMeat,
  putCloset,
  takeCloset,
  use,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  get,
  have,
  Macro,
} from "libram";
import { Quest, Task } from "../engine/task";
import { OutfitSpec, step } from "grimoire-kolmafia";
import { Priorities } from "../engine/priority";
import { CombatStrategy, dartMacro } from "../engine/combat";
import { cosmicBowlingBallReady } from "../lib";
import { tryPlayApriling } from "../engine/resources";

function manualChoice(whichchoice: number, option: number) {
  return visitUrl(`choice.php?whichchoice=${whichchoice}&pwd=${myHash()}&option=${option}`);
}

const Temple: Task[] = [
  {
    name: "Forest Coin",
    after: ["Mosquito/Burn Delay"],
    prepare: () => {
      tryPlayApriling("-combat");
    },
    completed: () =>
      have($item`tree-holed coin`) ||
      have($item`Spooky Temple map`) ||
      step("questM16Temple") === 999,
    do: $location`The Spooky Forest`,
    choices: { 502: 2, 505: 2, 334: 1 },
    outfit: { modifier: "-combat" },
    limit: { soft: 10 },
  },
  {
    name: "Forest Map",
    after: ["Forest Coin"],
    prepare: () => {
      tryPlayApriling("-combat");
    },
    completed: () => have($item`Spooky Temple map`) || step("questM16Temple") === 999,
    do: $location`The Spooky Forest`,
    choices: { 502: 3, 506: 3, 507: 1, 334: 1 },
    outfit: { modifier: "-combat" },
    limit: { soft: 10 },
  },
  {
    name: "Forest Fertilizer",
    after: ["Mosquito/Burn Delay"],
    prepare: () => {
      tryPlayApriling("-combat");
    },
    completed: () => have($item`Spooky-Gro fertilizer`) || step("questM16Temple") === 999,
    do: $location`The Spooky Forest`,
    choices: { 502: 3, 506: 2, 507: 1, 334: 1 },
    outfit: { modifier: "-combat" },
    limit: { soft: 10 },
  },
  {
    name: "Forest Sapling",
    after: ["Mosquito/Burn Delay"],
    prepare: () => {
      tryPlayApriling("-combat");
    },
    completed: () => have($item`spooky sapling`) || step("questM16Temple") === 999,
    do: $location`The Spooky Forest`,
    choices: { 502: 1, 503: 3, 504: 3, 334: 1 },
    outfit: { modifier: "-combat" },
    limit: { soft: 10 },
  },
  {
    name: "Open Temple",
    after: ["Forest Coin", "Forest Map", "Forest Sapling", "Forest Fertilizer"],
    completed: () => step("questM16Temple") === 999,
    do: () => use($item`Spooky Temple map`),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Temple Wool",
    after: ["Open Temple", "Misc/Hermit Clover"],
    completed: () =>
      itemAmount($item`stone wool`) >= 2 ||
      (itemAmount($item`stone wool`) === 1 && have($item`the Nostril of the Serpent`)) ||
      step("questL11Worship") >= 3,
    prepare: () => {
      if (
        itemAmount($item`11-leaf clover`) > 1 &&
        !have($effect`Lucky!`) &&
        !have($item`industrial fire extinguisher`)
      )
        use($item`11-leaf clover`);
    },
    do: $location`The Hidden Temple`,
    outfit: () => {
      if (have($item`industrial fire extinguisher`) && get("_fireExtinguisherCharge") >= 10)
        return { equip: $items`industrial fire extinguisher`, modifier: "+combat" };
      else return { familiar: $familiar`Grey Goose`, modifier: "+combat, item" };
    },
    combat: new CombatStrategy()
      .macro(
        new Macro()
          .trySkill($skill`Fire Extinguisher: Polar Vortex`)
          .trySkill($skill`Fire Extinguisher: Polar Vortex`),
        $monster`baa-relief sheep`
      )
      .macro(new Macro().trySkill($skill`Emit Matter Duplicating Drones`), $monster`Baa'baa'bu'ran`)
      .killItem([$monster`baa-relief sheep`, $monster`Baa'baa'bu'ran`]),
    choices: { 579: 2, 580: 1, 581: 3, 582: 1 },
    limit: { soft: 20 },
  },
  {
    name: "Temple Nostril",
    after: ["Open Temple", "Temple Wool"],
    completed: () => have($item`the Nostril of the Serpent`) || step("questL11Worship") >= 3,
    do: $location`The Hidden Temple`,
    choices: { 579: 2, 582: 1 },
    effects: $effects`Stone-Faced`,
    limit: { tries: 1 },
  },
  {
    name: "Open City",
    after: ["Temple Nostril", "Macguffin/Diary"],
    acquire: [{ item: $item`stone wool` }],
    completed: () => step("questL11Worship") >= 3,
    do: () => {
      visitUrl("adventure.php?snarfblat=280");
      manualChoice(582, 2);
      manualChoice(580, 2);
      manualChoice(584, 4);
      manualChoice(580, 1);
      manualChoice(123, 2);
      visitUrl("choice.php");
      cliExecute("dvorak");
      manualChoice(125, 3);
    },
    outfit: { avoid: $items`June cleaver` },
    effects: $effects`Stone-Faced`,
    limit: { tries: 1 },
  },
];

const Apartment: Task[] = [
  {
    name: "Open Apartment",
    after: ["Get Machete", "Open City"],
    completed: () => get("hiddenApartmentProgress") >= 1,
    do: $location`An Overgrown Shrine (Northwest)`,
    outfit: {
      equip: $items`muculent machete`,
    },
    combat: new CombatStrategy().killHard().autoattack(() => dartMacro(false)),
    choices: { 781: 1 },
    limit: { tries: 4 },
    freecombat: true,
    acquire: [{ item: $item`muculent machete` }],
  },
  {
    name: "Apartment Files", // Get the last McClusky files here if needed, as a backup plan
    after: ["Open Apartment", "Office Files", "Banish Janitors"],
    priority: () =>
      have($effect`Once-Cursed`) || have($effect`Twice-Cursed`) || have($effect`Thrice-Cursed`)
        ? Priorities.Effect
        : Priorities.None,
    completed: () =>
      have($item`McClusky file (page 5)`) ||
      have($item`McClusky file (complete)`) ||
      get("hiddenOfficeProgress") >= 7,
    do: $location`The Hidden Apartment Building`,
    combat: new CombatStrategy()
      .killHard($monster`ancient protector spirit (The Hidden Apartment Building)`)
      .kill($monster`pygmy witch accountant`)
      .banish($monster`pygmy janitor`)
      .banish($monster`pygmy witch lawyer`)
      .ignoreNoBanish($monster`pygmy shaman`)
      .ignore(),
    orbtargets: () => {
      if (have($effect`Thrice-Cursed`)) return [$monster`pygmy witch accountant`];
      else return [$monster`pygmy shaman`, $monster`pygmy witch accountant`];
    },
    post: makeCompleteFile,
    outfit: { equip: $items`miniature crystal ball` },
    limit: { soft: 9 },
    choices: { 780: 1 },
  },
  {
    name: "Apartment",
    after: ["Open Apartment", "Apartment Files"], // Wait until after all needed pygmy witch lawyers are done
    priority: () =>
      have($effect`Once-Cursed`) || have($effect`Twice-Cursed`) || have($effect`Thrice-Cursed`)
        ? Priorities.MinorEffect
        : Priorities.None,
    completed: () => get("hiddenApartmentProgress") >= 7,
    do: $location`The Hidden Apartment Building`,
    combat: new CombatStrategy()
      .killHard($monster`ancient protector spirit (The Hidden Apartment Building)`)
      .banish($monster`pygmy janitor`)
      .banish($monsters`pygmy witch lawyer, pygmy witch accountant`)
      .ignoreNoBanish($monster`pygmy shaman`)
      .ignore(),
    orbtargets: () => {
      if (have($effect`Thrice-Cursed`)) return [];
      else return [$monster`pygmy shaman`];
    },
    post: makeCompleteFile,
    outfit: () => {
      if (have($effect`Twice-Cursed`) && $location`The Hidden Apartment Building`.turnsSpent === 8)
        return { equip: $items`candy cane sword cane, miniature crystal ball` };
      return { equip: $items`miniature crystal ball` };
    },
    choices: { 780: 1 },
    limit: { soft: 9 },
  },
  {
    name: "Finish Apartment",
    after: ["Apartment"],
    completed: () => get("hiddenApartmentProgress") >= 8,
    do: $location`An Overgrown Shrine (Northwest)`,
    choices: { 781: 2 },
    limit: { tries: 1 },
    freeaction: true,
  },
];

const Office: Task[] = [
  {
    name: "Open Office",
    after: ["Get Machete", "Open City"],
    completed: () => get("hiddenOfficeProgress") >= 1,
    do: $location`An Overgrown Shrine (Northeast)`,
    combat: new CombatStrategy().killHard().autoattack(() => dartMacro(false)),
    outfit: {
      equip: $items`muculent machete`,
    },
    choices: { 785: 1 },
    limit: { tries: 4 },
    freecombat: true,
    acquire: [{ item: $item`muculent machete` }],
  },
  {
    name: "Office Files",
    after: ["Open Office", "Banish Janitors"],
    completed: () =>
      (have($item`McClusky file (page 1)`) &&
        have($item`McClusky file (page 2)`) &&
        have($item`McClusky file (page 3)`) &&
        have($item`McClusky file (page 4)`) &&
        have($item`McClusky file (page 5)`)) ||
      have($item`McClusky file (complete)`) ||
      get("hiddenOfficeProgress") >= 7 ||
      $location`The Hidden Office Building`.turnsSpent >= 10,
    do: $location`The Hidden Office Building`,
    post: makeCompleteFile,
    combat: new CombatStrategy()
      .kill($monster`pygmy witch accountant`)
      .banish($monster`pygmy janitor`)
      .banish($monsters`pygmy headhunter, pygmy witch lawyer`),
    choices: { 786: 2 },
    limit: { soft: 10 },
  },
  {
    name: "Office Clip",
    after: ["Office Files", "Apartment Files"],
    completed: () =>
      have($item`boring binder clip`) ||
      have($item`McClusky file (complete)`) ||
      get("hiddenOfficeProgress") >= 7,
    do: $location`The Hidden Office Building`,
    post: makeCompleteFile,
    choices: { 786: 2 },
    combat: new CombatStrategy().ignore(),
    limit: { tries: 6 },
  },
  {
    name: "Office Boss",
    after: ["Office Clip"],
    completed: () => get("hiddenOfficeProgress") >= 7,
    do: $location`The Hidden Office Building`,
    post: makeCompleteFile,
    choices: { 786: 1 },
    combat: new CombatStrategy()
      .killHard($monster`ancient protector spirit (The Hidden Office Building)`)
      .ignore()
      .macro(() => {
        const palindome_dudes_done = have(Item.get(7262)) || step("questL11Palindome") >= 3;
        if (
          (get("banishedPhyla").includes("beast") || get("banishedPhyla") === "") &&
          officeBanishesDone() &&
          palindome_dudes_done
        ) {
          return Macro.trySkill($skill`%fn, Release the Patriotic Screech!`);
        }
        return new Macro();
      }, $monsters`pygmy headhunter, pygmy janitor, pygmy witch accountant, pygmy witch lawyer`),
    outfit: () => {
      const palindome_dudes_done = have(Item.get(7262)) || step("questL11Palindome") >= 3;
      if (
        (get("banishedPhyla").includes("beast") || get("banishedPhyla") === "") &&
        officeBanishesDone() &&
        palindome_dudes_done
      )
        return { familiar: $familiar`Patriotic Eagle` };
      return {};
    },
    orbtargets: () => [],
    limit: { soft: 10 },
  },
  {
    name: "Finish Office",
    after: ["Office Boss"],
    completed: () => get("hiddenOfficeProgress") >= 8,
    do: $location`An Overgrown Shrine (Northeast)`,
    choices: { 785: 2 },
    limit: { tries: 1 },
    freeaction: true,
  },
];

const Hospital: Task[] = [
  {
    name: "Open Hospital",
    after: ["Get Machete", "Open City"],
    completed: () => get("hiddenHospitalProgress") >= 1,
    do: $location`An Overgrown Shrine (Southwest)`,
    combat: new CombatStrategy().killHard().autoattack(() => dartMacro(false)),
    outfit: {
      equip: $items`muculent machete`,
    },
    choices: { 783: 1 },
    limit: { tries: 4 },
    freecombat: true,
    acquire: [{ item: $item`muculent machete` }],
  },
  {
    name: "Hospital",
    after: ["Open Hospital", "Banish Janitors"],
    completed: () => get("hiddenHospitalProgress") >= 7,
    do: $location`The Hidden Hospital`,
    combat: new CombatStrategy()
      .startingMacro(Macro.trySkill($skill`%fn, let's pledge allegiance to a Zone`))
      .killHard($monster`ancient protector spirit (The Hidden Hospital)`)
      .kill($monster`pygmy witch surgeon`)
      .banish($monster`pygmy janitor`)
      .banish($monsters`pygmy orderlies, pygmy witch nurse`),
    outfit: () => {
      const result = <OutfitSpec>{
        shirt: have($skill`Torso Awareness`) ? $item`surgical apron` : undefined,
        equip: $items`half-size scalpel, head mirror, surgical mask, bloodied surgical dungarees`,
      };
      if (!have($effect`Citizen of a Zone`) && have($familiar`Patriotic Eagle`)) {
        result.familiar = $familiar`Patriotic Eagle`;
      }
      return result;
    },
    choices: { 784: 1 },
    limit: { soft: 20 },
  },
  {
    name: "Finish Hospital",
    after: ["Hospital"],
    completed: () => get("hiddenHospitalProgress") >= 8,
    do: $location`An Overgrown Shrine (Southwest)`,
    choices: { 783: 2 },
    limit: { tries: 1 },
    freeaction: true,
  },
];

const Bowling: Task[] = [
  {
    name: "Open Bowling",
    after: ["Get Machete", "Open City"],
    completed: () => get("hiddenBowlingAlleyProgress") >= 1,
    do: $location`An Overgrown Shrine (Southeast)`,
    combat: new CombatStrategy().killHard().autoattack(() => dartMacro(false)),
    outfit: {
      equip: $items`muculent machete`,
    },
    choices: { 787: 1 },
    limit: { tries: 4 },
    freecombat: true,
    acquire: [{ item: $item`muculent machete` }],
  },
  {
    name: "Bowling",
    after: ["Open Bowling", "Banish Janitors"],
    priority: () =>
      cosmicBowlingBallReady() && get("hiddenBowlingAlleyProgress") < 2
        ? Priorities.BestCosmicBowlingBall
        : Priorities.None,
    ready: () =>
      myMeat() >= 500 &&
      (!bowlingBallsGathered() || get("spookyVHSTapeMonster") !== $monster`pygmy bowler`),
    acquire: [{ item: $item`Bowl of Scorpions`, optional: true }],
    completed: () => get("hiddenBowlingAlleyProgress") >= 7,
    prepare: () => {
      // Open the hidden tavern if it is available.
      if (get("hiddenTavernUnlock") < myAscensions() && have($item`book of matches`)) {
        use($item`book of matches`);
        buy($item`Bowl of Scorpions`);
      }
      // Backload the bowling balls due to banish timers
      if (!bowlingBallsGathered()) {
        if (have($item`bowling ball`))
          putCloset($item`bowling ball`, itemAmount($item`bowling ball`));
      } else {
        if (closetAmount($item`bowling ball`) > 0)
          takeCloset($item`bowling ball`, closetAmount($item`bowling ball`));
      }
      if (
        myFamiliar() === $familiar`Grey Goose` &&
        familiarWeight($familiar`Grey Goose`) < 6 &&
        have($item`Ghost Dog Chow`)
      )
        use($item`Ghost Dog Chow`);
    },
    do: $location`The Hidden Bowling Alley`,
    combat: new CombatStrategy()
      .killHard($monster`ancient protector spirit (The Hidden Bowling Alley)`)
      .killItem($monster`pygmy bowler`)
      .macro(() =>
        get("hiddenBowlingAlleyProgress") < 2
          ? Macro.tryItem($item`cosmic bowling ball`)
          : new Macro()
      )
      .macro(() => {
        return Macro.tryItem($item`Spooky VHS Tape`).trySkill(
          $skill`Emit Matter Duplicating Drones`
        );
      }, $monster`pygmy bowler`)
      .banish($monster`pygmy janitor`)
      .banish($monster`pygmy orderlies`),
    outfit: () => {
      const result: OutfitSpec = {
        equip: $items`Space Trip safety headphones`,
        modifier: "item",
        avoid: $items`broken champagne bottle`,
      };
      if (
        have($familiar`Grey Goose`) &&
        (familiarWeight($familiar`Grey Goose`) >= 6 || have($item`Ghost Dog Chow`))
      ) {
        result.familiar = $familiar`Grey Goose`;
      }

      if (bowlingBallsGathered() && !get("candyCaneSwordBowlingAlley", false)) {
        result.equip?.push($item`candy cane sword cane`);
      }
      return result;
    },
    ignore_banishes: () => bowlingBallsGathered(),
    choices: { 788: 1 },
    limit: { soft: 25 },
  },
  {
    name: "Finish Bowling",
    after: ["Bowling"],
    completed: () => get("hiddenBowlingAlleyProgress") >= 8,
    do: $location`An Overgrown Shrine (Southeast)`,
    choices: { 787: 2 },
    limit: { tries: 1 },
    freeaction: true,
  },
];

function bowlingBallsGathered(): boolean {
  let balls = 0;
  balls += itemAmount($item`bowling ball`);
  balls += closetAmount($item`bowling ball`);
  if (get("spookyVHSTapeMonster") === $monster`pygmy bowler`) balls += 1;
  if (have($item`candy cane sword cane`) && !get("candyCaneSwordBowlingAlley", false)) balls += 1;

  const timesBowled = get("hiddenBowlingAlleyProgress") - 1;
  return timesBowled + balls >= 5;
}

export const HiddenQuest: Quest = {
  name: "Hidden City",
  tasks: [
    ...Temple,
    {
      name: "Get Machete",
      after: ["Open City"],
      completed: () => have($item`muculent machete`) || have($item`antique machete`),
      do: $location`The Hidden Park`,
      outfit: { modifier: "-combat" },
      choices: { 789: 2 },
      limit: { soft: 10 },
    },
    ...Office,
    ...Apartment,
    ...Hospital,
    ...Bowling,
    {
      name: "Banish Janitors",
      after: ["Open City"],
      completed: () =>
        get("relocatePygmyJanitor") === myAscensions() || have($skill`Emotionally Chipped`),
      do: $location`The Hidden Park`,
      outfit: { modifier: "-combat" },
      choices: { 789: 2 },
      limit: { soft: 15 },
    },
    {
      name: "Boss",
      after: ["Finish Office", "Finish Apartment", "Finish Hospital", "Finish Bowling"],
      completed: () => step("questL11Worship") === 999,
      do: $location`A Massive Ziggurat`,
      prepare: () => {
        if (
          myFamiliar() === $familiar`Grey Goose` &&
          familiarWeight($familiar`Grey Goose`) < 7 &&
          have($item`Ghost Dog Chow`)
        )
          use($item`Ghost Dog Chow`);
        // try again to get to level 7 if needed (since the battery is the *second* dupable drop)
        if (
          myFamiliar() === $familiar`Grey Goose` &&
          familiarWeight($familiar`Grey Goose`) < 7 &&
          have($item`Ghost Dog Chow`)
        )
          use($item`Ghost Dog Chow`);
      },
      priority: () => {
        if ($location`A Massive Ziggurat`.turnsSpent < 3) return Priorities.None;
        if (!have($familiar`Grey Goose`)) return Priorities.None;
        if (familiarWeight($familiar`Grey Goose`) >= 7) return Priorities.GoodGoose;
        if (!have($item`Ghost Dog Chow`)) return Priorities.BadGoose;
        return Priorities.None;
      },
      outfit: () => {
        if ($location`A Massive Ziggurat`.turnsSpent < 3)
          return {
            equip: $items`muculent machete`,
          };
        return {
          equip: $items`Space Trip safety headphones, June cleaver, grey down vest, teacher's pen`,
          familiar: $familiar`Grey Goose`,
        };
      },
      choices: { 791: 1 },
      combat: new CombatStrategy()
        .killHard($monster`dense liana`)
        .autoattack(() => dartMacro(false), $monster`dense liana`)
        .macro(
          Macro.trySkill($skill`Emit Matter Duplicating Drones`),
          $monster`Protector S. P. E. C. T. R. E.`
        )
        .killHard($monster`Protector S. P. E. C. T. R. E.`),
      limit: { tries: 4 },
      acquire: [{ item: $item`muculent machete` }],
      boss: true,
    },
  ],
};

function makeCompleteFile(): void {
  if (
    have($item`McClusky file (page 1)`) &&
    have($item`McClusky file (page 2)`) &&
    have($item`McClusky file (page 3)`) &&
    have($item`McClusky file (page 4)`) &&
    have($item`McClusky file (page 5)`) &&
    have($item`boring binder clip`)
  ) {
    cliExecute("make McClusky file (complete)");
  }
}

function officeBanishesDone(): boolean {
  if (get("hiddenHospitalProgress") < 7) return false;
  if (get("hiddenApartmentProgress") < 7) return false;
  if (get("hiddenBowlingAlleyProgress") < 7) return false;
  return (
    (have($item`McClusky file (page 1)`) &&
      have($item`McClusky file (page 2)`) &&
      have($item`McClusky file (page 3)`) &&
      have($item`McClusky file (page 4)`) &&
      have($item`McClusky file (page 5)`)) ||
    have($item`McClusky file (complete)`) ||
    get("hiddenOfficeProgress") >= 7
  );
}
