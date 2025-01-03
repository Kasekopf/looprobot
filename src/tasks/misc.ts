import { CombatStrategy, killMacro } from "../engine/combat";
import {
  adv1,
  buy,
  cliExecute,
  eat,
  equippedAmount,
  familiarWeight,
  floristAvailable,
  gamedayToInt,
  getCampground,
  getClanLounge,
  getClanName,
  haveEffect,
  haveEquipped,
  hermit,
  hippyStoneBroken,
  Item,
  itemAmount,
  knollAvailable,
  myAdventures,
  myAscensions,
  myBasestat,
  myClass,
  myDaycount,
  myFury,
  myHp,
  myLevel,
  myMaxhp,
  myMeat,
  myPrimestat,
  myTurncount,
  numericModifier,
  print,
  retrieveItem,
  runChoice,
  totalFreeRests,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $coinmaster,
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  $slot,
  $slots,
  $stat,
  AprilingBandHelmet,
  AutumnAton,
  BurningLeaves,
  byStat,
  CinchoDeMayo,
  Clan,
  ensureEffect,
  get,
  getSaleValue,
  have,
  haveInCampground,
  Macro,
  MayamCalendar,
  Robortender,
  set,
  undelay,
  uneffect,
} from "libram";
import { Quest, Task } from "../engine/task";
import { Outfit, OutfitSpec, step } from "grimoire-kolmafia";
import { Priorities } from "../engine/priority";
import { Engine, wanderingNCs } from "../engine/engine";
import { Keys, keyStrategy } from "./keys";
import {
  atLevel,
  haveLoathingIdolMicrophone,
  NO_ADVENTURE_SPENT,
  underStandard,
  YouRobot,
} from "../lib";
import { args, toTempPref } from "../args";
import { coldPlanner, yellowSubmarinePossible } from "../engine/outfit";
import { ROUTE_WAIT_TO_NCFORCE } from "../route";

const meatBuffer = 1000;

export const MiscQuest: Quest = {
  name: "Misc",
  tasks: [
    {
      name: "Unlock Beach",
      after: [],
      priority: () => Priorities.Free,
      ready: () => myMeat() >= meatBuffer + (knollAvailable() ? 538 : 5000),
      completed: () => have($item`bitchin' meatcar`) || have($item`Desert Bus pass`),
      do: () => {
        if (knollAvailable()) cliExecute("acquire 1 bitchin' meatcar");
        else cliExecute("acquire 1 desert bus pass");
      },
      outfit: { equip: $items`designer sweatpants` },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Island Scrip",
      after: ["Unlock Beach"],
      ready: () =>
        (myMeat() >= 6000 || (step("questL11Black") >= 4 && myMeat() >= meatBuffer + 500)) &&
        myAdventures() >= 20 &&
        !yellowSubmarinePossible(),
      completed: () =>
        itemAmount($item`Shore Inc. Ship Trip Scrip`) >= 3 ||
        have($item`dinghy plans`) ||
        have($item`dingy dinghy`) ||
        have($item`junk junk`) ||
        have($item`skeletal skiff`) ||
        have($item`yellow submarine`),
      do: $location`The Shore, Inc. Travel Agency`,
      outfit: () => {
        if (!get("candyCaneSwordShore")) return { equip: $items`candy cane sword cane` };
        else return {};
      },
      choices: () => {
        const swordReady =
          haveEquipped($item`candy cane sword cane`) && !get("candyCaneSwordShore");
        const statChoice = byStat({
          Muscle: 1,
          Mysticality: 2,
          Moxie: 3,
        });
        return { 793: swordReady ? 5 : statChoice };
      },
      limit: { tries: 5 },
    },
    {
      name: "Unlock Island",
      after: ["Island Scrip"],
      ready: () =>
        (myMeat() >= meatBuffer + 400 || have($item`dingy planks`)) && !yellowSubmarinePossible(),
      completed: () =>
        have($item`dingy dinghy`) ||
        have($item`junk junk`) ||
        have($item`skeletal skiff`) ||
        have($item`yellow submarine`),
      do: () => {
        retrieveItem($item`dingy planks`);
        retrieveItem($item`dinghy plans`);
        use($item`dinghy plans`);
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Unlock Island Submarine",
      after: ["Digital/Open"],
      ready: () =>
        itemAmount($item`yellow pixel`) >= 50 &&
        itemAmount($item`red pixel`) >= 5 &&
        itemAmount($item`blue pixel`) >= 5 &&
        itemAmount($item`green pixel`) >= 5,
      completed: () =>
        have($item`dingy dinghy`) ||
        have($item`junk junk`) ||
        have($item`skeletal skiff`) ||
        have($item`yellow submarine`),
      do: () => {
        retrieveItem($item`yellow submarine`);
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Floundry",
      after: [],
      ready: () => false,
      completed: () => have($item`fish hatchet`) || true,
      do: () => cliExecute("acquire 1 fish hatchet"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Acquire Kgnee",
      after: [],
      priority: () => Priorities.Free,
      ready: () =>
        have($familiar`Reagnimated Gnome`) &&
        !have($item`gnomish housemaid's kgnee`) &&
        !get(toTempPref("checkedGnome"), false) &&
        YouRobot.canUseFamiliar(),
      completed: () =>
        !have($familiar`Reagnimated Gnome`) ||
        have($item`gnomish housemaid's kgnee`) ||
        get(toTempPref("checkedGnome"), false),
      do: () => {
        visitUrl("arena.php");
        runChoice(4);
        set(toTempPref("checkedGnome"), true);
      },
      outfit: { familiar: $familiar`Reagnimated Gnome` },
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Voting",
      after: [],
      priority: () => Priorities.Free,
      ready: () => !underStandard(),
      completed: () =>
        !args.minor.voterbooth ||
        have($item`"I Voted!" sticker`) ||
        get("_voteToday") ||
        !get("voteAlways"),
      do: (): void => {
        // Taken from garbo
        const voterValueTable = [
          {
            monster: $monster`terrible mutant`,
            value: getSaleValue($item`glob of undifferentiated tissue`) + 10,
          },
          {
            monster: $monster`angry ghost`,
            value: getSaleValue($item`ghostly ectoplasm`) * 1.11,
          },
          {
            monster: $monster`government bureaucrat`,
            value: getSaleValue($item`absentee voter ballot`) * 0.05 + 75 * 0.25 + 50,
          },
          {
            monster: $monster`annoyed snake`,
            value: gamedayToInt(),
          },
          {
            monster: $monster`slime blob`,
            value: 95 - gamedayToInt(),
          },
        ];

        visitUrl("place.php?whichplace=town_right&action=townright_vote");

        const monPriority = voterValueTable
          .sort((a, b) => b.value - a.value)
          .map((element) => element.monster.name);

        const initPriority = new Map<string, number>([
          ["Meat Drop: +30", 10],
          ["Item Drop: +15", 9],
          ["Familiar Experience: +2", 8],
          ["Adventures: +1", 7],
          ["Monster Level: +10", 5],
          [`${myPrimestat()} Percent: +25`, 4],
          [`Food Drop: +30`, 3],
          [`Experience (${myPrimestat()}): +4`, 2],
          ["Meat Drop: -30", -2],
          ["Item Drop: -15", -2],
          ["Familiar Experience: -2", -2],
        ]);

        const monsterVote =
          monPriority.indexOf(get("_voteMonster1")) < monPriority.indexOf(get("_voteMonster2"))
            ? 1
            : 2;

        const voteLocalPriorityArr = [
          "_voteLocal1",
          "_voteLocal2",
          "_voteLocal3",
          "_voteLocal4",
        ].map((v, i) => [i, initPriority.get(get(v)) || (get(v).indexOf("-") === -1 ? 1 : -1)]);

        const bestVotes = voteLocalPriorityArr.sort((a, b) => b[1] - a[1]);
        const firstInit = bestVotes[0][0];

        visitUrl(
          `choice.php?option=1&whichchoice=1331&g=${monsterVote}&local[]=${firstInit}&local[]=${firstInit}`
        );

        if (!have($item`"I Voted!" sticker`)) {
          cliExecute("refresh all");
        }
      },
      limit: { tries: 2 },
      freeaction: true,
    },
    {
      name: "Protonic Ghost",
      after: [],
      completed: () => false,
      priority: () => {
        if (!get("lovebugsUnlocked") && have($item`designer sweatpants`) && get("sweat") < 5) {
          // Wait for more sweat, if possible
          return Priorities.BadSweat;
        } else return Priorities.Always;
      },
      ready: () => {
        if (!have($item`protonic accelerator pack`)) return false;
        if (get("questPAGhost") === "unstarted") return false;
        if (haveEffect($effect`Cunctatitis`)) return false;

        switch (get("ghostLocation")) {
          case $location`Cobb's Knob Treasury`:
            return step("questL05Goblin") >= 1;
          case $location`The Haunted Conservatory`:
            return step("questM20Necklace") >= 0;
          case $location`The Haunted Gallery`:
            return step("questM21Dance") >= 1;
          case $location`The Haunted Kitchen`:
            return step("questM20Necklace") >= 0;
          case $location`The Haunted Wine Cellar`:
            return step("questL11Manor") >= 1;
          case $location`The Icy Peak`:
            return step("questL08Trapper") === 999;
          case $location`Inside the Palindome`:
            return have($item`Talisman o' Namsilat`);
          case $location`The Old Landfill`:
            return myBasestat(myPrimestat()) >= 25 && step("questL02Larva") >= 0;
          case $location`Madness Bakery`:
          case $location`The Overgrown Lot`:
          case $location`The Skeleton Store`:
            return true; // Can freely start quest
          case $location`The Smut Orc Logging Camp`:
            return step("questL09Topping") >= 0;
          case $location`The Spooky Forest`:
            return step("questL02Larva") >= 0;
        }
        return false;
      },
      prepare: () => {
        // Start quests if needed
        switch (get("ghostLocation")) {
          case $location`Madness Bakery`:
            if (step("questM25Armorer") === -1) {
              visitUrl("shop.php?whichshop=armory");
              visitUrl("shop.php?whichshop=armory&action=talk");
              visitUrl("choice.php?pwd=&whichchoice=1065&option=1");
            }
            return;
          case $location`The Old Landfill`:
            if (step("questM19Hippy") === -1) {
              visitUrl("place.php?whichplace=woods&action=woods_smokesignals");
              visitUrl("choice.php?pwd=&whichchoice=798&option=1");
              visitUrl("choice.php?pwd=&whichchoice=798&option=2");
              visitUrl("woods.php");
            }
            return;
          case $location`The Overgrown Lot`:
            if (step("questM24Doc") === -1) {
              visitUrl("shop.php?whichshop=doc");
              visitUrl("shop.php?whichshop=doc&action=talk");
              runChoice(1);
            }
            return;
          case $location`The Skeleton Store`:
            if (step("questM23Meatsmith") === -1) {
              visitUrl("shop.php?whichshop=meatsmith");
              visitUrl("shop.php?whichshop=meatsmith&action=talk");
              runChoice(1);
            }
            return;
          case $location`The Icy Peak`:
            if (numericModifier("cold resistance") < 5) ensureEffect($effect`Red Door Syndrome`);
            if (numericModifier("cold resistance") < 5)
              throw `Unable to ensure cold res for The Icy Peak`;
            return;
          default:
            return;
        }
      },
      do: () => {
        adv1(get("ghostLocation") ?? $location`none`, 0, "");
        if (wanderingNCs.has(get("lastEncounter"))) {
          adv1(get("ghostLocation") ?? $location`none`, 0, "");
        }
      },
      outfit: (): OutfitSpec | Outfit => {
        if (get("ghostLocation") === $location`Inside the Palindome`)
          return {
            equip: $items`Talisman o' Namsilat, protonic accelerator pack, designer sweatpants`,
            modifier: "DA, DR",
          };
        if (get("ghostLocation") === $location`The Icy Peak`) {
          if (
            !get("lovebugsUnlocked") &&
            have($item`designer sweatpants`) &&
            get("sweat") >= 5 &&
            coldPlanner.maximumPossible(true, $slots`back, pants`) >= 5
          ) {
            return coldPlanner.outfitFor(5, {
              equip: $items`protonic accelerator pack, designer sweatpants`,
              modifier: "DA, DR",
            });
          }
          if (coldPlanner.maximumPossible(true, $slots`back`) >= 5)
            return coldPlanner.outfitFor(5, {
              equip: $items`protonic accelerator pack`,
              modifier: "DA, DR",
            });
          else return coldPlanner.outfitFor(5, { modifier: "DA, DR" }); // not enough cold res without back
        }
        return {
          equip: $items`protonic accelerator pack, designer sweatpants`,
          modifier: "DA, DR",
        };
      },
      combat: new CombatStrategy().macro(() => {
        if (get("lovebugsUnlocked")) {
          return new Macro()
            .skill($skill`Summon Love Gnats`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Trap Ghost`);
        }
        if (myClass() === $class`Seal Clubber` && myFury() >= 3 && have($skill`Club Foot`)) {
          return new Macro()
            .skill($skill`Club Foot`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Trap Ghost`);
        }

        if (haveEquipped($item`designer sweatpants`) && get("sweat") >= 5) {
          return new Macro()
            .skill($skill`Sweat Flood`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Trap Ghost`);
        }

        if (
          myHp() < myMaxhp() ||
          get("ghostLocation") === $location`The Haunted Wine Cellar` ||
          get("ghostLocation") === $location`The Overgrown Lot` ||
          equippedAmount($item`protonic accelerator pack`) === 0
        )
          return killMacro();
        else
          return new Macro()
            .skill($skill`Shoot Ghost`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Trap Ghost`);
      }),
      post: () => {
        const freeLastTurn = ["Cobb's Knob lab key"];
        if (!freeLastTurn.includes(get("lastEncounter")) && get("questPAGhost") !== "unstarted") {
          throw `Failed to kill ghost from protonic accelerator pack`;
        }
      },
      limit: { tries: 20, unready: true },
    },
    {
      name: "Acquire Birch Battery",
      after: [],
      priority: () => Priorities.Free,
      ready: () =>
        have($item`SpinMaster™ lathe`) &&
        (!get("_spinmasterLatheVisited") || have($item`flimsy hardwood scraps`)),
      completed: () => have($item`birch battery`),
      do: () => {
        visitUrl("shop.php?whichshop=lathe");
        cliExecute("acquire birch battery");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Acquire Rocket Boots",
      after: [],
      priority: () => Priorities.Free,
      ready: () => myMeat() >= meatBuffer + 1000,
      completed: () =>
        have($item`rocket boots`) ||
        get("_fireworksShopEquipmentBought") ||
        !have($item`Clan VIP Lounge key`),
      do: () => {
        visitUrl("clan_viplounge.php");
        visitUrl("clan_viplounge.php?action=fwshop&whichfloor=2");
        cliExecute("acquire rocket boots");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Hermit Clover",
      after: [],
      ready: () => myMeat() >= meatBuffer + 1000,
      completed: () => get(toTempPref("clovers")) === "true",
      do: () => {
        hermit($item`11-leaf clover`, 3);
        set(toTempPref("clovers"), "true");
      },
      outfit: { equip: $items`designer sweatpants` },
      freeaction: true,
      limit: { tries: 1 },
    },
    // {
    //   name: "Amulet Coin",
    //   after: [],
    //   completed: () =>
    //     have($item`amulet coin`) ||
    //     !have($skill`Summon Clip Art`) ||
    //     get("tomeSummons") >= 3 ||
    //     !have($familiar`Cornbeefadon`),
    //   priority: () => Priorities.Free,
    //   do: () => {
    //     retrieveItem($item`box of Familiar Jacks`);
    //     use($item`box of Familiar Jacks`);
    //   },
    //   outfit: { familiar: $familiar`Cornbeefadon` },
    //   freeaction: true,
    //   limit: { tries: 1 },
    // },
    {
      name: "Boombox",
      after: [],
      priority: () => Priorities.Free,
      completed: () =>
        !have($item`SongBoom™ BoomBox`) ||
        get("boomBoxSong") === "Total Eclipse of Your Meat" ||
        get("_boomBoxSongsLeft") === 0,
      do: () => cliExecute("boombox meat"),
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Mayday",
      after: ["Macguffin/Start"],
      priority: () => Priorities.Free,
      completed: () =>
        !get("hasMaydayContract") || (!have($item`MayDay™ supply package`) && atLevel(11)),
      ready: () => have($item`MayDay™ supply package`) && myTurncount() < 1000,
      do: () => use($item`MayDay™ supply package`),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Open Fantasy",
      after: [],
      ready: () => (get("frAlways") || get("_frToday")) && !underStandard(),
      completed: () => have($item`FantasyRealm G. E. M.`),
      do: () => {
        visitUrl("place.php?whichplace=realm_fantasy&action=fr_initcenter");
        runChoice(-1);
      },
      choices: { 1280: 1 },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Break Stone",
      after: [],
      priority: () => Priorities.Free,
      completed: () => hippyStoneBroken(),
      ready: () => args.minor.pvp,
      do: (): void => {
        visitUrl("peevpee.php?action=smashstone&pwd&confirm=on", true);
        visitUrl("peevpee.php?place=fight");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Autumnaton",
      after: [],
      priority: () => Priorities.Free,
      ready: () => AutumnAton.available(),
      completed: () => !AutumnAton.have(),
      do: () => {
        // Refresh upgrades
        AutumnAton.upgrade();

        const upgrades = AutumnAton.currentUpgrades();
        const zones = [];
        if (!upgrades.includes("leftleg1")) {
          // Low underground locations
          zones.push($location`Guano Junction`, $location`Cobb's Knob Harem`, $location`Noob Cave`);
        }
        if (!upgrades.includes("rightleg1")) {
          // Mid indoor locations
          zones.push(
            $location`The Laugh Floor`,
            $location`The Haunted Library`,
            $location`The Haunted Kitchen`
          );
        }

        if (!upgrades.includes("leftarm1")) {
          // Low indoor locations
          zones.push($location`The Haunted Pantry`);
        }
        if (!upgrades.includes("rightarm1")) {
          // Mid outdoor locations
          zones.push(
            $location`The Smut Orc Logging Camp`,
            $location`The Goatlet`,
            $location`Vanya's Castle`,
            $location`The Dark Elbow of the Woods`,
            $location`The Dark Neck of the Woods`,
            $location`The Dark Heart of the Woods`
          );
        }

        // Valuble quest locations
        if (
          itemAmount($item`barrel of gunpowder`) < 5 &&
          get("sidequestLighthouseCompleted") === "none"
        )
          zones.push($location`Sonofa Beach`);

        if (itemAmount($item`goat cheese`) < 3 && step("questL08Trapper") < 2)
          zones.push($location`The Goatlet`);

        if (step("questL09Topping") < 1) {
          zones.push($location`The Smut Orc Logging Camp`);
        }

        // Mid underground locations for autumn dollar
        zones.push(
          $location`The Defiled Nook`,
          $location`Cobb's Knob Menagerie, Level 3`,
          $location`The Deep Machine Tunnels`,
          $location`The Daily Dungeon`
        );

        zones.push($location`The Sleazy Back Alley`); // always send it somewhere
        const result = AutumnAton.sendTo(zones);
        if (result) print(`Autumnaton sent to ${result}`);
      },
      limit: { tries: 15, unready: true },
      freeaction: true,
    },
    {
      name: "Saber",
      after: [],
      priority: () => Priorities.Free,
      ready: () => have($item`Fourth of May Cosplay Saber`),
      completed: () => get("_saberMod") !== 0,
      do: (): void => {
        visitUrl("main.php?action=may4");
        // Familiar weight
        runChoice(4);
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Grapefruit",
      after: [],
      priority: () => Priorities.Free,
      ready: () =>
        have($item`filthy corduroys`) &&
        have($item`filthy knitted dread sack`) &&
        step("questL12War") < 1,
      completed: () =>
        !have($familiar`Robortender`) ||
        have($item`grapefruit`) ||
        have($item`drive-by shooting`) ||
        get("_roboDrinks").toLowerCase().includes("drive-by shooting"),
      do: () => retrieveItem($item`grapefruit`),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Prepare Robortender",
      after: ["Grapefruit"],
      priority: () => Priorities.Free,
      ready: () =>
        ((((have($item`fish head`) && have($item`boxed wine`)) || have($item`piscatini`)) &&
          have($item`grapefruit`) &&
          (get("hasCocktailKit") || myMeat() >= 1000 + meatBuffer)) ||
          have($item`drive-by shooting`)) &&
        YouRobot.canUseFamiliar(),
      completed: () =>
        myTurncount() >= 1000 ||
        get("sidequestNunsCompleted") !== "none" ||
        !have($familiar`Robortender`) ||
        get("_roboDrinks").toLowerCase().includes("drive-by shooting"),
      do: () => {
        if (!get("hasCocktailKit")) {
          retrieveItem($item`Queue Du Coq cocktailcrafting kit`);
          use($item`Queue Du Coq cocktailcrafting kit`);
        }
        retrieveItem($item`drive-by shooting`);
        Robortender.feed($item`drive-by shooting`);
      },
      outfit: { familiar: $familiar`Robortender` },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Harvest Chateau",
      after: [],
      priority: () => Priorities.Free,
      ready: () => get("chateauAvailable") && !underStandard(),
      completed: () => get("_chateauDeskHarvested"),
      do: (): void => {
        visitUrl("place.php?whichplace=chateau&action=chateau_desk2");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Emotion Chip",
      after: [],
      priority: () => Priorities.Free,
      completed: () =>
        have($skill`Emotionally Chipped`) || !have($item`spinal-fluid-covered emotion chip`),
      do: () => use($item`spinal-fluid-covered emotion chip`),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Learn About Bugs",
      after: [],
      priority: () => Priorities.Free,
      ready: () => have($item`S.I.T. Course Completion Certificate`),
      completed: () => get("_sitCourseCompleted", true) || have($skill`Insectologist`),
      do: () => use($item`S.I.T. Course Completion Certificate`),
      choices: { [1494]: 2 },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Harvest Rock Garden",
      after: [],
      priority: () => Priorities.Free,
      ready: () => haveInCampground($item`packet of rock seeds`),
      completed: () =>
        !haveInCampground($item`milestone`) || getCampground()[$item`milestone`.name] < 1,
      do: () => {
        visitUrl("campground.php?action=rgarden1&pwd");
        visitUrl("campground.php?action=rgarden2&pwd");
        visitUrl("campground.php?action=rgarden3&pwd");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Cincho",
      after: ["Friar/Start"],
      priority: () => Priorities.Free,
      completed: () =>
        !have($item`Cincho de Mayo`) ||
        (get("timesRested") >= totalFreeRests() && CinchoDeMayo.currentCinch() < 60) ||
        !forceNCneeded(),
      ready: () =>
        myTurncount() >= ROUTE_WAIT_TO_NCFORCE &&
        atLevel(6) &&
        have($item`Cincho de Mayo`) &&
        CinchoDeMayo.currentCinch() >= 60 &&
        !get("noncombatForcerActive"),
      outfit: { equip: $items`Cincho de Mayo` },
      do: () => useSkill($skill`Cincho: Fiesta Exit`),
      freeaction: true,
      limit: { unready: true },
    },
    {
      name: "Cincho Rest",
      after: [],
      priority: () => Priorities.Free,
      ready: () =>
        CinchoDeMayo.currentCinch() + CinchoDeMayo.cinchRestoredBy() <= 100 &&
        (get("chateauAvailable") || get("getawayCampsiteUnlocked")),
      completed: () =>
        !have($item`Cincho de Mayo`) ||
        get("timesRested") >= totalFreeRests() ||
        get("timesRested") >= 17,
      do: () => {
        if (get("chateauAvailable") && !underStandard()) {
          visitUrl("place.php?whichplace=chateau&action=chateau_restlabelfree");
        } else if (get("getawayCampsiteUnlocked") && !underStandard()) {
          visitUrl("place.php?whichplace=campaway&action=campaway_tentclick");
        } else {
          visitUrl("campground.php?action=rest");
        }
      },
      outfit: { modifier: "exp" },
      freeaction: true,
      limit: {
        tries: 26, // Total unrestricted free rests
        guard: NO_ADVENTURE_SPENT,
      },
    },
    {
      name: "2002 Store",
      after: [],
      priority: () => Priorities.Free,
      completed: () =>
        !have($item`2002 Mr. Store Catalog`) ||
        (get("availableMrStore2002Credits") === 0 && get("_2002MrStoreCreditsCollected")),
      do: () => {
        if (!haveLoathingIdolMicrophone()) {
          buy($coinmaster`Mr. Store 2002`, 1, $item`Loathing Idol Microphone`);
        }
        if (
          !have($item`Charter: Nellyville`) &&
          get("availableMrStore2002Credits") > 0 &&
          !have($effect`Hot in Herre`)
        ) {
          buy($coinmaster`Mr. Store 2002`, 1, $item`Charter: Nellyville`);
        }
        if (get("availableMrStore2002Credits") > 0) {
          buy(
            $coinmaster`Mr. Store 2002`,
            get("availableMrStore2002Credits"),
            $item`Spooky VHS Tape`
          );
        }
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Shadow Lodestone",
      after: ["Leveling/Shadow Rift", "Macguffin/Upper Chamber"],
      completed: () => have($effect`Shadow Waters`) || !have($item`Rufus's shadow lodestone`),
      do: $location`Shadow Rift (The Misspelled Cemetary)`,
      choices: {
        1500: 2,
      },
      combat: new CombatStrategy().macro(Macro.abort()),
      limit: { tries: 1 },
    },
    {
      name: "Eldritch Tentacle",
      after: ["Keys/Star Key", "Crypt/Cranny"],
      ready: () => false,
      completed: () => get("_eldritchTentacleFought"),
      do: () => {
        visitUrl("place.php?whichplace=forestvillage&action=fv_scientist", false);
        runChoice(1);
      },
      combat: new CombatStrategy().killHard(),
      limit: { tries: 1 },
    },
    {
      name: "Horsery",
      after: [],
      priority: () => Priorities.Free,
      ready: () => get("horseryAvailable"),
      completed: () => get("_horsery") === "dark horse",
      do: () => cliExecute("horsery dark"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Wish",
      priority: () => Priorities.Free,
      after: [],
      completed: () => get("_genieWishesUsed") >= 3 || !have($item`genie bottle`),
      do: () => cliExecute(`genie wish for more wishes`),
      limit: { tries: 3 },
      freeaction: true,
    },
    {
      name: "Cowboy Boots",
      priority: () => Priorities.Free,
      after: [],
      completed: () => have($item`your cowboy boots`) || !get("telegraphOfficeAvailable"),
      do: () => visitUrl("place.php?whichplace=town_right&action=townright_ltt"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Barrel Lid",
      priority: () => Priorities.Free,
      after: [],
      completed: () => get("_barrelPrayer") || !get("barrelShrineUnlocked") || myDaycount() > 1,
      do: () => {
        visitUrl("da.php?barrelshrine=1");
        runChoice(-1);
      },
      choices: { 1100: 1 },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Leaf Resin",
      priority: () => Priorities.Free,
      ready: () =>
        BurningLeaves.have() && BurningLeaves.numberOfLeaves() >= 50 && !have($effect`Resined`),
      completed: () => step("questL12War") === 999, // Stop near the end of the run
      acquire: [{ item: $item`distilled resin` }],
      do: () => use($item`distilled resin`),
      limit: { tries: 5, unready: true },
      freeaction: true,
    },
    {
      name: "Apriling Acquire Tuba",
      priority: () => Priorities.Free,
      ready: () => get("_aprilBandInstruments") + args.minor.saveapril < 2,
      completed: () => !AprilingBandHelmet.have() || have($item`Apriling band tuba`),
      do: () => AprilingBandHelmet.joinSection($item`Apriling band tuba`),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Apriling Force Tuba",
      after: ["Apriling Acquire Tuba"],
      priority: () => Priorities.Free,
      ready: () =>
        have($item`Apriling band tuba`) &&
        myTurncount() >= ROUTE_WAIT_TO_NCFORCE &&
        atLevel(6) &&
        !get("noncombatForcerActive"),
      completed: () => !AprilingBandHelmet.have() || $item`Apriling band tuba`.dailyusesleft === 0,
      do: () => AprilingBandHelmet.play($item`Apriling band tuba`, true),
      limit: { tries: 3, unready: true },
      freeaction: true,
    },
    {
      name: "Apriling Acquire Piccolo",
      after: ["Apriling Acquire Tuba"],
      priority: () => Priorities.Free,
      ready: () =>
        get("_aprilBandInstruments") + args.minor.saveapril < 2 &&
        (!have($item`closed-circuit pay phone`) ||
          !get("neverendingPartyAlways") ||
          !get("snojoAvailable")),
      completed: () => !AprilingBandHelmet.have() || have($item`Apriling band piccolo`),
      do: () => AprilingBandHelmet.joinSection($item`Apriling band piccolo`),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Apriling Piccolo",
      after: ["Leveling/Acquire Mouthwash", "Leveling/Mouthwash"],
      priority: () => Priorities.Free,
      ready: () =>
        have($item`Apriling band piccolo`) &&
        familiarWeight($familiar`Grey Goose`) < 19 &&
        YouRobot.canUseFamiliar() &&
        myLevel() < 13, // only if we need it for leveling after mouthwash
      completed: () =>
        !AprilingBandHelmet.have() || $item`Apriling band piccolo`.dailyusesleft === 0,
      do: () => AprilingBandHelmet.play($item`Apriling band piccolo`, true),
      outfit: { familiar: $familiar`Grey Goose` },
      limit: { tries: 3 },
      freeaction: true,
    },
    {
      name: "Power Plant",
      priority: () => Priorities.Free,
      completed: () =>
        !have($item`potted power plant`) || get("_pottedPowerPlant") === "0,0,0,0,0,0,0",
      do: () => {
        visitUrl("inv_use.php?pwd&which=3&whichitem=10738");
        get("_pottedPowerPlant")
          .split(",")
          .forEach((v, i) => {
            if (v === "1") runChoice(1, `pp=${i + 1}`);
          });
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Mayam Calendar",
      after: ["Robot/Equip Top Initial"],
      priority: () => Priorities.Free,
      ready: () => YouRobot.canUseFamiliar(),
      completed: () => !MayamCalendar.have() || MayamCalendar.remainingUses() === 0,
      do: () => {
        cliExecute("mayam rings fur lightning eyepatch yam");
        cliExecute("mayam rings chair wood cheese clock");
        cliExecute("mayam rings eye meat wall explosion");
      },
      outfit: () => {
        if (
          myTurncount() <= 10 &&
          (!have($item`closed-circuit pay phone`) ||
            !get("neverendingPartyAlways") ||
            !get("snojoAvailable"))
        )
          return { familiar: $familiar`Grey Goose` };
        else return { familiar: $familiar`Chest Mimic` };
      },
      limit: { tries: 2 },
      freeaction: true,
    },
    {
      name: "Temple High",
      after: ["Mayam Calendar", "Orc Chasm/Oil Jar", "Shadow Lodestone"],
      ready: () => have($effect`Frosty`) && have($effect`Shadow Waters`),
      completed: () => !have($item`stone wool`) || get("lastTempleAdventures") === myAscensions(),
      prepare: () => ensureEffect($effect`Stone-Faced`),
      do: $location`The Hidden Temple`,
      choices: { 582: 1, 579: 3 },
      limit: { tries: 1 },
      expectbeatenup: true,
    },
    {
      name: "Untinkerer Start",
      after: ["Mosquito/Start"],
      priority: () => Priorities.Free,
      completed: () => step("questM01Untinker") > -1,
      do: () =>
        visitUrl(
          "place.php?whichplace=forestvillage&preaction=screwquest&action=fv_untinker_quest"
        ),
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Untinkerer Do",
      after: ["Untinkerer Start"],
      priority: () => Priorities.Free,
      ready: () => knollAvailable(),
      completed: () => step("questM01Untinker") === 999 || have($item`rusty screwdriver`),
      do: () => visitUrl("place.php?whichplace=knoll_friendly&action=dk_innabox"),
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Untinkerer Finish",
      after: ["Untinkerer Do"],
      priority: () => Priorities.Free,
      ready: () => knollAvailable(),
      completed: () => step("questM01Untinker") === 999,
      do: () => visitUrl("place.php?whichplace=forestvillage&action=fv_untinker"),
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Range",
      after: [],
      priority: () => Priorities.Free,
      ready: () => myMeat() >= 1000 + meatBuffer || have($item`Dramatic™ range`),
      completed: () => get("hasRange"),
      do: () => {
        retrieveItem($item`Dramatic™ range`);
        use($item`Dramatic™ range`);
      },
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Eat Sausage",
      after: [],
      priority: () => Priorities.FreePositive,
      ready: () => {
        if (myTurncount() < 10) return false;
        if (!have($item`magical sausage casing`)) return false;
        if (myMeat() < (1 + get("_sausagesEaten")) * 111) return false;

        const advBeforeHalt = myAdventures() - args.debug.halt;
        // Prepare for Ed
        if (get("pyramidBombUsed") && step("questL11Pyramid") < 999) advBeforeHalt <= 7;
        // Prepare for hedge maze
        if (step("questL13Final") === 4) return advBeforeHalt <= 4;
        return advBeforeHalt <= 1;
      },
      completed: () => get("_sausagesEaten") >= 23,
      do: () => eat($item`magical sausage`),
      freeaction: true,
      ignorehalt: true,
      limit: { tries: 23 },
    },
    {
      name: "Bird Calendar",
      after: [],
      priority: () => Priorities.Free,
      completed: () => get("_canSeekBirds") || !have($item`Bird-a-Day calendar`),
      do: () => use($item`Bird-a-Day calendar`),
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Floundry Hatchet",
      after: ["Orc Chasm/Start"],
      priority: () => Priorities.Free,
      completed: () => !have($item`fish hatchet`) || get("_floundryItemUsed"),
      do: () => use($item`fish hatchet`),
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Check Florist",
      after: ["Mosquito/Start"],
      priority: () => Priorities.Free,
      completed: () => get("floristFriarChecked"),
      do: () => floristAvailable(),
      freeaction: true,
      limit: { completed: true },
    },
    {
      name: "Ice Cold April Shower",
      after: [],
      priority: () => Priorities.Free,
      ready: () => have($item`Clan VIP Lounge key`) && getClanLounge()["Clan shower"] !== undefined,
      completed: () => get("_aprilShower"),
      do: () => cliExecute("try; shower ice"),
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Cut Melodramedary",
      after: [],
      priority: () => Priorities.Start,
      ready: () => YouRobot.canUse($slot`weapon`),
      completed: () =>
        get("_entauntaunedToday") ||
        !have($familiar`Melodramedary`) ||
        !have($item`Fourth of May Cosplay Saber`) ||
        !have($familiar`Shorter-Order Cook`),
      do: () => {
        visitUrl("main.php?action=camel");
        runChoice(1);
      },
      outfit: {
        familiar: $familiar`Melodramedary`,
        weapon: $item`Fourth of May Cosplay Saber`,
      },
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Tot Res Outfit",
      after: [],
      priority: () => Priorities.Free,
      ready: () => myMeat() >= meatBuffer + 1000,
      completed: () =>
        have($item`li'l candy corn costume`) || !have($familiar`Trick-or-Treating Tot`),
      do: () => buy($item`li'l candy corn costume`),
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Structural Ember",
      after: [],
      priority: () => Priorities.Free,
      completed: () => !have($item`structural ember`) || get("_structuralEmberUsed", false),
      do: () => use($item`structural ember`),
      freeaction: true,
      limit: { tries: 2 },
    },
    {
      name: "Clan Photo Booth Free Kill",
      after: [],
      priority: () => Priorities.Free,
      completed: () =>
        get(toTempPref("photoBoothChecked"), false) ||
        (have($item`Sheriff moustache`) &&
          have($item`Sheriff badge`) &&
          have($item`Sheriff pistol`)) ||
        get("_photoBoothEquipment", 0) >= 3,
      do: (): void => {
        set(toTempPref("photoBoothChecked"), true);
        if (getClanName() !== "Bonus Adventures from Hell") {
          const clanWL = Clan.getWhitelisted();
          const bafhWL =
            clanWL.find((c) => c.name === getClanName()) !== undefined &&
            clanWL.find((c) => c.name === "Bonus Adventures from Hell") !== undefined;
          if (!bafhWL) return;
        }

        Clan.with("Bonus Adventures from Hell", () => {
          cliExecute("photobooth item moustache");
          cliExecute("photobooth item badge");
          cliExecute("photobooth item pistol");
        });
      },
      freeaction: true,
      limit: { tries: 3 },
    },
    {
      name: "Open McHugeLarge Bag",
      after: [],
      priority: () => Priorities.Free,
      completed: () =>
        // eslint-disable-next-line libram/verify-constants
        !have($item`McHugeLarge duffel bag`) || have($item`McHugeLarge right pole`),
      // eslint-disable-next-line libram/verify-constants
      do: () => use($item`McHugeLarge duffel bag`),
      freeaction: true,
      limit: { tries: 1 },
    },
  ],
};

export const WandQuest: Quest = {
  name: "Wand",
  tasks: [
    {
      name: "Plus Sign",
      after: [],
      ready: () =>
        myBasestat($stat`muscle`) >= 45 &&
        myBasestat($stat`mysticality`) >= 45 &&
        myBasestat($stat`moxie`) >= 45 &&
        (keyStrategy.useful(Keys.Zap) || args.minor.wand),
      completed: () => have($item`plus sign`) || get("lastPlusSignUnlock") === myAscensions(),
      do: $location`The Enormous Greater-Than Sign`,
      outfit: { modifier: "-combat" },
      choices: { 451: 3 },
      limit: { soft: 20 },
    },
    {
      name: "Get Teleportitis",
      after: ["Plus Sign"],
      ready: () =>
        myMeat() >= 1000 && // Meat for goal teleportitis choice adventure
        have($item`soft green echo eyedrop antidote`) && // Antitdote to remove teleportitis afterwards
        (keyStrategy.useful(Keys.Zap) || args.minor.wand),
      completed: () => have($effect`Teleportitis`) || get("lastPlusSignUnlock") === myAscensions(),
      do: $location`The Enormous Greater-Than Sign`,
      outfit: { modifier: "-combat" },
      choices: { 451: 5 },
      limit: { soft: 20 },
    },
    {
      name: "Mimic",
      after: ["Get Teleportitis"],
      ready: () => myMeat() >= 5000,
      completed: () =>
        have($item`dead mimic`) ||
        get("lastZapperWand") === myAscensions() ||
        have($item`aluminum wand`) ||
        have($item`ebony wand`) ||
        have($item`hexagonal wand`) ||
        have($item`marble wand`) ||
        have($item`pine wand`) ||
        (keyStrategy.useful(Keys.Zap) === false && !args.minor.wand),
      prepare: () => {
        if (have($item`plus sign`)) use($item`plus sign`);
      },
      do: $location`The Dungeons of Doom`,
      outfit: { modifier: "-combat, init" },
      orbtargets: () => undefined,
      combat: new CombatStrategy()
        .banish($monster`Quantum Mechanic`)
        .kill($monsters`mimic, The Master Of Thieves`), // Avoid getting more teleportitis
      choices: { 25: 2 },
      limit: { soft: 20 },
    },
    {
      name: "Wand",
      after: ["Mimic"],
      completed: () =>
        get("lastZapperWand") === myAscensions() ||
        have($item`aluminum wand`) ||
        have($item`ebony wand`) ||
        have($item`hexagonal wand`) ||
        have($item`marble wand`) ||
        have($item`pine wand`) ||
        keyStrategy.useful(Keys.Zap) === false,
      do: () => use($item`dead mimic`),
      freeaction: true,
      limit: { tries: 1 },
    },
  ],
};

export function teleportitisTask(engine: Engine, tasks: Task[]): Task {
  // Combine the choice selections from all tasks
  // Where multiple tasks make different choices at the same choice, prefer:
  //  * Earlier tasks to later tasks
  //  * Uncompleted tasks to completed tasks
  const choices: Task["choices"] = { 3: 3 }; // The goal choice

  const done_tasks = tasks.filter((task) => task.completed());
  const left_tasks = tasks.filter((task) => !task.completed());
  for (const task of [...left_tasks, ...done_tasks].reverse()) {
    const task_choices = undelay(task.choices);
    for (const choice_id_str in task_choices) {
      const choice_id = parseInt(choice_id_str);
      choices[choice_id] = task_choices[choice_id];
    }
  }

  // Escape the hidden city alters
  choices[781] = 6;
  choices[783] = 6;
  choices[785] = 6;
  choices[787] = 6;
  if (step("questL11Worship") >= 3) {
    // Escape the hidden heart of the hidden temple
    choices[580] = 3;
  }
  // Exit NEP intro choice
  choices[1322] = 6;
  // Leave the gingerbread city clock alone
  choices[1215] = 2;
  // Leave the daily dungeon alone
  choices[689] = 1;
  choices[690] = 3;
  choices[691] = 3;
  choices[692] = 8;
  choices[693] = 3;
  // Leave the shore alone
  choices[793] = 4;

  const combat = new CombatStrategy();
  const haiku_monsters = [
    $monster`amateur ninja`,
    $monster`ancient insane monk`,
    $monster`ferocious bugbear`,
    $monster`gelatinous cube`,
    $monster`Knob Goblin poseur`,
  ];
  combat.macro(new Macro().attack().repeat(), haiku_monsters);

  return {
    name: "Teleportitis",
    after: ["Wand/Get Teleportitis"],
    ready: () => have($effect`Teleportitis`),
    completed: () => get("lastPlusSignUnlock") === myAscensions(),
    do: $location`The Enormous Greater-Than Sign`,
    post: () => {
      // Some tracking is broken when we encounter it with teleportitis
      if (get("lastEncounter") === "Having a Ball in the Ballroom") set("questM21Dance", "step4");
      if (get("lastEncounter") === "Too Much Humanity" && step("questL11Ron") < 1)
        set("questL11Ron", "step1");
    },
    outfit: { equip: $items`muculent machete` },
    combat: combat,
    choices: choices,
    limit: { soft: 20 },
  };
}

export const removeTeleportitis = {
  name: "Clear Teleportitis",
  after: [],
  ready: () => have($item`soft green echo eyedrop antidote`),
  completed: () => !have($effect`Teleportitis`),
  do: () => {
    uneffect($effect`Teleportitis`);
  },
  limit: { soft: 2 },
  freeaction: true,
};

export function haveOre() {
  if (step("questL08Trapper") >= 2) return true;
  if (get("trapperOre") !== "") {
    return itemAmount(Item.get(get("trapperOre"))) >= 3;
  }
  return (
    itemAmount($item`asbestos ore`) >= 3 &&
    itemAmount($item`chrome ore`) >= 3 &&
    itemAmount($item`linoleum ore`) >= 3
  );
}

export function trainSetAvailable() {
  return false;
}

function forceNCneeded() {
  if (step("questL02Larva") < 1) return true;
  if (!have($item`dodecagram`) && step("questL06Friar") < 999) return true;
  if (!have($item`box of birthday candles`) && step("questL06Friar") < 999) return true;
  if (!have($item`eldritch butterknife`) && step("questL06Friar") < 999) return true;
  return false;
}
