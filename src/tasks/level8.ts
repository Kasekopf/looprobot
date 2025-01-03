import {
  equippedAmount,
  familiarWeight,
  Item,
  itemAmount,
  myFamiliar,
  numericModifier,
  use,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  $slot,
  Counter,
  ensureEffect,
  get,
  have,
  Macro,
} from "libram";
import { Quest } from "../engine/task";
import { step } from "grimoire-kolmafia";
import { Priorities } from "../engine/priority";
import { CombatStrategy } from "../engine/combat";
import { atLevel, YouRobot } from "../lib";
import { councilSafe } from "./level12";
import { summonStrategy } from "./summons";
import { coldPlanner } from "../engine/outfit";
import { trainSetAvailable } from "./misc";

export const McLargeHugeQuest: Quest = {
  name: "McLargeHuge",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(8),
      completed: () => step("questL08Trapper") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      priority: () => (councilSafe() ? Priorities.Free : Priorities.BadMood),
      freeaction: true,
    },
    {
      name: "Trapper Request",
      after: ["Start"],
      completed: () => step("questL08Trapper") >= 1,
      do: () => visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"),
      limit: { tries: 1 },
      priority: () => Priorities.Free,
      freeaction: true,
    },
    {
      name: "Clover Ore",
      after: ["Trapper Request", "Pull/Ore", "Misc/Hermit Clover"],
      ready: () =>
        have($item`11-leaf clover`) &&
        summonStrategy.getSourceFor($monster`mountain man`) === undefined &&
        oresNeeded() > 0,
      prepare: () => {
        if (!have($effect`Lucky!`)) use($item`11-leaf clover`);
      },
      completed: () =>
        step("questL08Trapper") >= 2 ||
        (get("trapperOre") !== "" && itemAmount(Item.get(get("trapperOre"))) >= 3) ||
        (itemAmount($item`asbestos ore`) >= 3 &&
          itemAmount($item`chrome ore`) >= 3 &&
          itemAmount($item`linoleum ore`) >= 3),
      do: $location`Itznotyerzitz Mine`,
      limit: { tries: 2 },
    },
    {
      name: "Goatlet",
      after: ["Trapper Request"],
      ready: () =>
        Counter.get("Spooky VHS Tape Monster") === 0 ||
        get("spookyVHSTapeMonster") !== $monster`dairy goat`,
      completed: () => itemAmount($item`goat cheese`) >= 3 || step("questL08Trapper") >= 2,
      prepare: () => {
        if (
          myFamiliar() === $familiar`Grey Goose` &&
          familiarWeight($familiar`Grey Goose`) < 6 &&
          have($item`Ghost Dog Chow`)
        )
          use($item`Ghost Dog Chow`);
      },
      do: $location`The Goatlet`,
      outfit: {
        modifier: "item, food drop",
        avoid: $items`broken champagne bottle`,
        equip: $items`bat wings`,
        familiar: $familiar`Grey Goose`,
      },
      combat: new CombatStrategy()
        .macro(() => {
          if (itemAmount($item`goat cheese`) === 0)
            return Macro.trySkill($skill`Emit Matter Duplicating Drones`)
              .tryItem($item`Spooky VHS Tape`)
              .trySkill($skill`Swoop like a Bat`);
          if (itemAmount($item`goat cheese`) === 1) {
            if (
              myFamiliar() === $familiar`Grey Goose` &&
              familiarWeight($familiar`Grey Goose`) >= 6 &&
              familiarWeight($familiar`Grey Goose`) < 10
            )
              return Macro.trySkill($skill`Emit Matter Duplicating Drones`);
            else return Macro.tryItem($item`Spooky VHS Tape`).trySkill($skill`Swoop like a Bat`);
          }
          return new Macro();
        }, $monster`dairy goat`)
        .killItem($monster`dairy goat`)
        .banish($monsters`drunk goat, sabre-toothed goat`),
      limit: { soft: 15 },
    },
    {
      name: "Trapper Return",
      after: ["Goatlet", "Pull/Ore", "Summon/Mountain Man", "Clover Ore"],
      ready: () => get("trapperOre") !== "" && itemAmount(Item.get(get("trapperOre"))) >= 3, // Checked here since there is no task for Trainset ores
      completed: () => step("questL08Trapper") >= 2,
      do: () => visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Extreme Outfit",
      after: ["Trapper Return"],
      // eslint-disable-next-line libram/verify-constants
      completed: () =>
        haveHugeLarge() ||
        (have($item`eXtreme mittens`) &&
          have($item`snowboarder pants`) &&
          have($item`eXtreme scarf`)) ||
        step("questL08Trapper") >= 3,
      do: $location`The eXtreme Slope`,
      outfit: { equip: $items`candy cane sword cane`, modifier: "item, -combat" },
      choices: () => {
        return {
          575:
            equippedAmount($item`candy cane sword cane`) > 0 &&
            (!have($item`snowboarder pants`) || !have($item`eXtreme mittens`))
              ? 5
              : 1,
          15: have($item`eXtreme mittens`) ? 2 : 1,
          16: have($item`snowboarder pants`) ? 2 : 1,
          17: have($item`eXtreme mittens`) ? 2 : 1,
        };
      },
      combat: new CombatStrategy().killItem(),
      limit: { soft: 30 },
    },
    {
      name: "Extreme Snowboard",
      after: ["Trapper Return", "Extreme Outfit"],
      ready: () => {
        if (haveHugeLarge()) return YouRobot.canUse($slot`offhand`);
        else return YouRobot.canUse($slot`hat`);
      },
      completed: () => get("currentExtremity") >= 3 || step("questL08Trapper") >= 3,
      do: $location`The eXtreme Slope`,
      outfit: () => {
        if (haveHugeLarge())
          return {
            // eslint-disable-next-line libram/verify-constants
            equip: $items`McHugeLarge left pole, McHugeLarge right pole, McHugeLarge left ski, McHugeLarge right ski`,
            modifier: "-combat",
          };
        return {
          equip: $items`eXtreme mittens, snowboarder pants, eXtreme scarf`,
          modifier: "-combat",
        };
      },
      limit: { soft: 30 },
    },
    {
      name: "Climb",
      after: ["Trapper Return", "Extreme Snowboard"],
      completed: () => step("questL08Trapper") >= 3,
      ready: () => {
        if (haveHugeLarge()) return YouRobot.canUse($slot`offhand`);
        else return YouRobot.canUse($slot`hat`);
      },
      do: (): void => {
        visitUrl("place.php?whichplace=mclargehuge&action=cloudypeak");
      },
      outfit: () => {
        if (haveHugeLarge())
          return {
            // eslint-disable-next-line libram/verify-constants
            equip: $items`McHugeLarge left pole, McHugeLarge right pole, McHugeLarge left ski, McHugeLarge right ski`,
            modifier: "-combat",
          };
        return {
          equip: $items`eXtreme mittens, snowboarder pants, eXtreme scarf`,
          modifier: "-combat",
        };
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Peak",
      after: ["Extreme Snowboard", "Climb"],
      completed: () => step("questL08Trapper") >= 5,
      priority: () => {
        if ($location`Mist-Shrouded Peak`.turnsSpent < 3) return Priorities.None;
        if (!have($familiar`Grey Goose`)) return Priorities.None;
        if (familiarWeight($familiar`Grey Goose`) >= 6) return Priorities.GoodGoose;
        if (!have($item`Ghost Dog Chow`)) return Priorities.BadGoose;
        return Priorities.None;
      },
      ready: () => coldPlanner.maximumPossible(true) >= 5,
      prepare: () => {
        if (numericModifier("cold resistance") < 5) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("cold resistance") < 5)
          throw `Unable to ensure cold res for The Icy Peak`;
        if (
          myFamiliar() === $familiar`Grey Goose` &&
          familiarWeight($familiar`Grey Goose`) < 6 &&
          have($item`Ghost Dog Chow`)
        )
          use($item`Ghost Dog Chow`);
      },
      do: $location`Mist-Shrouded Peak`,
      outfit: () => {
        if (!get("banishedPhyla").includes("beast"))
          return coldPlanner.outfitFor(5, { familiar: $familiar`Patriotic Eagle` });
        if (
          $location`Mist-Shrouded Peak`.turnsSpent >= 3 &&
          familiarWeight($familiar`Grey Goose`) >= 6
        )
          return coldPlanner.outfitFor(5, {
            familiar: $familiar`Grey Goose`,
            equip: $items`grey down vest`,
          });
        return coldPlanner.outfitFor(5);
      },
      combat: new CombatStrategy()
        .killHard()
        .macro(Macro.trySkill($skill`Emit Matter Duplicating Drones`), $monster`Groarbot`)
        .macro(() => {
          if (!get("banishedPhyla").includes("beast"))
            return Macro.trySkill($skill`%fn, Release the Patriotic Screech!`);
          return new Macro();
        }),
      boss: true,
      limit: { tries: 4 },
    },
    {
      name: "Finish",
      after: ["Peak"],
      completed: () => step("questL08Trapper") === 999,
      do: () => visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};

// Get the number of ores needed from non-trainset places
export function oresNeeded(): number {
  if (step("questL08Trapper") >= 2) return 0;
  if (trainSetAvailable()) return 0;
  let ore_needed = 3;
  if (get("trapperOre") === "") {
    ore_needed -= Math.min(
      itemAmount($item`asbestos ore`),
      itemAmount($item`chrome ore`),
      itemAmount($item`linoleum ore`)
    );
  } else {
    ore_needed -= itemAmount(Item.get(get("trapperOre")));
  }

  if (have($item`Deck of Every Card`) && get("_deckCardsDrawn") === 0) ore_needed--;
  const pulled = new Set<Item>(
    get("_roninStoragePulls")
      .split(",")
      .map((id) => parseInt(id))
      .filter((id) => id > 0)
      .map((id) => Item.get(id))
  );
  if (
    !pulled.has($item`asbestos ore`) &&
    !pulled.has($item`chrome ore`) &&
    !pulled.has($item`linoleum ore`)
  )
    ore_needed--;

  if (get("spookyVHSTapeMonster") === $monster`mountain man`) ore_needed -= 2;
  return Math.max(ore_needed, 0);
}

function haveHugeLarge() {
  return (
    // eslint-disable-next-line libram/verify-constants
    have($item`McHugeLarge left pole`) &&
    // eslint-disable-next-line libram/verify-constants
    have($item`McHugeLarge right pole`) &&
    // eslint-disable-next-line libram/verify-constants
    have($item`McHugeLarge left ski`) &&
    // eslint-disable-next-line libram/verify-constants
    have($item`McHugeLarge right ski`)
  );
}
