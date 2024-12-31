import { Args } from "grimoire-kolmafia";
import { $familiar } from "libram";

export const args = Args.create(
  "looprobot",
  'This is a script to complete You Robot Softcore runs. Run "looprobot sim" without quotes to check if this script will work for you.\n\nYou must ascend manually into a You Robot Softcore run before running the script. Seal Clubber under a Vole sign is recommended for now. Astral mask or astral belt are both useful, but neither is required.\n\nThe arguments accepted by the script are listed below. Note that you can combine multiple options; for example "looprobot pulls=18 fax=false" will save 2 pulls and avoid using a faxbot. Most options also have an associated setting to set an option permanently; for example "set looprobot_pulls=18" will cause the script to always save 2 pulls (unless overriden by using the pulls option at runtime).',
  {
    sim: Args.flag({ help: "Check if you have the requirements to run this script.", setting: "" }),
    version: Args.flag({ help: "Show script version and exit.", setting: "" }),
    major: Args.group("Major Options", {
      pulls: Args.number({
        help: "Number of pulls to use. Lower this if you would like to save some pulls to use for in-ronin farming. (Note that this argument is not needed if you pull all your farming items before running the script).",
        default: 20,
      }),
    }),
    minor: Args.group("Minor Options", {
      fax: Args.boolean({
        help: "Use a fax to summon a monster. Set to false if the faxbots are offline.",
        default: true,
      }),
      lgr: Args.flag({
        help: "Pull a lucky gold ring. If pulled, it will be equipped during many combats.",
        default: false,
      }),
      profitfamiliar: Args.flag({
        help: "Use free familiar turns for familiar related profits.",
        default: false,
      }),
      pvp: Args.flag({
        help: "Break your hippy stone at the start of the run.",
        default: false,
      }),
      wand: Args.flag({
        help: "Always get the zap wand.",
        default: false,
      }),
      forcelocket: Args.flag({
        help: "Always equip the combat lover's locket, in order to get monsters inside quickly.",
        default: false,
      }),
      skipbackups: Args.flag({
        help: "Don't use any Backup Camera Backups.",
        default: false,
      }),
      savelocket: Args.number({
        help: "Number of uses of the combat lover's locket to save.",
        default: 0,
      }),
      saveapril: Args.number({
        help: "Number of Apriling Band instruments to save.",
        default: 0,
      }),
      luck: Args.number({
        help: 'Multiply the threshold for stopping execution when "you may just be unlucky". Increasing this can be dangerous and cause the script to waste more adventures; use at your own risk.',
        default: 1,
      }),
      saveparka: Args.number({
        help: "Number of spikolodon spikes to save (max 5).",
        default: 0,
      }),
      saveember: Args.flag({
        help: "Should we save the Sept-Ember Censor for aftercore?",
        default: false,
      }),
      voterbooth: Args.flag({
        help: "Attempt to use the voter booth if we have access.",
        default: true,
      }),
      stillsuit: Args.familiar({
        help: "Equip the stillsuit to this familiar during the run",
        setting: "stillsuitFamiliar",
        default: $familiar`Gelatinous Cubeling`,
      }),
      flyer: Args.flag({
        help: "Always flyer the normal way, instead of wishing for a monster",
        default: false,
      }),
      chronolith: Args.flag({
        help: "Skip spending turns to get net positive turns from chronolith at the end of the run (turn on to minimize turncount at the expense of aftercore turns)",
        default: false,
      }),
      nuns: Args.flag({
        help: "Do the nuns in the war; uses monkey paw wishes",
        default: true,
      }),
      hippy: Args.flag({
        help: "Fight the war on behalf of the hippies, for factoids",
        default: false,
      }),
    }),
    debug: Args.group("Debug Options", {
      actions: Args.number({
        help: "Maximum number of actions to perform, if given. Can be used to execute just a few steps at a time.",
      }),
      verbose: Args.flag({
        help: "Print out a list of possible tasks at each step.",
        default: false,
      }),
      verboseequip: Args.flag({
        help: "Print out equipment usage before each task to the CLI.",
      }),
      ignoretasks: Args.string({
        help: "A comma-separated list of task names that should not be done. Can be used as a workaround for script bugs where a task is crashing.",
      }),
      completedtasks: Args.string({
        help: "A comma-separated list of task names the should be treated as completed. Can be used as a workaround for script bugs.",
      }),
      list: Args.flag({
        help: "Show the status of all tasks and exit.",
        setting: "",
      }),
      settings: Args.flag({
        help: "Show the parsed value for all arguments and exit.",
        setting: "",
      }),
      ignorekeys: Args.flag({
        help: "Ignore the check that all keys can be obtained. Typically for hardcore, if you plan to get your own keys",
        default: false,
      }),
      halt: Args.number({
        help: "Halt when you have this number of adventures remaining or fewer",
        default: 0,
      }),
      warby: Args.number({
        help: "Halt when your turncount is above this number and you haven't started the war",
        default: 150,
      }),
    }),
  },
  {
    defaultGroupName: "Commands",
  }
);

const scriptName = Args.getMetadata(args).scriptName;
export function toTempPref(name: string) {
  return `_${scriptName}_${name}`;
}
