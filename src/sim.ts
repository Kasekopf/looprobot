import {
  Familiar,
  Item,
  mallPrice,
  Monster,
  print,
  printHtml,
  Skill,
  storageAmount,
} from "kolmafia";
import {
  $familiar,
  $item,
  $monster,
  $skill,
  AutumnAton,
  CampAway,
  CombatLoversLocket,
  get,
  have,
  permedSkills,
} from "libram";
import { pullStrategy } from "./tasks/pulls";

class Hardcoded {
  have: boolean;
  name: string;

  constructor(have: boolean, name: string) {
    this.have = have;
    this.name = name;
  }
}

type Thing = Item | Familiar | Skill | Monster | Hardcoded;
interface Requirement {
  thing: Thing | Thing[];
  why: string;
  required?: boolean;
}

/**
 * Return: a list of all things required to run the script.
 */
function buildIotmList(): Requirement[] {
  let freeFightSources = 0;
  if (get("snojoAvailable")) freeFightSources += 1;
  if (get("neverendingPartyAlways")) freeFightSources += 1;
  if (have($item`closed-circuit pay phone`)) freeFightSources += 1;

  return [
    {
      thing: new Hardcoded(
        freeFightSources >= 2,
        "Two of (Snojo, Neverending Party, closed-circuit pay phone)"
      ),
      why: "Leveling with Goose",
      required: true,
    },
    { thing: $item`Clan VIP Lounge key`, why: "YRs, +combat" },
    {
      thing: $familiar`Artistic Goth Kid`,
      why: "Wanderers",
    },
    {
      thing: $familiar`Reagnimated Gnome`,
      why: "Adv gain",
    },
    {
      thing: new Hardcoded(get("chateauAvailable"), "Chateau Mantegna"),
      why: "Free rests, +exp",
    },
    {
      thing: new Hardcoded(get("lovebugsUnlocked"), "Lovebugs"),
      why: "Crypt, Desert",
    },
    {
      thing: $item`Deck of Every Card`,
      why: "A key for the NS tower, stone wool, ore",
    },
    {
      thing: new Hardcoded(get("snojoAvailable"), "Snojo"),
      why: "Leveling with Goose",
    },
    {
      thing: $item`protonic accelerator pack`,
      why: "Wanderers",
    },
    {
      thing: $familiar`Trick-or-Treating Tot`,
      why: "+item",
    },
    {
      thing: new Hardcoded(get("loveTunnelAvailable"), "LOV Tunnel"),
      why: "+exp, leveling",
    },
    {
      thing: $item`Kremlin's Greatest Briefcase`,
      why: "Banishes",
    },
    {
      thing: [$item`genie bottle`, $item`cursed monkey's paw`],
      why: "Leveling with Goose",
      required: true,
    },
    {
      thing: $item`genie bottle`,
      why: "Leveling with Goose",
    },
    {
      thing: $item`January's Garbage Tote`,
      why: "+item, +meat",
    },
    {
      thing: $familiar`God Lobster`,
      why: "Leveling",
    },
    {
      thing: $item`SongBoom™ BoomBox`,
      why: "Meat and special seasonings",
    },
    {
      thing: new Hardcoded(get("neverendingPartyAlways"), "Neverending Party"),
      why: "Leveling with Goose",
    },
    {
      thing: $item`Bastille Battalion control rig`,
      why: "+exp",
    },
    {
      thing: $item`latte lovers member's mug`,
      why: "Banishes",
    },
    {
      thing: new Hardcoded(get("voteAlways"), "Voting Booth"),
      why: "Wanderers",
    },
    {
      thing: new Hardcoded(get("daycareOpen"), "Boxing Daycare"),
      why: "+exp",
    },
    {
      thing: $item`Kramco Sausage-o-Matic™`,
      why: "Wanderers",
    },
    {
      thing: $item`Lil' Doctor™ bag`,
      why: "Banish, instakill, +item",
    },
    {
      thing: $item`Fourth of May Cosplay Saber`,
      why: "Familiar Weight",
    },
    {
      thing: new Hardcoded(CampAway.have(), "Distant Woods Getaway Brochure"),
      why: "+exp",
      required: true,
    },
    {
      thing: $item`Powerful Glove`,
      why: "Pixels",
    },
    { thing: $familiar`Left-Hand Man`, why: "Carn plant" },
    { thing: $familiar`Melodramedary`, why: "Desert progress" },
    {
      thing: $item`Cargo Cultist Shorts`,
      why: "Mountain man",
    },
    {
      thing: $item`unwrapped knock-off retro superhero cape`,
      why: "Slay the dead in crypt, survivng",
    },
    {
      thing: $item`miniature crystal ball`,
      why: "Monster prediction",
    },
    {
      thing: $skill`Emotionally Chipped`,
      why: "Banish, -combat, items",
      required: true,
    },
    {
      thing: $item`potted power plant`,
      why: "+Adv",
    },
    {
      thing: $item`backup camera`,
      why: "ML, init",
    },
    {
      thing: $familiar`Shorter-Order Cook`,
      why: "Kill the Wall of Skin, initial exp",
    },
    {
      thing: $item`familiar scrapbook`,
      why: "+exp",
    },
    {
      thing: $item`industrial fire extinguisher`,
      why: "Harem outfit, Bat hole, stone wool, Crypt, Ultrahydrated, Shadow bricks",
    },
    {
      thing: $item`Daylight Shavings Helmet`,
      why: "+meat, +item",
    },
    {
      thing: $item`cursed magnifying glass`,
      why: "Wanderers",
    },
    {
      thing: new Hardcoded(
        have($item`cosmic bowling ball`) || get("cosmicBowlingBallReturnCombats", -1) >= 0,
        "Cosmic bowling ball"
      ),
      why: "Banishes",
    },
    {
      thing: $item`combat lover's locket`,
      why: "Reminiscing",
      required: true,
    },
    { thing: $familiar`Grey Goose`, why: "Leveling, duplication drones", required: true },
    {
      thing: $item`unbreakable umbrella`,
      why: "-combat modifier, ML",
    },
    {
      thing: $item`June cleaver`,
      why: "Tavern, +adv, survivng",
      required: true,
    },
    {
      thing: $item`designer sweatpants`,
      why: "Sleaze damage, +init",
    },
    {
      thing: $item`Jurassic Parka`,
      why: "Meat, ML, -combat forces, survivng",
      required: true,
    },
    {
      thing: new Hardcoded(AutumnAton.have(), "autumn-aton"),
      why: "Lobsterfrogman",
    },
    {
      thing: $item`S.I.T. Course Completion Certificate`,
      why: "Profit, +meat",
    },
    {
      thing: $item`closed-circuit pay phone`,
      why: "Shadow bricks, +meat, Leveling with Goose",
    },
    {
      thing: $item`cursed monkey's paw`,
      why: "Banishes",
    },
    {
      thing: $item`Cincho de Mayo`,
      why: "-combat forces",
    },
    {
      thing: $item`2002 Mr. Store Catalog`,
      why: "+item, +init, wanderers",
    },
    {
      thing: $familiar`Patriotic Eagle`,
      why: "Niche, Palindome, Twin Paak",
    },
    {
      thing: $item`august scepter`,
      why: "Protestors, Nuns",
    },
    {
      thing: $familiar`Jill-of-All-Trades`,
      why: "+meat, +item",
    },
    {
      thing: $item`candy cane sword cane`,
      why: "NS key, protestors, black forest, war start, bowling, shore",
    },
    {
      thing: $item`spring shoes`,
      why: "Runaways, Leveling",
    },
    {
      thing: $item`Everfull Dart Holster`,
      why: "Free kills",
    },
    {
      thing: $item`Apriling band helmet`,
      why: "-combat forces",
    },
    {
      thing: $item`Mayam Calendar`,
      why: "Free rests, fam exp",
    },
    {
      thing: $item`Roman Candelabra`,
      why: "Monster copies for delay",
    },
  ];
}

function buildLocketList(): Requirement[] {
  return [
    {
      thing: $monster`Astronomer`,
      why: "Star Key",
    },
    {
      thing: $monster`Camel's Toe`,
      why: "Star Key",
    },
    {
      thing: $monster`Baa'baa'bu'ran`,
      why: "Wool",
    },
    {
      thing: $monster`mountain man`,
      why: "Ore",
    },
    {
      thing: $monster`War Frat 151st Infantryman`,
      why: "Outfit",
    },
  ];
}

function buildMiscList(): Requirement[] {
  return [
    {
      thing: $familiar`Oily Woim`,
      why: "Bonus initiative",
    },
    {
      thing: $familiar`Gelatinous Cubeling`,
      why: "Daily dungeon",
    },
    {
      thing: $familiar`Hobo Monkey`,
      why: "Meat drops",
    },
    {
      thing: new Hardcoded(get("poolSharkCount") >= 25, "Permanent pool skill from A Shark's Chum"),
      why: "Haunted billiards room",
    },
  ];
}

function buildPullList(optional: boolean): Requirement[] {
  const result: Requirement[] = [];
  for (const pull of pullStrategy.pulls) {
    const items = pull.items().filter((item) => item) as Item[];

    // Ignore dynamic item selection for now
    if (items.length === 0) continue;

    // For cheap items, we will just buy it during the run
    const big_items = items.filter((item) => mallPrice(item) === 0 || mallPrice(item) > 200000);
    // Ignore item lists where the IOTM is just a sub for a cheaper item,
    // except still highlight GAP/navel ring.
    if (big_items.length < items.length && pull.name !== "Runaway IoTM") continue;
    if (pull.optional !== optional) continue;
    result.push({ thing: big_items, why: pull.description ?? "Pull" });
  }
  return result;
}

function checkThing(thing: Thing): [boolean, string] {
  if (thing instanceof Hardcoded) return [thing.have, thing.name];
  if (thing instanceof Familiar) return [have(thing), thing.hatchling.name];
  if (thing instanceof Skill) return [permedSkills().has(thing), thing.name];
  if (thing instanceof Monster)
    return [new Set(CombatLoversLocket.unlockedLocketMonsters()).has(thing), thing.name];
  return [have(thing) || storageAmount(thing) > 0, thing.name];
}

function check(req: Requirement): [boolean, string, Requirement] {
  if (Array.isArray(req.thing)) {
    const checks = req.thing.map(checkThing);

    return [
      checks.find((res) => res[0]) !== undefined,
      checks.map((res) => res[1]).join(" OR "),
      req,
    ];
  } else {
    const res = checkThing(req.thing);
    return [res[0], res[1], req];
  }
}

export function checkRequirements(): void {
  let missing_optional = 0;
  let missing = 0;

  const categories: [string, Requirement[], boolean][] = [
    ["Expensive Pulls (Required)", buildPullList(false), true],
    ["Expensive Pulls (Optional)", buildPullList(true), false],
    ["IoTMs (Required)", buildIotmList().filter((r) => r.required), true],
    ["IoTMs (Optional)", buildIotmList().filter((r) => !r.required), false],
    ["Miscellany", buildMiscList(), false],
    ["Combat Lover's Locket Monsters", buildLocketList(), false],
  ];
  printHtml(
    "Checking your character... Legend: <font color='#888888'>✓ Have</font> / <font color='red'>X Missing & Required</font> / <font color='black'>X Missing & Optional"
  );
  for (const [name, requirements, required] of categories) {
    if (requirements.length === 0) continue;

    const requirements_info: [boolean, string, Requirement][] = requirements.map(check);
    print(name, "blue");
    for (const [have_it, name, req] of requirements_info.sort((a, b) => a[1].localeCompare(b[1]))) {
      const color = have_it ? "#888888" : required ? "red" : "black";
      const symbol = have_it ? "✓" : "X";
      if (!have_it && !required) missing_optional++;
      if (!have_it && required) missing++;
      print(`${symbol} ${name} - ${req.why}`, color);
    }
    print("");
  }

  // Print the count of missing things
  if (missing > 0) {
    print(
      `You are missing ${missing} required things. This script will not yet work for you.`,
      "red"
    );
    if (missing_optional > 0) print(`You are also missing ${missing_optional} optional things.`);
  } else {
    if (missing_optional > 0) {
      print(
        `You are missing ${missing_optional} optional things. This script may work, but it could do better.`
      );
    } else {
      print(`You have everything! You are the shiniest star. This script should work great.`);
    }
  }
}
