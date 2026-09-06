#!/usr/bin/env node
/**
 * Static Pages build (Cloudflare Pages + EdgeOne).
 * Prerenders the SPA, then copies .output/public → dist/.
 */
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
  const publicDir = ".output/public";
  const index = join(publicDir, "index.html");
  if (!existsSync(index)) {
    process.exit(code || 1);
  }
  if (existsSync("edgeone.json")) {
    copyFileSync("edgeone.json", join(publicDir, "edgeone.json"));
  }
  if (existsSync("public/_redirects")) {
    copyFileSync("public/_redirects", join(publicDir, "_redirects"));
  } else {
    writeFileSync(join(publicDir, "_redirects"), "/*    /index.html   200\n");
  }
  if (existsSync("public/_headers")) {
    copyFileSync("public/_headers", join(publicDir, "_headers"));
  }
  if (existsSync("dist")) rmSync("dist", { recursive: true, force: true });
  mkdirSync("dist", { recursive: true });
  cpSync(publicDir, "dist", { recursive: true });
  console.log("[pages] static site ready at dist/");
  process.exit(0);
});
