/* eslint-env node */
import esbuild, { Plugin } from "esbuild";
import babel from "esbuild-plugin-babel";

const watch = process.argv.some((arg) => ["--watch", "-w"].includes(arg));

const context = await esbuild.context({
  bundle: true,
  platform: "node",
  target: "rhino1.7.14",
  external: ["kolmafia"],
  define: {
    "process.env.GITHUB_SHA": `"${process.env?.["GITHUB_SHA"] ?? "CustomBuild"}"`,
    "process.env.GITHUB_REF_NAME": `"${process.env?.["GITHUB_REF_NAME"] ?? "CustomBuild"}"`,
    "process.env.GITHUB_REPOSITORY": `"${process.env?.["GITHUB_REPOSITORY"] ?? "CustomBuild"}"`,
  },
  entryPoints: {
    "KoLmafia/scripts/looprobot/looprobot": "src/main.ts",
    "KoLmafia/scripts/looprobot/looprobot_choice": "src/standalone/looprobot_choice.ts",
    "KoLmafia/relay/relay_looprobot": "src/relay.ts",
  },
  entryNames: "[dir]/[name]",
  outdir: "dist",
  plugins: [babel() as Plugin],
});

await context.rebuild();

if (watch) {
  await context.watch();
} else {
  context.dispose();
}
