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

  // Start quests when able
  "Knob/Start",
  "McLargeHuge/Trapper Request",

  // Level up with goose
  "Leveling/LOV Tunnel",
  "Leveling/All",

  // Use YRs
  "Summon/Mountain Man",

  // Use Video Games buff to clear pool
  "Manor/Billiards",

  // Some generic combat tasks for exp buffs
  "Manor/Library",
  "Manor/Bedroom",
  // "Digital/Vanya",
  // "Digital/Megalo",

  // Prepare snakes with continued -combat
  "Giant/Basement Finish",
  "McLargeHuge/Trapper Return",
  "Bat/Use Sonar 1",

  // Get through ninjas ASAP with +combat
  "Macguffin/Diary",
  "Palindome/Copperhead",
  "Palindome/Bat Snake",
  "Palindome/Cold Snake",
  "McLargeHuge/Ninja",

  // Prepare for first hat phase
  "Giant/Ground",
  "Summon/War Frat 151st Infantryman",
  "Misc/Unlock Island Submarine",
  "Misc/Unlock Island",

  // First hat phase
  "Robot/Equip Hat Phase 1",
  "War/Enrage",
  "War/Flyers Start",
  "Palindome/Hot Snake Precastle",
  "Giant/Top Floor",
  "Robot/Unequip Hat Phase 1",

  // First -combat group
  "Mosquito/Burn Delay",
  "Friar/Finish",
  "Hidden City/Forest Coin", // First to get meat
  "Hidden City/Forest Map",
  "Hidden City/Forest Fertilizer",
  "Hidden City/Forest Sapling", // Last to sell bar skins

  // Do summons when ready
  "Summon/Astrologer Of Shub-Jigguwatt",
  "Summon/Astronomer",
  "Summon/Camel's Toe",
  "Summon/Baa'baa'bu'ran",

  // Start Hidden city
  "Hidden City/Open Temple",
  "Hidden City/Open City",
  "Hidden City/Open Bowling",
  "Hidden City/Open Office",
  "Hidden City/Open Hospital",
  "Hidden City/Open Apartment",

  // Setup additional -combats
  "Manor/Bedroom",
  "Palindome/Bat Snake",
  "McLargeHuge/Climb",

  // Get and use clovers
  "Misc/Hermit Clover",
  "McLargeHuge/Trapper Return",
  "Palindome/Protesters",

  // Second -combat group
  "Hidden City/Banish Janitors",
  "Mosquito/Finish",
  "Crypt/Cranny",

  "Macguffin/Compass", // Unlock desert for ultrahydrated use
  // The following 3 tasks should always stay in this order
  "Macguffin/Oasis", // Get ultrahydrated as soon as needed
  "Macguffin/Oasis Drum", // Get drum as soon as pages are gathered
  "Macguffin/Desert", // charge camel for protestors

  // Hidden City
  "Hidden City/Office Files", // Banish janitors under delay
  "Hidden City/Apartment",
  "Hidden City/Hospital",
  "Hidden City/Bowling",

  "Manor/Boss",
  "McLargeHuge/Finish", // Get Eagle beast banish
  "Giant/Finish",
  "Palindome/Talisman",
  "Palindome/Palindome Dudes", // Use Eagle beast banish
  "Crypt/Niche",
  "Tavern/Finish",

  // Setup for +meat/+item set
  "Digital/Vanya",
  "Digital/Megalo",
  "Macguffin/Upper Chamber",
  "Orc Chasm/Start Peaks",
  "Orc Chasm/ABoo Carto",
  "Knob/Open Knob",
  "Hidden City/Office Boss", // Get Eagle dude banish

  // Bulk +meat/+item tasks
  "Misc/Shadow Lodestone",
  "Crypt/Nook",
  "Crypt/Alcove",
  "Bat/Get Sonar 3",
  "Orc Chasm/ABoo Clues",
  "Digital/Hero",
  "Orc Chasm/Oil Jar",
  "Macguffin/Middle Chamber", // Avoid Eagle beast banish!
  "Digital/Key",
  "Orc Chasm/Twin Init Search",
  "Orc Chasm/Twin Init", // Use Eagle dude banish
  "Knob/Harem",

  "Keys/Star Key", // Allow for better use of orb
  "Macguffin/Finish",
  "Orc Chasm/Finish",
  "Crypt/Finish",

  // Setup for second hat phase
  "Robot/Equip Hat Phase 2",
  "War/Junkyard End",
  "War/Boss Hippie",
  "Knob/King",
  "Robot/Unequip Hat Phase 2",
  "Giant/Unlock HITS", // TODO: find better spot

  // Finish up with last delay
  "Misc/Eldritch Tentacle",
  "Bat/Finish",

  // Finish last keys
  "Keys/All Heroes",

  "Tower/Naughty Sorceress",
];

export function prioritize(tasks: Task[]): Task[] {
  return orderByRoute(tasks, routing, false);
}
