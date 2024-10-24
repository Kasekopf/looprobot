import {
  changeMcd,
  cliExecute,
  currentMcd,
  familiarWeight,
  Item,
  myBasestat,
  myClass,
  myFamiliar,
  myMp,
  myTurncount,
  numericModifier,
  use,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  $stat,
  AutumnAton,
  DaylightShavings,
  ensureEffect,
  FloristFriar,
  get,
  have,
  Macro,
  set,
} from "libram";
import { Priority, Quest, Task } from "../engine/task";
import { OutfitSpec, step } from "grimoire-kolmafia";
import { CombatStrategy } from "../engine/combat";
import {
  atLevel,
  haveFlorest,
  haveLoathingIdolMicrophone,
  levelingStartCompleted,
  YouRobot,
} from "../lib";
import { Priorities } from "../engine/priority";
import { councilSafe, fastFlyerPossible, flyersDone } from "./level12";
import { ensureWithMPSwaps, fillHp } from "../engine/moods";
import { photoboothEffect, tryPlayApriling } from "../engine/resources";
import { toTempPref } from "../args";

function tuneCape(): void {
  if (
    have($item`unwrapped knock-off retro superhero cape`) &&
    (get("retroCapeSuperhero") !== "vampire" || get("retroCapeWashingInstructions") !== "kill")
  ) {
    cliExecute("retrocape vampire kill");
  }
}

function tryCape(sword: Item, ...rest: Item[]) {
  if (have($item`unwrapped knock-off retro superhero cape`)) {
    rest.unshift($item`unwrapped knock-off retro superhero cape`);
    rest.unshift(sword);
  }
  return rest;
}

const slay_macro = new Macro().trySkill($skill`Slay the Dead`);

const Alcove: Task[] = [
  {
    name: "Alcove",
    after: ["Start"],
    prepare: () => {
      tuneCape();
      if (haveLoathingIdolMicrophone()) ensureEffect($effect`Poppy Performance`);
      if (have($item`old bronzer`)) ensureEffect($effect`Sepia Tan`);
      if (have($item`ant agonist`)) ensureEffect($effect`All Fired Up`);
      if (have($item`Angry Farmer candy`)) ensureEffect($effect`Sugar Rush`);
      if (have($familiar`Grim Brother`) && !get("_grimBuff")) ensureEffect($effect`Soles of Glass`);

      if (numericModifier("Initiative") < 850 && have($skill`Silent Hunter`)) {
        if (myClass() === $class`Seal Clubber`) ensureWithMPSwaps($effects`Silent Hunting`);
        else ensureWithMPSwaps($effects`Nearly Silent Hunting`);
      }
      tryPlayApriling("-combat");
      photoboothEffect("-combat");

      if (
        myClass() === $class`Seal Clubber` &&
        get("_canSeekBirds") &&
        myMp() >= 5 * 2 ** get("_birdsSoughtToday") &&
        numericModifier("Initiative") < 850
      ) {
        ensureEffect($effect`Blessing of the Bird`);
      }

      if (
        have($item`designer sweatpants`) &&
        get("sweat", 0) >= 15 &&
        numericModifier("Initiative") < 850 &&
        !have($effect`Slippery and Speedy`)
      ) {
        // Use visit URL to avoid needing to equip the pants
        visitUrl("runskillz.php?action=Skillz&whichskill=7419&targetplayer=0&pwd&quantity=1");
      }
    },
    ready: () => myBasestat($stat`Muscle`) >= 15,
    completed: () => get("cyrptAlcoveEvilness") <= 13,
    do: $location`The Defiled Alcove`,
    post: () => {
      if (haveFlorest() && FloristFriar.ShuffleTruffle.available()) {
        FloristFriar.ShuffleTruffle.plant();
      }
    },
    outfit: (): OutfitSpec => {
      const items = [
        $item`gravy boat`,
        $item`backup camera`,
        $item`rocket boots`,
        $item`spring shoes`,
        $item`Lord Spookyraven's ear trumpet`,
        $item`Jurassic Parka`,
      ];
      if (DaylightShavings.nextBuff() === $effect`Gull-Wing Moustache`) {
        items.push($item`Daylight Shavings Helmet`);
      }
      return {
        equip: tryCape($item`muculent machete`, ...items),
        modifier: "init 850max",
        modes: {
          backupcamera: "init",
          parka: "pterodactyl",
        },
      };
    },
    // Modern zmobie does not show up in orb
    orbtargets: () => [],
    choices: { 153: 4 },
    combat: new CombatStrategy().macro(slay_macro).kill(),
    limit: { turns: 37 },
  },
  {
    name: "Alcove Boss",
    after: ["Start", "Alcove"],
    completed: () => get("cyrptAlcoveEvilness") === 0 && step("questL07Cyrptic") !== -1,
    do: $location`The Defiled Alcove`,
    combat: new CombatStrategy().killHard(),
    boss: true,
    limit: { tries: 1 },
  },
];

const Cranny: Task[] = [
  {
    name: "Cranny",
    after: ["Start"],
    ready: () => myBasestat($stat`Muscle`) >= 15,
    completed: () => get("cyrptCrannyEvilness") <= 13,
    prepare: () => {
      tuneCape();
      changeMcd(10);
      fillHp();
      tryPlayApriling("-combat");
      photoboothEffect("-combat");
    },
    post: () => {
      if (currentMcd() > 0) changeMcd(0);
      if (haveFlorest() && FloristFriar.BlusteryPuffball.available()) {
        FloristFriar.BlusteryPuffball.plant();
      }
      if (get("cyrptCrannyEvilness") === 0 && get("lastEncounter") !== "huge ghuol") {
        set(toTempPref("crannyoverkill"), true);
      }
    },
    do: $location`The Defiled Cranny`,
    outfit: (): OutfitSpec => {
      return {
        equip: tryCape(
          $item`muculent machete`,
          $item`gravy boat`,
          $item`tearaway pants`,
          $item`unbreakable umbrella`,
          $item`barrel lid`,
          $item`carnivorous potted plant`
        ),
        avoid: $items`Everfull Dart Holster`,
        modifier: "-combat, ML",
        modes: { umbrella: "cocoon" },
      };
    },
    choices: { 523: 4 },
    combat: new CombatStrategy()
      .macro(slay_macro)
      .kill(
        $monsters`swarm of ghuol whelps, big swarm of ghuol whelps, giant swarm of ghuol whelps, huge ghuol`
      ),
    // Do not search for swarm with orb
    orbtargets: () => [],
    limit: { turns: 37 },
  },
  {
    name: "Cranny Boss",
    after: ["Start", "Cranny"],
    completed: () =>
      (get("cyrptCrannyEvilness") === 0 &&
        step("questL07Cyrptic") !== -1 &&
        !get(toTempPref("crannyoverkill"), false)) ||
      step("questL07Cyrptic") >= 1,
    prepare: () => {
      if (get(toTempPref("crannyoverkill"), false)) set("cyrptCrannyEvilness", 1);
    },
    do: $location`The Defiled Cranny`,
    post: () => {
      if (get("lastEncounter") === "huge ghuol" && get(toTempPref("crannyoverkill"), false)) {
        set(toTempPref("crannyoverkill"), false);
      }
      visitUrl("crypt.php");
    },
    combat: new CombatStrategy().killHard(),
    boss: true,
    limit: { tries: 1 },
  },
];

const Niche: Task[] = [
  {
    name: "Niche",
    after: ["Start"],
    prepare: tuneCape,
    ready: () => myBasestat($stat`Muscle`) >= 15,
    completed: () => get("cyrptNicheEvilness") <= 13,
    priority: () => {
      if (have($familiar`Patriotic Eagle`)) {
        if (!have($effect`Everything Looks Red, White and Blue`)) {
          if (YouRobot.canUseFamiliar() && levelingStartCompleted())
            return { score: 3.1, reason: "Launch RWB" };
          else return { score: -80, reason: "Wait to launch RWB with Eagle" };
        }
        if (get("rwbMonsterCount") > 1 || get("cyrptNicheEvilness") <= 16)
          return { score: 0.1, reason: "Kill RWB monster" };
        if (have($effect`Everything Looks Red, White and Blue`))
          return { score: -80, reason: "Wait to launch RWB" };
      }
      return Priorities.None;
    },
    do: $location`The Defiled Niche`,
    choices: { 157: 4 },
    outfit: (): OutfitSpec => {
      const result = { equip: tryCape($item`muculent machete`, $item`gravy boat`) } as OutfitSpec;
      if (get("rwbMonsterCount") !== 0) {
        result.avoid = $items`miniature crystal ball`;
      }
      if (get("rwbMonsterCount") <= 1) {
        // Cast it the first time, or maintain it
        result.familiar = $familiar`Patriotic Eagle`;
      }
      return result;
    },
    combat: new CombatStrategy()
      .macro(() => {
        if (get("rwbMonsterCount") <= 1 && get("cyrptNicheEvilness") > 16)
          return Macro.trySkill($skill`%fn, fire a Red, White and Blue Blast`);
        return new Macro();
      }, $monster`dirty old lihc`)
      .macro(slay_macro, $monsters`dirty old lihc, basic lihc, senile lihc, slick lihc`)
      .kill(),
    ignore_banishes: () => have($familiar`Patriotic Eagle`) && myTurncount() < 200,
    orbtargets: () => {
      if (get("rwbMonsterCount") === 0) return [$monster`dirty old lihc`];
      else return undefined;
    },
    map_the_monster: () => {
      if (get("rwbMonsterCount") === 0 && have($familiar`Patriotic Eagle`))
        return $monster`dirty old lihc`;
      else return $monster`none`;
    },
    limit: { turns: 37 },
  },
  {
    name: "Niche Boss",
    after: ["Start", "Niche"],
    completed: () => get("cyrptNicheEvilness") === 0 && step("questL07Cyrptic") !== -1,
    do: $location`The Defiled Niche`,
    combat: new CombatStrategy().killHard(),
    boss: true,
    limit: { tries: 1 },
  },
];

const Nook: Task[] = [
  {
    name: "Nook",
    after: ["Start"],
    prepare: tuneCape,
    priority: (): Priority => {
      if (AutumnAton.have()) {
        if ($location`The Defiled Nook`.turnsSpent === 0 && levelingStartCompleted())
          return Priorities.GoodAutumnaton;
      }
      return Priorities.None;
    },
    ready: () => myBasestat($stat`Muscle`) >= 15,
    completed: () => get("cyrptNookEvilness") <= 13,
    do: $location`The Defiled Nook`,
    post: () => {
      if (haveFlorest() && FloristFriar.HornOfPlenty.available()) {
        FloristFriar.HornOfPlenty.plant();
      }
    },
    outfit: (): OutfitSpec => {
      if (
        have($item`industrial fire extinguisher`) &&
        get("_fireExtinguisherCharge") >= 20 &&
        !get("fireExtinguisherCyrptUsed")
      )
        return {
          equip: $items`gravy boat, industrial fire extinguisher`,
          modifier: "item 500max",
        };
      else
        return {
          equip: tryCape($item`muculent machete`, $item`gravy boat`),
          modifier: "item 500max",
        };
    },
    choices: { 155: 5, 1429: 1 },
    orbtargets: () => {
      if (AutumnAton.have() && myTurncount() < 400) return []; // ignore orb early on
      else return $monsters`spiny skelelton, toothy sklelton`;
    },
    combat: new CombatStrategy()
      .macro(
        () =>
          Macro.externalIf(
            get("lastCopyableMonster") === $monster`spiny skelelton`,
            Macro.trySkill($skill`Feel Nostalgic`)
          ),
        $monster`toothy sklelton`
      )
      .macro(
        () =>
          Macro.externalIf(
            get("lastCopyableMonster") === $monster`toothy sklelton`,
            Macro.trySkill($skill`Feel Nostalgic`)
          ),
        $monster`spiny skelelton`
      )
      .macro(
        () => ($location`The Defiled Nook`.turnsSpent === 0 ? slay_macro : new Macro()),
        $monster`party skelteon`
      )
      .macro(slay_macro, $monsters`spiny skelelton, toothy sklelton`)
      .kill($monsters`spiny skelelton, toothy sklelton`)
      .macro(
        new Macro().trySkill($skill`Fire Extinguisher: Zone Specific`),
        $monster`party skelteon`
      )
      .banish($monster`party skelteon`),
    // Don't persist banishes when just here for autumnaton
    ignore_banishes: () => AutumnAton.have() && myTurncount() < 100,
    limit: {
      soft: 37,
    },
  },
  {
    name: "Nook Eye", // In case we get eyes from outside sources (Nostalgia)
    after: ["Start"],
    priority: () => Priorities.Free,
    ready: () => have($item`evil eye`),
    completed: () => get("cyrptNookEvilness") <= 13,
    do: (): void => {
      cliExecute("use * evil eye");
    },
    freeaction: true,
    limit: { tries: 13, unready: true },
  },
  {
    name: "Nook Boss",
    after: ["Start", "Nook", "Nook Eye"],
    completed: () => get("cyrptNookEvilness") === 0 && step("questL07Cyrptic") !== -1,
    do: $location`The Defiled Nook`,
    combat: new CombatStrategy().killHard(),
    boss: true,
    limit: { tries: 2 }, // Possible dog adventure
  },
];

export const CryptQuest: Quest = {
  name: "Crypt",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(7),
      completed: () => step("questL07Cyrptic") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      priority: () => (councilSafe() ? Priorities.Free : Priorities.BadMood),
      freeaction: true,
    },
    ...Alcove,
    ...Cranny,
    ...Niche,
    ...Nook,
    {
      name: "Bonerdagon",
      after: ["Start", "Alcove Boss", "Cranny Boss", "Niche Boss", "Nook Boss"],
      priority: () => {
        if (!have($familiar`Grey Goose`) || have($item`Ghost Dog Chow`)) return Priorities.None;
        if (familiarWeight($familiar`Grey Goose`) < 6) return Priorities.BadGoose;
        return Priorities.GoodGoose;
      },
      ready: () => flyersDone() || fastFlyerPossible(),
      completed: () => step("questL07Cyrptic") >= 1,
      prepare: () => {
        if (
          myFamiliar() === $familiar`Grey Goose` &&
          familiarWeight($familiar`Grey Goose`) < 7 &&
          have($item`Ghost Dog Chow`)
        )
          use($item`Ghost Dog Chow`);
        // Try to get to level 7 to sneak a second drone here (for the goblin king)
        if (
          myFamiliar() === $familiar`Grey Goose` &&
          familiarWeight($familiar`Grey Goose`) < 7 &&
          have($item`Ghost Dog Chow`)
        )
          use($item`Ghost Dog Chow`);
      },
      do: $location`Haert of the Cyrpt`,
      outfit: { familiar: $familiar`Grey Goose` },
      choices: { 527: 1 },
      combat: new CombatStrategy()
        .macro(Macro.trySkill($skill`Emit Matter Duplicating Drones`))
        .killHard(),
      boss: true,
      limit: { tries: 1 },
    },
    {
      name: "Finish",
      after: ["Start", "Bonerdagon"],
      priority: () => (councilSafe() ? Priorities.Free : Priorities.BadMood),
      completed: () => step("questL07Cyrptic") === 999,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
