#!/usr/bin/env node
/**
 * `npm run build` dispatcher.
 *
 * Grok / Vercel: TanStack Start + Nitro vercel preset.
 * EdgeOne Git CI: static SPA into .output/public and dist/.
 *
 * EdgeOne's Git builder has been observed running `npm run build` and then
 * requiring `dist/`, even when edgeone.json asks for build:edgeone.
 */
import { spawnSync } from "node:child_process";

function isEdgeOneGitCi() {
  if (process.env.EDGEONE === "1") return true;
  const cwd = process.cwd().replace(/\\/g, "/");
  return cwd.includes("/dev/shm/repo/") || cwd.includes("/code/repo/");
}

const edgeone = isEdgeOneGitCi();
console.log(`[ci-build] ${edgeone ? "EdgeOne static" : "Vercel"} · cwd=${process.cwd()}`);

const result = edgeone
  ? spawnSync(process.execPath, ["scripts/build-edgeone.mjs"], {
      stdio: "inherit",
      env: { ...process.env, EDGEONE: "1" },
    })
  : spawnSync(
      process.execPath,
      ["scripts/with-app-env.mjs", "vite", "build"],
      { stdio: "inherit", env: process.env },
    );

if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);

if (!edgeone) {
  const migrate = spawnSync("npm", ["run", "db:migrate"], { stdio: "inherit", env: process.env });
  process.exit(migrate.status ?? 1);
}

process.exit(0);
