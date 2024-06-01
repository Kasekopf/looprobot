# Overview

This is a You Robot softcore script, using the [grimoire](https://github.com/Kasekopf/grimoire) framework. It is a fork of [loopgyou](https://github.com/Kasekopf/loop-casual/tree/gyou).

### Strategy

The script is designed to be run as part of a loop. In particular, it expects that something like [garbo](https://github.com/Loathing-Associates-Scripting-Society/garbage-collector) will use the rest of the turns. This means that profitable daily resources (e.g. copiers) are avoided, but other resources (free runaways, kills, some wanderers) are used to save turns where possible.

### Installation

To install the script, use the following command in the KoLMafia CLI.

```
git checkout https://github.com/Kasekopf/looprobot release
```

### Usage

1. In aftercore, run `looprobot sim` to verify that the script is installed, and to confirm that you meet the requirements (see below for more details). Unlike `loopgyou` and `loopsmol`, the set of requirements to make the script run well is much longer.
2. Ascend into a You Robot Softcore run. **Your class must be Pastamancer under the Vole sign**. Other classes or signs are not recommended yet; Seal Clubbers will also be supported in the near future.
3. Run `looprobot` and watch it go! If you are more hesitant, you can run `looprobot actions 10` to only do 10 things and stop.

Options can be changed in a few different ways:

- In the Mafia relay browser, select `looprobot` from the dropdown in the top right. Be sure to `Save Changes` after modifying a setting.
- By setting a mafia setting, e.g. `set looprobot_pulls=18`.
- By providing an argument at runtime, e.g. `looprobot pulls=18`. Note that any arguments provided at runtime override relay and mafia settings.

Run `looprobot help` for the full set of script commands and options:

```
> looprobot help

This is a script to complete You Robot Softcore runs. Run "looprobot sim" without quotes to check if this script will work for you.

You must ascend manually into a You Robot Softcore run before running the script. Seal Clubber under a Vole sign is recommended for now. Astral mask or astral belt are both useful, but neither is required.

The arguments accepted by the script are listed below. Note that you can combine multiple options; for example "looprobot pulls=18 fax=false" will save 2 pulls and avoid using a faxbot. Most options also have an associated setting to set an option permanently; for example "set looprobot_pulls=18" will cause the script to always save 2 pulls (unless overriden by using the pulls option at runtime).

Commands:
  sim - Check if you have the requirements to run this script.
  version - Show script version and exit.
  help - Show this message and exit.

Major Options:
  pulls NUMBER - Number of pulls to use. Lower this if you would like to save some pulls to use for in-ronin farming. (Note that this argument is not needed if you pull all your farming items before running the script). [default: 20] [setting: looprobot_pulls]

Minor Options:
  fax BOOLEAN - Use a fax to summon a monster. Set to false if the faxbots are offline. [default: true] [setting: looprobot_fax]
  lgr - Pull a lucky gold ring. If pulled, it will be equipped during many combats. [default: false] [setting: looprobot_lgr]
  profitfamiliar - Use free familiar turns for familiar related profits. [default: false] [setting: looprobot_profitFamiliar]
  pvp - Break your hippy stone at the start of the run. [default: false] [setting: looprobot_pvp]
  wand - Always get the zap wand. [default: false] [setting: looprobot_wand]
  forcelocket - Always equip the combat lover's locket, in order to get monsters inside quickly. [default: false] [setting: looprobot_forcelocket]
  skipbackups - Don't use any Backup Camera Backups. [default: false] [setting: looprobot_skipbackups]
  savelocket NUMBER - Number of uses of the combat lover's locket to save. [default: 0] [setting: looprobot_savelocket]
  savetuba - Don't use Apriling Band Helmet's Tuba summon. [default: false] [setting: looprobot_savetuba]
  luck NUMBER - Multiply the threshold for stopping execution when "you may just be unlucky". Increasing this can be dangerous and cause the script to waste more adventures; use at your own risk. [default: 1] [setting: looprobot_luck]
  saveparka NUMBER - Number of spikolodon spikes to save (max 5). [default: 0] [setting: looprobot_saveparka]
  voterbooth - Attempt to use the voter booth if we have access. [default: true] [setting: looprobot_voterbooth]
  stillsuit FAMILIAR - Equip the stillsuit to this familiar during the run [default: Gelatinous Cubeling] [setting: stillsuitFamiliar]

Debug Options:
  actions NUMBER - Maximum number of actions to perform, if given. Can be used to execute just a few steps at a time. [setting: looprobot_actions]
  verbose - Print out a list of possible tasks at each step. [default: false] [setting: looprobot_verbose]
  verboseequip - Print out equipment usage before each task to the CLI. [setting: looprobot_verboseequip]
  ignoretasks TEXT - A comma-separated list of task names that should not be done. Can be used as a workaround for script bugs where a task is crashing. [setting: looprobot_ignoretasks]
  completedtasks TEXT - A comma-separated list of task names the should be treated as completed. Can be used as a workaround for script bugs. [setting: looprobot_completedtasks]
  list - Show the status of all tasks and exit.
  settings - Show the parsed value for all arguments and exit.
  ignorekeys - Ignore the check that all keys can be obtained. Typically for hardcore, if you plan to get your own keys [default: false] [setting: looprobot_ignorekeys]
  halt NUMBER - Halt when you have this number of adventures remaining or fewer [default: 0] [setting: looprobot_halt]
  war NUMBER - Halt when your turncount is above this number and you haven't started the war [default: 150] [setting: looprobot_war]
```

### Will this script work for me?

Run `looprobot sim` to see "Is the script intended to work unmodified on my character?". A sample output is below, but it may be slightly out of date.

```
> looprobot sim

Checking your character... Legend: ✓ Have / X Missing & Required / X Missing & Optional
Expensive Pulls (Required)
✓ defective Game Grid token - Pull
✓ Space Trip safety headphones - Pull

Expensive Pulls (Optional)
✓ Buddy Bjorn - Pull
✓ carnivorous potted plant - Pull
✓ deck of lewd playing cards - Pull
✓ Greatest American Pants OR navel ring of navel gazing - Runaway IoTM
✓ lucky gold ring - Farming currency; see the argument "lgr"
✓ Shore Inc. Ship Trip Scrip - Pull

IoTMs (Required)
✓ closed-circuit pay phone - Shadow bricks, +meat, Leveling with Goose
✓ combat lover's locket - Reminiscing
✓ Distant Woods Getaway Brochure - +exp
✓ Emotionally Chipped - Banish, -combat, items
✓ genie bottle - Leveling with Goose
✓ grey gosling - Duplication drones
✓ June cleaver - Tavern, +adv
✓ Jurassic Parka - Meat, ML, -combat forces
✓ Lovebugs - Crypt, Desert
✓ LOV Tunnel - +exp, leveling
✓ Neverending Party - Leveling with Goose
✓ Snojo - Leveling with Goose
✓ unwrapped knock-off retro superhero cape - Slay the dead in crypt

IoTMs (Optional)
✓ 2002 Mr. Store Catalog - +item, +init, wanderers
✓ Apriling band helmet - -combat forces
✓ august scepter - Protestors, Nuns
✓ autumn-aton - Lobsterfrogman
✓ baby camelCalf - Desert progress
✓ backup camera - ML, init
✓ Bastille Battalion control rig - +exp
✓ Boxing Daycare - +exp
✓ candy cane sword cane - NS key, protestors, black forest, war start, bowling, shore
✓ Cargo Cultist Shorts - Mountain man
✓ Chateau Mantegna - Free rests, +exp
✓ Cincho de Mayo - -combat forces
✓ Clan VIP Lounge key - YRs, +combat
✓ Cosmic bowling ball - Banishes
✓ cursed magnifying glass - Wanderers
✓ cursed monkey's paw - Banishes
✓ Dark Jill-of-All-Trades - +meat, +item
✓ Daylight Shavings Helmet - +meat, +item
✓ Deck of Every Card - A key for the NS tower, stone wool, ore
✓ designer sweatpants - Sleaze damage, +init
✓ Everfull Dart Holster - Free kills
✓ familiar scrapbook - +exp
✓ Fourth of May Cosplay Saber - Familiar Weight
✓ God Lobster Egg - Leveling
✓ industrial fire extinguisher - Harem outfit, Bat hole, stone wool, Crypt, Ultrahydrated, Shadow bricks
✓ January's Garbage Tote - +item, +meat
✓ Kramco Sausage-o-Matic™ - Wanderers
✓ Kremlin's Greatest Briefcase - Banishes
✓ latte lovers member's mug - Banishes
✓ li'l orphan tot - +item
✓ Lil' Doctor™ bag - Banish, instakill, +item
✓ Mayam Calendar - Free rests, fam exp
✓ miniature crystal ball - Monster prediction
✓ Moping Artistic Goth Kid - Wanderers
✓ potted power plant - +Adv
✓ Powerful Glove - Pixels
✓ protonic accelerator pack - Wanderers
✓ S.I.T. Course Completion Certificate - Profit, +meat
✓ shortest-order cook - Kill the Wall of Skin, initial exp
✓ sinistral homunculus - Carn plant
✓ sleeping patriotic eagle - Niche, Palindome, Twin Paak
✓ SongBoom™ BoomBox - Meat and special seasonings
✓ spring shoes - Runaways, Leveling
✓ Summon Clip Art - Amulet coin
✓ Unagnimated Gnome - Adv gain
✓ unbreakable umbrella - -combat modifier, ML
✓ Voting Booth - Wanderers

Miscellany
✓ dried gelatinous cube - Daily dungeon
✓ hobo monkey - Meat drops
✓ Permanent pool skill from A Shark's Chum - Haunted billiards room
✓ woim - Bonus initiative

Combat Lover's Locket Monsters
✓ Astronomer - Star Key
✓ Baa'baa'bu'ran - Wool
✓ Camel's Toe - Star Key
✓ mountain man - Ore
✓ War Frat 151st Infantryman - Outfit

You have everything! You are the shiniest star. This script should work great.
```

### Manual Installation

If you would like to make your own modifications to the script, the recommended way is to compile and install the script manually.

1. Compile the script, following instructions in the [kol-ts-starter](https://github.com/docrostov/kol-ts-starter).
2. Copy `looprobot.js` and `looprobot_choice.ash` from KoLmafia/scripts/looprobot to your Mafia scripts directory.
