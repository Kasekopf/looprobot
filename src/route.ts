import { orderByRoute } from "grimoire-kolmafia";
import { Task } from "./engine/task";

export const ROUTE_WAIT_TO_NCFORCE = 30;

export const routing: string[] = [
  // Break pvp stone ASAP
  "Misc/Break Stone",
  "Pull/All",

  // Start with the basic leveling tasks
  "Toot/Finish",

  // Get basic gear
  "Misc/Acquire Birch Battery",
  "Keys/Deck",

  // Get initial energy
  "Robot/CPU Potions",
  "Robot/Absorb AAA Battery",
  "Robot/Absorb Robo Battery",
  "Robot/CPU Energy",
  "Robot/First Chronolith",
  "Robot/Chronolith",

  // Equip initial limbs
  "Robot/Equip Top Initial",
  "Robot/Equip Right Initial",
  "Robot/Equip Left Initial",
  "Robot/Equip Bottom Initial",

  // Start quests when able
  "Knob/Start",
  "McLargeHuge/Trapper Request",

  // Level up with goose
  "Leveling/Acquire Mouthwash",
  "Leveling/Mouthwash",
  "Leveling/LOV Tunnel",
  "Summon/Mountain Man",
  "Leveling/Snojo",
  "Leveling/Shadow Rift", // before 5th bowling ball
  "Leveling/Neverending Party",
  "Leveling/Speakeasy",
  "Leveling/God Lobster", // when ready
  "Leveling/All",

  // Use Video Games buff to clear pool
  "Manor/Billiards",

  // Some generic combat tasks for exp buffs
  "Manor/Library",
  "Manor/Bedroom",
  "Digital/Vanya",
  // "Digital/Megalo",

  "McLargeHuge/Trapper Return",
  "Bat/Use Sonar 1",
  "Robot/Statbot L11",

  // Get through ninjas ASAP with +combat
  "Macguffin/Diary",
  "Palindome/Copperhead",
  "Palindome/Bat Snake",
  "Palindome/Cold Snake",
  "Summon/Ninja Snowman Assassin",
  "McLargeHuge/Ninja",
  "McLargeHuge/Climb",

  // Prepare for first hat phase
  "Giant/Basement Finish",
  "McLargeHuge/Peak", // Get Eagle beast banish
  "Giant/Ground",
  "Summon/War Frat 151st Infantryman",
  "Misc/Unlock Island Submarine",
  "Misc/Unlock Island",
  "Robot/Statbot L12",

  // First hat phase
  "Robot/Equip Hat Phase 1",
  "War/Enrage",
  "War/Phase 1",
  "Palindome/Hot Snake Precastle",
  "Giant/Top Floor",
  "Robot/Unequip Hat Phase 1",
  "Giant/Unlock HITS",

  // Do summons when ready
  "Summon/Camel's Toe",
  "Summon/Baa'baa'bu'ran",
  "War/Flyers Fast",

  // Get and use clovers
  "Misc/Hermit Clover",
  "Palindome/Protesters",

  "Giant/Finish",
  "Palindome/Talisman",
  "Palindome/Palindome Dudes", // Use Eagle beast banish
  "Palindome/Open Alarm", // Get boss ready for goose

  "Macguffin/Compass", // Unlock desert for ultrahydrated use
  // The following 3 tasks should always stay in this order
  "Macguffin/Oasis", // Get ultrahydrated as soon as needed
  "Macguffin/Oasis Drum", // Get drum as soon as pages are gathered
  "Macguffin/Desert",

  // First -combat group
  "Mosquito/Burn Delay",
  "Hidden City/Forest Coin", // First to get meat
  "Hidden City/Forest Map",
  "Hidden City/Forest Fertilizer",
  "Hidden City/Forest Sapling", // Last to sell bar skins
  "Crypt/Cranny",

  "Manor/Blow Wall", // Get boss ready for goose

  // Start Hidden city
  "Hidden City/Open Temple",
  "Hidden City/Open City",
  "Hidden City/Banish Janitors",
  "Hidden City/Open Bowling",
  "Hidden City/Open Office",
  "Hidden City/Open Hospital",
  "Hidden City/Open Apartment",

  // Hidden City
  "Hidden City/Office Files", // Banish janitors under delay
  "Hidden City/Apartment",
  "Hidden City/Hospital",
  "Hidden City/Bowling",

  // Setup for +meat/+item set
  "Manor/Boss",
  "Crypt/Alcove",
  "Crypt/Niche",
  "Palindome/Boss",
  "Mosquito/Finish",
  "Tavern/Finish",
  "Digital/Megalo",
  "Orc Chasm/Start Peaks",
  "Orc Chasm/ABoo Carto",
  "Hidden City/Office Boss", // Get Eagle dude banish
  "Hidden City/Boss",
  "Macguffin/Upper Chamber",
  "Knob/Open Knob",

  // Bulk +meat/+item tasks
  "Misc/Shadow Lodestone",
  "Orc Chasm/Oil Jar",
  "Digital/Hero",
  "Misc/Temple High",
  "Orc Chasm/ABoo Clues",
  "Bat/Get Sonar 3",
  "Macguffin/Middle Chamber", // Avoid Eagle beast banish!
  "Digital/Key",
  "Crypt/Nook",
  "Orc Chasm/Twin Init Search",
  "Orc Chasm/Twin Init", // Use Eagle dude banish
  "War/Open Orchard",
  "War/Orchard Finish",
  "Knob/Harem",

  "Keys/Star Key", // Allow for better use of orb
  "Crypt/Finish", // Right before hat to launch extra drones

  // Setup for second hat phase
  "Robot/Equip Hat Phase 2",
  "Knob/King",
  "War/Boss",
  "Robot/Unequip Hat Phase 2",

  // Finish off quests
  "Macguffin/Finish",
  "Orc Chasm/Finish",
  "Misc/Eldritch Tentacle",
  "Bat/Finish",

  // Finish last keys
  "Keys/All Heroes",

  // Save NC forcers as long as possible (for more rests)
  "Friar/Finish",

  // Final harder summons
  "Summon/Astrologer Of Shub-Jigguwatt",
  "Summon/Astronomer",

  "Robot/Statbot L13",
  "Tower/Naughty Sorceress",
];

export function prioritize(tasks: Task[]): Task[] {
  return orderByRoute(tasks, routing, false);
}
