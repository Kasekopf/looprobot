import { CombatStrategy, killMacro } from "../engine/combat";
import {
  adv1,
  buy,
  cliExecute,
  equippedAmount,
  fullnessLimit,
  gamedayToInt,
  getCampground,
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
  myFullness,
  myFury,
  myHp,
  myMaxhp,
  myMaxmp,
  myMeat,
  myMp,
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
  $slots,
  $stat,
  AprilingBandHelmet,
  AutumnAton,
  BurningLeaves,
  byClass,
  byStat,
  CinchoDeMayo,
  ensureEffect,
  get,
  getSaleValue,
  have,
  haveInCampground,
  Macro,
  Robortender,
  set,
  undelay,
  uneffect,
} from "libram";
import { Quest, Task } from "../engine/task";
import { Guards, Outfit, OutfitSpec, step } from "grimoire-kolmafia";
import { Priorities } from "../engine/priority";
import { Engine, wanderingNCs } from "../engine/engine";
import { Keys, keyStrategy } from "./keys";
import { atLevel, haveLoathingIdolMicrophone, underStandard } from "../lib";
import { args } from "../args";
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
        !get("_loopcasual_checkedGnome", false),
      completed: () =>
        !have($familiar`Reagnimated Gnome`) ||
        have($item`gnomish housemaid's kgnee`) ||
        get("_loopcasual_checkedGnome", false),
      do: () => {
        visitUrl("arena.php");
        runChoice(4);
        set("_loopcasual_checkedGnome", true);
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
          [`${myPrimestat()} Percent: +25`, 3],
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
        const secondInit = bestVotes[1][0];

        visitUrl(
          `choice.php?option=1&whichchoice=1331&g=${monsterVote}&local[]=${firstInit}&local[]=${secondInit}`
        );

        if (!have($item`"I Voted!" sticker`)) {
          cliExecute("refresh all");
        }
      },
      limit: { tries: 1 },
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
        if (get("questPAGhost") !== "unstarted") {
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
      after: ["Hidden City/Open Temple"],
      ready: () => myMeat() >= meatBuffer + 1000,
      completed: () => get("_looprobot_clovers") === "true",
      do: () => {
        hermit($item`11-leaf clover`, 3);
        set("_looprobot_clovers", "true");
      },
      outfit: { equip: $items`designer sweatpants` },
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Grey Down Vest",
      after: [],
      completed: () =>
        have($item`grey down vest`) ||
        !have($skill`Summon Clip Art`) ||
        get("tomeSummons") >= 3 ||
        !have($familiar`Grey Goose`),
      priority: () => Priorities.Free,
      do: () => {
        retrieveItem($item`box of Familiar Jacks`);
        use($item`box of Familiar Jacks`);
      },
      outfit: { familiar: $familiar`Grey Goose` },
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Grey Goose Vest",
      after: [],
      completed: () =>
        have($item`dromedary drinking helmet`) ||
        !have($skill`Summon Clip Art`) ||
        get("tomeSummons") >= 3 ||
        !have($familiar`Melodramedary`),
      priority: () => Priorities.Free,
      do: () => {
        retrieveItem($item`box of Familiar Jacks`);
        use($item`box of Familiar Jacks`);
      },
      outfit: { familiar: $familiar`Melodramedary` },
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
        (((have($item`fish head`) && have($item`boxed wine`)) || have($item`piscatini`)) &&
          have($item`grapefruit`)) ||
        have($item`drive-by shooting`),
      completed: () =>
        myTurncount() >= 1000 ||
        get("sidequestNunsCompleted") !== "none" ||
        !have($familiar`Robortender`) ||
        get("_roboDrinks").toLowerCase().includes("drive-by shooting"),
      do: () => {
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
      completed: () => have($skill`Emotionally Chipped`) || !have($item`emotion chip`),
      do: () => use($item`emotion chip`),
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
        (get("timesRested") >= totalFreeRests() && CinchoDeMayo.currentCinch() < 60),
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
      ready: () => CinchoDeMayo.currentCinch() + CinchoDeMayo.cinchRestoredBy() <= 100,
      completed: () =>
        !have($item`Cincho de Mayo`) ||
        get("timesRested") >= totalFreeRests() ||
        get("timesRested") >= 17,
      do: () => {
        if (myMp() === myMaxmp() && myHp() === myMaxhp()) {
          // We cannot rest with full HP and MP, so burn 1 MP with a starting skill.
          useSkill(
            byClass({
              "Seal Clubber": $skill`Seal Clubbing Frenzy`,
              "Turtle Tamer": $skill`Patience of the Tortoise`,
              Pastamancer: $skill`Manicotti Meditation`,
              Sauceror: $skill`Sauce Contemplation`,
              "Disco Bandit": $skill`Disco Aerobics`,
              "Accordion Thief": $skill`Moxie of the Mariachi`,
              default: $skill`none`,
            })
          );
        }

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
        guard: Guards.create(
          () => myAdventures(),
          (adv) => myAdventures() === adv // Assert we did not use an adventure
        ),
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
      ready: () => get("questL02Larva") !== "unstarted",
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
      after: ["McLargeHuge/Ninja"],
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
      completed: () => get("_barrelPrayer") || !get("barrelShrineUnlocked"),
      do: () => {
        visitUrl("da.php?barrelshrine=1");
        runChoice(-1);
      },
      choices: { 1100: 1 },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Delevel",
      priority: () => Priorities.Free,
      after: ["Tower/Shadow"],
      ready: () => myFullness() === fullnessLimit(),
      completed: () => !args.minor.delevel || !atLevel(14) || !have($item`Clan VIP Lounge key`),
      do: () => cliExecute("eat basic hot dog"),
      freeaction: true,
      limit: { tries: 15 },
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
      name: "Acquire Tuba",
      priority: () => Priorities.Free,
      ready: () => !args.minor.savetuba && AprilingBandHelmet.canJoinSection(),
      completed: () => have($item`Apriling band tuba`),
      do: () => AprilingBandHelmet.joinSection($item`Apriling band tuba`),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Force Tuba",
      after: ["Acquire Tuba"],
      priority: () => Priorities.Free,
      ready: () =>
        have($item`Apriling band tuba`) &&
        myTurncount() >= ROUTE_WAIT_TO_NCFORCE &&
        atLevel(6) &&
        !get("noncombatForcerActive"),
      completed: () => $item`Apriling band tuba`.dailyusesleft > 0,
      do: () => AprilingBandHelmet.play($item`Apriling band tuba`, true),
      limit: { tries: 3, unready: true },
      freeaction: true,
    },
    {
      name: "Power Plant",
      priority: () => Priorities.Free,
      completed: () =>
        !have($item`potted power plant`) || get("_pottedPowerPlant") === "0,0,0,0,0,0,0",
      do: () => {
        use($item`potted power plant`);
        get("_pottedPowerPlant")
          .split(",")
          .forEach((v, i) => {
            if (v === "1") runChoice(1, `pp=${i + 1}`);
          });
      },
      limit: { tries: 1 },
      freeaction: true,
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
