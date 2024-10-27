import {
  ceil,
  changeMcd,
  cliExecute,
  council,
  currentMcd,
  getWorkshed,
  haveEquipped,
  Item,
  itemAmount,
  myAscensions,
  myMeat,
  numericModifier,
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
  AutumnAton,
  ensureEffect,
  get,
  have,
  Macro,
} from "libram";
import { Priority, Quest, Task } from "../engine/task";
import { Guards, OutfitSpec, step } from "grimoire-kolmafia";
import { CombatStrategy } from "../engine/combat";
import { atLevel, haveLoathingIdolMicrophone } from "../lib";
import { Priorities } from "../engine/priority";
import { councilSafe } from "./level12";
import { fillHp } from "../engine/moods";
import { stenchPlanner } from "../engine/outfit";
import { tryPlayApriling } from "../engine/resources";

const ABoo: Task[] = [
  {
    name: "ABoo Start",
    after: ["Start Peaks"],
    completed: () =>
      $location`A-Boo Peak`.noncombatQueue.includes("Faction Traction = Inaction") ||
      get("booPeakProgress") < 100,
    do: $location`A-Boo Peak`,
    limit: { tries: 1 },
  },
  {
    name: "ABoo Carto",
    after: ["ABoo Start"],
    completed: () =>
      !have($skill`Comprehensive Cartography`) ||
      $location`A-Boo Peak`.turnsSpent > 0 ||
      get("lastCartographyBooPeak") === myAscensions(),
    prepare: () => {
      if (have($item`pec oil`)) ensureEffect($effect`Oiled-Up`);
      use($item`A-Boo clue`);
      fillHp();
    },
    do: $location`A-Boo Peak`,
    effects: $effects`Red Door Syndrome`,
    outfit: {
      modifier: "20 spooky res, 20 cold res, HP",
      familiar: $familiar`Exotic Parrot`,
    },
    choices: { 611: 1, 1430: 1 },
    combat: new CombatStrategy().killItem(),
    limit: { tries: 1 },
    freeaction: true,
    expectbeatenup: true,
  },
  {
    name: "ABoo Clues",
    after: ["ABoo Start", "ABoo Carto"],
    completed: () => itemAmount($item`A-Boo clue`) * 30 >= get("booPeakProgress"),
    do: $location`A-Boo Peak`,
    outfit: { modifier: "item", equip: $items`Space Trip safety headphones, HOA regulation book` },
    combat: new CombatStrategy().killItem(),
    orbtargets: () => [],
    choices: { 611: 1, 1430: 1 },
    limit: { soft: 15 },
  },
  {
    name: "ABoo Horror",
    after: ["ABoo Start", "ABoo Carto"],
    ready: () => have($item`A-Boo clue`),
    completed: () => get("booPeakProgress") === 0,
    prepare: () => {
      if (have($item`pec oil`)) ensureEffect($effect`Oiled-Up`);
      use($item`A-Boo clue`);
      fillHp();
    },
    do: $location`A-Boo Peak`,
    effects: $effects`Red Door Syndrome`,
    outfit: {
      modifier: "20 spooky res, 20 cold res, HP",
      familiar: $familiar`Exotic Parrot`,
    },
    choices: { 611: 1, 1430: 1 },
    limit: { tries: 5 },
    freeaction: true,
    expectbeatenup: true,
  },
  {
    name: "ABoo Peak",
    after: ["ABoo Clues", "ABoo Horror"],
    completed: () => get("booPeakLit"),
    do: $location`A-Boo Peak`,
    limit: { tries: 1 },
  },
];

const Oil: Task[] = [
  {
    name: "Oil Kill",
    after: ["Start Peaks"],
    completed: () => get("oilPeakProgress") === 0,
    prepare: () => {
      if (
        !have($effect`Frosty`) &&
        have($item`cursed monkey's paw`) &&
        get("_monkeyPawWishesUsed") < 5
      )
        cliExecute("monkeypaw effect frosty");
      if (haveLoathingIdolMicrophone()) ensureEffect($effect`Spitting Rhymes`);

      fillHp();
      if (numericModifier("Monster Level") < 100) changeMcd(10);

      tryPlayApriling("food");
    },
    post: () => {
      if (currentMcd() > 0) changeMcd(0);
    },
    do: $location`Oil Peak`,
    outfit: () => {
      const frostySoon =
        !have($effect`Frosty`) &&
        have($item`cursed monkey's paw`) &&
        get("_monkeyPawWishesUsed") < 5;
      const mlNeeded = ceil(
        (frostySoon ? 75 : 100) * (have($item`unbreakable umbrella`) ? 0.8 : 1)
      );

      const spec: OutfitSpec & { equip: Item[] } = {
        modifier: `ML ${mlNeeded} max, 0.1 item, 0.1 food drop`,
        equip: $items`unbreakable umbrella, unwrapped knock-off retro superhero cape, June cleaver, tearaway pants`,
        modes: { umbrella: "broken", retrocape: ["heck", "hold"] },
        avoid: $items`Kramco Sausage-o-Matic™`,
      };

      // Use the Tot for more +item
      if (have($familiar`Trick-or-Treating Tot`) && have($item`li'l ninja costume`)) {
        spec.familiar = $familiar`Trick-or-Treating Tot`;
        spec.equip.push($item`li'l ninja costume`);
      }

      if (!have($item`shadow brick`) && !have($item`unwrapped knock-off retro superhero cape`)) {
        spec.equip.push($item`Everfull Dart Holster`);
      }

      return spec;
    },
    combat: new CombatStrategy().killItem().macro(() => {
      const part = haveEquipped($item`unwrapped knock-off retro superhero cape`) ? "butt" : "oil";
      return Macro.tryItem($item`shadow brick`)
        .step(`if hasskill Darts: Throw at ${part}; skill Darts: Throw at ${part}; endif;`)
        .attack()
        .repeat();
    }),
    limit: { tries: 18 },
    orbtargets: () => undefined,
  },
  {
    name: "Oil Peak",
    after: ["Oil Kill"],
    completed: () => get("oilPeakLit"),
    do: $location`Oil Peak`,
    limit: { tries: 1 },
    orbtargets: () => undefined,
  },
  {
    name: "Oil Jar", // get oil for jar of oil
    after: ["Oil Peak"],
    completed: () =>
      itemAmount($item`bubblin' crude`) >= 12 ||
      have($item`jar of oil`) ||
      !!(get("twinPeakProgress") & 4),
    prepare: () => {
      tryPlayApriling("food");
      fillHp();
    },
    do: $location`Oil Peak`,
    outfit: () => {
      if (have($item`unbreakable umbrella`))
        return {
          modifier: "ML 80 max, 0.1 item, 0.1 food drop, monster level percent",
          equip: $items`unbreakable umbrella, Everfull Dart Holster, unwrapped knock-off retro superhero cape, tearaway pants`,
          modes: { umbrella: "broken", retrocape: ["heck", "hold"] },
        };
      else
        return {
          modifier: "ML, 0.1 item, 0.1 food drop",
          equip: $items`Everfull Dart Holster, unwrapped knock-off retro superhero cape`,
          modes: { retrocape: ["heck", "hold"] },
        };
    },
    combat: new CombatStrategy().killItem().macro(() => {
      const part = haveEquipped($item`unwrapped knock-off retro superhero cape`) ? "butt" : "oil";
      return Macro.tryItem($item`shadow brick`)
        .step(`if hasskill Darts: Throw at ${part}; skill Darts: Throw at ${part}; endif;`)
        .attack()
        .repeat();
    }),
    limit: { soft: 5 },
    orbtargets: () => undefined,
  },
];

const Twin: Task[] = [
  {
    name: "Twin Stench Search",
    after: ["Start Peaks"],
    ready: () => !have($item`rusty hedge trimmers`) && stenchPlanner.maximumPossible(true) >= 4,
    completed: () => !!(get("twinPeakProgress") & 1),
    prepare: () => {
      if (numericModifier("stench resistance") < 4) ensureEffect($effect`Red Door Syndrome`);
      if (numericModifier("stench resistance") < 4)
        throw `Unable to ensure stench res for Twin Peak`;
      tryPlayApriling("-combat");
    },
    do: $location`Twin Peak`,
    choices: { 606: 1, 607: 1 },
    outfit: () => stenchPlanner.outfitFor(4, { modifier: "-combat, item" }),
    combat: new CombatStrategy().killItem(
      $monsters`bearpig topiary animal, elephant (meatcar?) topiary animal, spider (duck?) topiary animal`
    ),
    limit: { soft: 10 },
  },
  {
    name: "Twin Stench",
    after: ["Start Peaks"],
    ready: () => have($item`rusty hedge trimmers`) && stenchPlanner.maximumPossible(true) >= 4,
    completed: () => !!(get("twinPeakProgress") & 1),
    prepare: () => {
      if (numericModifier("stench resistance") < 4) ensureEffect($effect`Red Door Syndrome`);
      if (numericModifier("stench resistance") < 4)
        throw `Unable to ensure stench res for Twin Peak`;
    },
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 1, 607: 1 },
    outfit: () => stenchPlanner.outfitFor(4),
    limit: { tries: 1 },
  },
  {
    name: "Twin Item Search",
    after: ["Start Peaks"],
    ready: () => !have($item`rusty hedge trimmers`),
    completed: () => !!(get("twinPeakProgress") & 2),
    do: $location`Twin Peak`,
    choices: { 606: 2, 608: 1 },
    outfit: { modifier: "item 50min, -combat" },
    combat: new CombatStrategy().killItem(
      $monsters`bearpig topiary animal, elephant (meatcar?) topiary animal, spider (duck?) topiary animal`
    ),
    limit: { soft: 10 },
  },
  {
    name: "Twin Item",
    after: ["Start Peaks"],
    ready: () => have($item`rusty hedge trimmers`),
    completed: () => !!(get("twinPeakProgress") & 2),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 2, 608: 1 },
    outfit: { modifier: "item 50min" },
    limit: { tries: 1 },
  },
  {
    name: "Twin Oil Search",
    after: ["Start Peaks", "Oil Jar"],
    ready: () => !have($item`rusty hedge trimmers`),
    completed: () => !!(get("twinPeakProgress") & 4),
    do: $location`Twin Peak`,
    choices: { 606: 3, 609: 1, 616: 1 },
    outfit: { modifier: "item, -combat" },
    combat: new CombatStrategy().killItem(
      $monsters`bearpig topiary animal, elephant (meatcar?) topiary animal, spider (duck?) topiary animal`
    ),
    acquire: [{ item: $item`jar of oil` }],
    limit: { soft: 10 },
  },
  {
    name: "Twin Oil",
    after: ["Start Peaks", "Oil Jar"],
    ready: () => have($item`rusty hedge trimmers`),
    completed: () => !!(get("twinPeakProgress") & 4),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 3, 609: 1, 616: 1 },
    acquire: [{ item: $item`jar of oil` }],
    limit: { tries: 1 },
  },
  {
    name: "Twin Init Search",
    after: [
      "Twin Stench",
      "Twin Item",
      "Twin Oil",
      "Twin Stench Search",
      "Twin Item Search",
      "Twin Oil Search",
    ],
    ready: () => !have($item`rusty hedge trimmers`),
    completed: () => !!(get("twinPeakProgress") & 8),
    do: $location`Twin Peak`,
    choices: { 606: 4, 610: 1, 1056: 1 },
    outfit: { modifier: "init 40 min, item, -combat" },
    combat: new CombatStrategy().killItem(
      $monsters`bearpig topiary animal, elephant (meatcar?) topiary animal, spider (duck?) topiary animal`
    ),
    limit: { soft: 10 },
  },
  {
    name: "Twin Init",
    after: [
      "Twin Stench",
      "Twin Item",
      "Twin Oil",
      "Twin Stench Search",
      "Twin Item Search",
      "Twin Oil Search",
    ],
    ready: () => have($item`rusty hedge trimmers`),
    completed: () => !!(get("twinPeakProgress") & 8),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 4, 610: 1, 1056: 1 },
    outfit: { modifier: "init 40 min" },
    limit: { tries: 1 },
  },
];

export const ChasmQuest: Quest = {
  name: "Orc Chasm",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(9),
      completed: () => step("questL09Topping") !== -1,
      do: () => {
        visitUrl("council.php");
        cliExecute("refresh all");
      },
      limit: { tries: 1 },
      priority: () => (councilSafe() ? Priorities.Free : Priorities.BadMood),
      freeaction: true,
    },
    {
      name: "Bridge",
      after: ["Start", "Macguffin/Forest"], // Wait for black paint
      priority: (): Priority => {
        if (getWorkshed() === $item`model train set`) {
          return Priorities.BadTrain;
        }
        if (AutumnAton.have()) {
          if ($location`The Smut Orc Logging Camp`.turnsSpent === 0)
            return Priorities.GoodAutumnaton;
        }
        return Priorities.None;
      },
      ready: () =>
        ((have($item`frozen jeans`) ||
          have($item`industrial fire extinguisher`) ||
          (have($item`June cleaver`) && get("_juneCleaverCold", 0) >= 5)) &&
          get("smutOrcNoncombatProgress") < 15) ||
        have($effect`Red Door Syndrome`) ||
        myMeat() >= 1000,
      completed: () => step("questL09Topping") >= 1,
      prepare: () => {
        if (get("smutOrcNoncombatProgress") >= 15 && step("questL11Black") >= 2) {
          ensureEffect($effect`Red Door Syndrome`);
          ensureEffect($effect`Butt-Rock Hair`);
          if (have($item`Powerful Glove`) && get("_powerfulGloveBatteryPowerUsed") === 0)
            ensureEffect($effect`Triple-Sized`);
          if (have($skill`Emotionally Chipped`) && get("_feelPeacefulUsed") < 3)
            ensureEffect($effect`Feeling Peaceful`);
          if (have($item`sleaze powder`)) ensureEffect($effect`Sleaze-Resistant Trousers`);
        }
      },
      do: $location`The Smut Orc Logging Camp`,
      post: (): void => {
        if (have($item`smut orc keepsake box`)) use($item`smut orc keepsake box`);
        visitUrl(`place.php?whichplace=orc_chasm&action=bridge${get("chasmBridgeProgress")}`); // use existing materials
      },
      outfit: () => {
        if (get("smutOrcNoncombatProgress") < 15) {
          const equip = $items`Space Trip safety headphones, HOA regulation book`;
          if (have($item`frozen jeans`)) equip.push($item`frozen jeans`);
          else if (have($item`June cleaver`) && get("_juneCleaverCold", 0) >= 5)
            equip.push($item`June cleaver`);
          else if (have($item`industrial fire extinguisher`))
            equip.push($item`industrial fire extinguisher`);
          return {
            modifier: "item, -ML",
            equip: equip,
            avoid: $items`broken champagne bottle`,
          };
        } else return { modifier: "200 sleaze res, 1 moxie", modes: { parka: "spikolodon" } };
      },
      combat: new CombatStrategy()
        .macro(new Macro().attack().repeat(), [
          $monster`smut orc jacker`,
          $monster`smut orc nailer`,
          $monster`smut orc pipelayer`,
          $monster`smut orc screwer`,
        ])
        .kill(),
      choices: { 1345: 3 },
      freeaction: () => get("smutOrcNoncombatProgress") >= 15,
      limit: {
        soft: 45,
        guard: Guards.after(
          () => !AutumnAton.have() || $location`The Smut Orc Logging Camp`.turnsSpent > 0
        ),
      },
    },
    {
      name: "Bridge Parts",
      after: ["Start"],
      priority: () => Priorities.Free,
      ready: () =>
        (have($item`morningwood plank`) ||
          have($item`raging hardwood plank`) ||
          have($item`weirdwood plank`)) &&
        (have($item`long hard screw`) || have($item`messy butt joint`) || have($item`thick caulk`)),
      completed: () => step("questL09Topping") >= 1,
      do: () => {
        visitUrl(`place.php?whichplace=orc_chasm&action=bridge${get("chasmBridgeProgress")}`); // use existing materials
      },
      freeaction: true,
      limit: { tries: 30, unready: true },
    },
    {
      name: "Bat Wings Bridge Parts",
      after: ["Start"],
      priority: () => Priorities.Free,
      ready: () => have($item`bat wings`) && get("chasmBridgeProgress") >= 25,
      completed: () => step("questL09Topping") >= 1,
      do: () => {
        visitUrl(`place.php?whichplace=orc_chasm&action=bridge${get("chasmBridgeProgress")}`); // use existing materials
        visitUrl("place.php?whichplace=orc_chasm&action=bridge_jump");
        visitUrl("place.php?whichplace=highlands&action=highlands_dude");
      },
      outfit: { equip: $items`bat wings` },
      freeaction: true,
      limit: { tries: 30, unready: true },
    },
    {
      name: "Start Peaks",
      after: ["Bridge", "Bridge Parts"],
      completed: () => step("questL09Topping") >= 2,
      do: () => {
        visitUrl("place.php?whichplace=highlands&action=highlands_dude");
        council();
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    ...ABoo,
    ...Oil,
    ...Twin,
    {
      name: "Finish",
      after: ["ABoo Peak", "Oil Peak", "Twin Init", "Twin Init Search"],
      completed: () => step("questL09Topping") === 999,
      do: () => {
        visitUrl("place.php?whichplace=highlands&action=highlands_dude");
        council();
      },
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
