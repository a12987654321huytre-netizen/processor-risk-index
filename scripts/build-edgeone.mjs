#!/usr/bin/env node
/**
 * Static Pages build (Cloudflare Pages + Workers + EdgeOne).
 * Prerenders the SPA, then copies .output/public → dist/.
 *
 * Cloudflare Workers (`npx wrangler deploy`) cannot ship the Pages-style
 * `/* /index.html 200` rewrite — it loops against HTML pretty-URLs.
 * SPA fallback there is wrangler.toml `not_found_handling`.
 */
import { spawn, spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

process.env.EDGEONE = "1";
process.env.npm_config_engine_strict = "false";

const isWorkersCi = process.env.WORKERS_CI === "1";

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
  if (existsSync("edgeone.json") && !isWorkersCi) {
    copyFileSync("edgeone.json", join(publicDir, "edgeone.json"));
  }
  const redirectsDest = join(publicDir, "_redirects");
  if (isWorkersCi) {
    if (existsSync(redirectsDest)) unlinkSync(redirectsDest);
  } else if (existsSync("public/_redirects")) {
    copyFileSync("public/_redirects", redirectsDest);
  } else {
    writeFileSync(redirectsDest, "/*    /index.html   200\n");
  }
  if (existsSync("public/_headers")) {
    copyFileSync("public/_headers", join(publicDir, "_headers"));
  }
  if (existsSync("dist")) rmSync("dist", { recursive: true, force: true });
  mkdirSync("dist", { recursive: true });
  cpSync(publicDir, "dist", { recursive: true });
  const distRedirects = join("dist", "_redirects");
  if (isWorkersCi && existsSync(distRedirects)) unlinkSync(distRedirects);
  console.log(
    `[pages] static site ready at dist/${isWorkersCi ? " (Workers: no _redirects)" : ""}`,
  );
  process.exit(0);
});
