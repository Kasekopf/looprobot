import {
  changeMcd,
  create,
  currentMcd,
  haveEquipped,
  Item,
  myLevel,
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
  $slot,
  ensureEffect,
  get,
  getActiveEffects,
  have,
  Macro,
} from "libram";
import { Quest, Task } from "../engine/task";
import { Modes, OutfitSpec, step } from "grimoire-kolmafia";
import { CombatStrategy, killMacro } from "../engine/combat";
import { Priorities } from "../engine/priority";
import { forceNCPossible, tryForceNC, tryPlayApriling } from "../engine/resources";
import { canLevelGoose, haveLoathingIdolMicrophone, tryLevelGoose, YouRobot } from "../lib";
import { globalStateCache } from "../engine/state";
import { fillHp } from "../engine/moods";

const Manor1: Task[] = [
  {
    name: "Kitchen",
    after: ["Start"],
    priority: () => Priorities.Start,
    completed: () => step("questM20Necklace") >= 1,
    prepare: () => {
      if (have($item`rainbow glitter candle`)) use($item`rainbow glitter candle`);
    },
    do: $location`The Haunted Kitchen`,
    outfit: { modifier: "stench res, hot res" },
    choices: { 893: 2 },
    combat: new CombatStrategy().kill(),
    limit: { soft: 21 },
    killdelayzone: true,
  },
  {
    name: "Billiards",
    after: ["Kitchen"],
    ready: () => !have($item`pool cue`) || YouRobot.canUse($slot`weapon`),
    completed: () => step("questM20Necklace") >= 3,
    priority: () => {
      if (get("noncombatForcerActive")) return Priorities.GoodForceNC;
      if (
        (have($effect`Chalky Hand`) && !have($item`handful of hand chalk`)) ||
        have($effect`Video... Games?`)
      )
        return Priorities.MinorEffect;
      return Priorities.None;
    },
    prepare: () => {
      if (
        have($effect`Video... Games?`) ||
        have($item`sugar sphere`) ||
        have($effect`Influence of Sphere`)
      )
        tryForceNC();
      else if (have($item`pool cue`) && have($item`handful of hand chalk`))
        ensureEffect($effect`Chalky Hand`);
      if (have($item`pool cue`) && have($item`sugar sphere`))
        ensureEffect($effect`Influence of Sphere`);
      tryPlayApriling("-combat");
    },
    do: $location`The Haunted Billiards Room`,
    choices: { 875: 1, 900: 2, 1436: 1 },
    outfit: () => {
      // TODO: ForceNCPossible should only be triggerable NC forces
      if (
        forceNCPossible() &&
        (have($effect`Video... Games?`) || have($effect`Influence of Sphere`))
      )
        return { equip: $items`pool cue` };
      return {
        equip: $items`pool cue`,
        modifier: "-combat",
      };
    },
    combat: new CombatStrategy()
      .ignore()
      .macro(
        () => (have($effect`Video... Games?`) ? killMacro() : new Macro()),
        $monster`chalkdust wraith`
      )
      .kill($monster`pooltergeist (ultra-rare)`),
    limit: {
      soft: 20,
      message: `Consider increasing your permanent pool skill with "A Shark's Chum", if you have not.`,
    },
  },
  {
    name: "Library",
    after: ["Billiards"],
    completed: () => step("questM20Necklace") >= 4,
    do: $location`The Haunted Library`,
    combat: new CombatStrategy().banish($monsters`banshee librarian, bookbat`).kill(),
    choices: { 163: 4, 888: 5, 889: 5, 894: 1 },
    limit: { soft: 20 },
  },
  {
    name: "Finish Floor1",
    after: ["Library"],
    priority: () => Priorities.Free,
    completed: () => step("questM20Necklace") === 999,
    do: () => visitUrl("place.php?whichplace=manor1&action=manor1_ladys"),
    limit: { tries: 1 },
    freeaction: true,
  },
];

const Manor2: Task[] = [
  {
    name: "Start Floor2",
    after: ["Finish Floor1"],
    priority: () => Priorities.Free,
    completed: () => step("questM21Dance") >= 1,
    do: () => visitUrl("place.php?whichplace=manor2&action=manor2_ladys"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Gallery Delay",
    after: ["Start Floor2"],
    completed: () =>
      $location`The Haunted Gallery`.turnsSpent >= 5 ||
      have($item`Lady Spookyraven's dancing shoes`) ||
      step("questM21Dance") >= 2,
    do: $location`The Haunted Gallery`,
    choices: { 89: 6, 896: 1 }, // TODO: louvre
    limit: { turns: 5 },
    delay: 5,
  },
  {
    name: "Gallery",
    after: ["Gallery Delay"],
    completed: () => have($item`Lady Spookyraven's dancing shoes`) || step("questM21Dance") >= 2,
    do: $location`The Haunted Gallery`,
    choices: { 89: 6, 896: 1 }, // TODO: louvre
    outfit: { modifier: "-combat" },
    limit: { soft: 15 },
  },
  {
    name: "Bathroom Delay",
    after: ["Start Floor2"],
    completed: () =>
      $location`The Haunted Bathroom`.turnsSpent >= 5 ||
      have($item`Lady Spookyraven's powder puff`) ||
      step("questM21Dance") >= 2,
    do: $location`The Haunted Bathroom`,
    choices: { 881: 1, 105: 1, 892: 1 },
    combat: new CombatStrategy().killHard($monster`cosmetics wraith`),
    limit: { turns: 5 },
    delay: 5,
    // No need to search for cosmetics wraith
    orbtargets: () => [],
  },
  {
    name: "Bathroom",
    after: ["Bathroom Delay"],
    completed: () => have($item`Lady Spookyraven's powder puff`) || step("questM21Dance") >= 2,
    do: $location`The Haunted Bathroom`,
    choices: { 881: 1, 105: 1, 892: 1 },
    outfit: () => {
      if (!have($effect`Citizen of a Zone`) && have($familiar`Patriotic Eagle`)) {
        return { modifier: "-combat", familiar: $familiar`Patriotic Eagle` };
      }
      return { modifier: "-combat" };
    },
    combat: new CombatStrategy().killHard($monster`cosmetics wraith`),
    limit: { soft: 15 },
    // No need to search for cosmetics wraith
    orbtargets: () => [],
  },
  {
    name: "Bedroom",
    after: ["Start Floor2"],
    completed: () =>
      (have($item`Lady Spookyraven's finest gown`) || step("questM21Dance") >= 2) &&
      have($item`Lord Spookyraven's spectacles`),
    do: $location`The Haunted Bedroom`,
    choices: () => {
      return {
        876: 1,
        877: 1,
        878: !have($item`Lord Spookyraven's spectacles`) ? 3 : 4,
        879: 1,
        880: 1,
        897: 2,
      };
    },
    combat: new CombatStrategy()
      .killHard($monster`animated ornate nightstand`)
      .kill($monster`elegant animated nightstand`) // kill ornate nightstand if banish fails
      .banish(
        $monsters`animated mahogany nightstand, animated rustic nightstand, Wardröb nightstand`
      )
      .ignore($monster`tumbleweed`),
    outfit: { avoid: $items`Everfull Dart Holster` }, // caused macro crash
    delay: () => (have($item`Lord Spookyraven's spectacles`) ? 5 : 0),
    limit: { soft: 20 },
  },
  {
    name: "Bedroom Camera",
    after: ["Bedroom"],
    completed: () =>
      have($item`disposable instant camera`) ||
      have($item`photograph of a dog`) ||
      step("questL11Palindome") >= 3,
    do: $location`The Haunted Bedroom`,
    choices: {
      876: 1,
      877: 1,
      878: 4,
      879: 1,
      880: 1,
      897: 2,
    },
    combat: new CombatStrategy()
      .killHard($monster`animated ornate nightstand`)
      .banish(
        $monsters`animated mahogany nightstand, animated rustic nightstand, Wardröb nightstand, elegant animated nightstand`
      )
      .ignore($monster`tumbleweed`),
    parachute: $monster`animated ornate nightstand`,
    limit: { soft: 10 },
  },
  {
    name: "Open Ballroom",
    after: ["Gallery", "Bathroom", "Bedroom"],
    completed: () => step("questM21Dance") >= 3,
    priority: () => Priorities.Free,
    do: () => visitUrl("place.php?whichplace=manor2&action=manor2_ladys"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Finish Floor2",
    after: ["Open Ballroom"],
    completed: () => step("questM21Dance") >= 4,
    do: $location`The Haunted Ballroom`,
    limit: { turns: 1 },
  },
];

const ManorBasement: Task[] = [
  {
    name: "Ballroom Delay",
    after: ["Macguffin/Diary", "Finish Floor2"],
    completed: () => $location`The Haunted Ballroom`.turnsSpent >= 5 || step("questL11Manor") >= 1,
    do: $location`The Haunted Ballroom`,
    choices: { 90: 3, 106: 4, 921: 1 },
    limit: { turns: 5 },
    delay: 5,
  },
  {
    name: "Ballroom",
    after: ["Ballroom Delay"],
    completed: () => step("questL11Manor") >= 1,
    do: $location`The Haunted Ballroom`,
    outfit: { modifier: "-combat" },
    choices: { 90: 3, 106: 4, 921: 1 },
    limit: { soft: 10 },
  },
  {
    name: "Learn Recipe",
    after: ["Ballroom"],
    completed: () => get("spookyravenRecipeUsed") === "with_glasses",
    do: () => {
      visitUrl("place.php?whichplace=manor4&action=manor4_chamberwall");
      use($item`recipe: mortar-dissolving solution`);
    },
    outfit: { equip: $items`Lord Spookyraven's spectacles` },
    limit: { tries: 1 },
  },
  {
    name: "Wine Cellar",
    after: ["Learn Recipe"],
    prepare: () => {
      if (haveLoathingIdolMicrophone()) {
        ensureEffect($effect`Spitting Rhymes`);
      }
      tryPlayApriling("booze");
    },
    completed: () =>
      have($item`bottle of Chateau de Vinegar`) ||
      have($item`unstable fulminate`) ||
      have($item`wine bomb`) ||
      step("questL11Manor") >= 3,
    do: $location`The Haunted Wine Cellar`,
    outfit: () => {
      const equip = [];
      if (
        have($item`Lil' Doctor™ bag`) &&
        get("_otoscopeUsed") < 3 &&
        $location`The Haunted Wine Cellar`.turnsSpent > 4
      )
        equip.push($item`Lil' Doctor™ bag`);
      const banishState = globalStateCache.banishes();
      if (banishState.allBanished($monsters`mad wino, skeletal sommelier`))
        equip.push($item`broken champagne bottle`);
      return {
        skipDefaults: true,
        modifier: "item, booze drop",
        equip: equip,
      };
    },
    choices: { 901: 2 },
    combat: new CombatStrategy()
      .macro(Macro.trySkill($skill`Otoscope`), $monster`possessed wine rack`)
      .killItem($monster`possessed wine rack`)
      .banish($monsters`mad wino, skeletal sommelier`)
      .kill(),
    limit: { soft: 15 },
  },
  {
    name: "Laundry Room",
    after: ["Learn Recipe"],
    prepare: () => {
      if (haveLoathingIdolMicrophone()) {
        ensureEffect($effect`Spitting Rhymes`);
      }
      tryPlayApriling("food");
    },
    completed: () =>
      have($item`blasting soda`) ||
      have($item`unstable fulminate`) ||
      have($item`wine bomb`) ||
      step("questL11Manor") >= 3,
    do: $location`The Haunted Laundry Room`,
    outfit: () => {
      const equip = $items`Cargo Cultist Shorts`;
      if (
        have($item`Lil' Doctor™ bag`) &&
        get("_otoscopeUsed") < 3 &&
        $location`The Haunted Laundry Room`.turnsSpent > 4
      )
        equip.push($item`Lil' Doctor™ bag`);
      const banishState = globalStateCache.banishes();
      if (banishState.allBanished($monsters`plaid ghost, possessed laundry press`))
        equip.push($item`broken champagne bottle`);
      return {
        skipDefaults: true,
        modifier: "item, food drop",
        equip: equip,
      };
    },
    choices: { 891: 2 },
    combat: new CombatStrategy()
      .macro(Macro.trySkill($skill`Otoscope`), $monster`cabinet of Dr. Limpieza`)
      .killItem($monster`cabinet of Dr. Limpieza`)
      .banish($monsters`plaid ghost, possessed laundry press`)
      .kill(),
    limit: { soft: 15 },
  },
  {
    name: "Fulminate",
    after: ["Wine Cellar", "Laundry Room"],
    completed: () =>
      have($item`unstable fulminate`) || have($item`wine bomb`) || step("questL11Manor") >= 3,
    do: () => create($item`unstable fulminate`),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Boiler Room",
    after: ["Fulminate"],
    completed: () => have($item`wine bomb`) || step("questL11Manor") >= 3,
    prepare: () => {
      if (numericModifier("Monster Level") < 81) changeMcd(10);
      fillHp();
    },
    post: () => {
      if (currentMcd() > 0) changeMcd(0);
    },
    do: $location`The Haunted Boiler Room`,
    outfit: (): OutfitSpec => {
      const result = <OutfitSpec & { equip: Item[]; modes: Modes }>{
        equip: [
          $item`unstable fulminate`,
          $item`unwrapped knock-off retro superhero cape`,
          $item`tearaway pants`,
        ],
        modes: { retrocape: ["heck", "hold"] },
      };
      let ml_needed = 81 - 10; // -10 from MCD

      // Include effects
      for (const effect of getActiveEffects())
        ml_needed -= numericModifier(effect, "Monster Level");
      if (have($skill`Ur-Kel's Aria of Annoyance`) && !have($effect`Ur-Kel's Aria of Annoyance`))
        ml_needed -= Math.min(2 * myLevel(), 60);
      if (have($skill`Pride of the Puffin`) && !have($effect`Pride of the Puffin`)) ml_needed -= 10;
      if (have($skill`Drescher's Annoying Noise`) && !have($effect`Drescher's Annoying Noise`))
        ml_needed -= 10;

      // Include some equipment
      if (ml_needed > 0 && have($item`Jurassic Parka`) && have($skill`Torso Awareness`)) {
        result.equip.push($item`Jurassic Parka`);
        result.modes.parka = "spikolodon";
        ml_needed -= Math.min(3 * myLevel(), 33);
      }
      if (ml_needed > 0 && have($item`barrel lid`) && have($familiar`Left-Hand Man`)) {
        result.equip.push($item`barrel lid`);
        result.familiar = $familiar`Left-Hand Man`;
        ml_needed -= 50;
      }
      if (ml_needed > 0 && have($item`backup camera`)) {
        result.equip.push($item`backup camera`);
        result.modes.backupcamera = "ml";
        ml_needed -= Math.min(3 * myLevel(), 50);
      }
      if (!have($item`unwrapped knock-off retro superhero cape`)) {
        // Add for survivability
        result.equip.push($item`Everfull Dart Holster`);
      }

      if (ml_needed > 0) {
        return {
          ...result,
          modifier: "ML",
        };
      } else {
        return result;
      }
    },
    effects: $effects`Ur-Kel's Aria of Annoyance, Pride of the Puffin, Drescher's Annoying Noise`,
    choices: { 902: 2 },
    combat: new CombatStrategy()
      .macro(() => {
        if (!haveEquipped($item`unwrapped knock-off retro superhero cape`))
          return Macro.step(
            "if hasskill Darts: Throw at gauge; skill Darts: Throw at gauge; endif;"
          )
            .step("if hasskill Darts: Throw at dust; skill Darts: Throw at dust; endif;")
            .step("if hasskill Darts: Throw at cloud; skill Darts: Throw at cloud; endif;");
        else return new Macro();
      })
      .kill($monster`monstrous boiler`)
      .banish($monsters`coaltergeist, steam elemental`),
    parachute: $monster`monstrous boiler`,
    limit: { soft: 10 },
  },
  {
    name: "Blow Wall",
    after: ["Boiler Room"],
    completed: () => step("questL11Manor") >= 3,
    do: () => visitUrl("place.php?whichplace=manor4&action=manor4_chamberwall"),
    limit: { tries: 1 },
    freeaction: true,
  },
];

export const ManorQuest: Quest = {
  name: "Manor",
  tasks: [
    {
      name: "Start",
      after: [],
      completed: () => step("questM20Necklace") >= 0,
      do: () => use($item`telegram from Lady Spookyraven`),
      limit: { tries: 1 },
      freeaction: true,
    },
    ...Manor1,
    ...Manor2,
    ...ManorBasement,
    {
      name: "Boss",
      after: ["Blow Wall"],
      priority: () => {
        return canLevelGoose(7);
      },
      completed: () => step("questL11Manor") >= 999,
      outfit: { familiar: $familiar`Grey Goose`, equip: $items`grey down vest, teacher's pen` },
      prepare: () => {
        tryLevelGoose(7);
      },
      do: () => visitUrl("place.php?whichplace=manor4&action=manor4_chamberboss"),
      combat: new CombatStrategy()
        .macro(Macro.trySkill($skill`Emit Matter Duplicating Drones`))
        .killHard(),
      limit: { tries: 1 },
      boss: true,
    },
  ],
};
