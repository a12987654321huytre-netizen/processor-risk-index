#!/usr/bin/env node
/**
 * EdgeOne Pages static build. Nitro's last "nitro environment" pass can fail
 * after a successful prerender; if .output/public/index.html exists, we treat
 * the site as deployable.
 *
 * Also copies that folder to dist/ so a dashboard still pointed at "dist"
 * does not fail the Git build.
 */
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, rmSync } from "node:fs";

process.env.EDGEONE = "1";
process.env.npm_config_engine_strict = "false";

const ensure = spawnSync(process.execPath, ["scripts/ensure-native-bindings.mjs"], {
  stdio: "inherit",
  env: process.env,
});
if ((ensure.status ?? 1) !== 0) process.exit(ensure.status ?? 1);

const child = spawn("node", ["scripts/with-app-env.mjs", "vite", "build"], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  const index = ".output/public/index.html";
  if (!existsSync(index)) {
    process.exit(code || 1);
  }
  if (existsSync("edgeone.json")) {
    copyFileSync("edgeone.json", ".output/public/edgeone.json");
  }
  if (existsSync("dist")) rmSync("dist", { recursive: true, force: true });
  cpSync(".output/public", "dist", { recursive: true });
  console.log("[edgeone] static site ready at .output/public (and dist/)");
  process.exit(0);
});
