#!/usr/bin/env node
/**
 * `npm run build` dispatcher.
 *
 * Grok / Vercel: TanStack Start + Nitro vercel preset.
 * Cloudflare Pages + EdgeOne Git: static SPA into dist/.
 */
import { spawnSync } from "node:child_process";

function isStaticPagesCi() {
  if (process.env.EDGEONE === "1") return true;
  if (process.env.CF_PAGES === "1") return true;
  if (process.env.WORKERS_CI === "1") return true;
  const cwd = process.cwd().replace(/\\/g, "/");
  return cwd.includes("/dev/shm/repo/") || cwd.includes("/code/repo/");
}

const staticPages = isStaticPagesCi();
console.log(`[ci-build] ${staticPages ? "static Pages" : "Vercel"} · cwd=${process.cwd()}`);

const result = staticPages
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

if (!staticPages) {
  const migrate = spawnSync("npm", ["run", "db:migrate"], { stdio: "inherit", env: process.env });
  process.exit(migrate.status ?? 1);
}

process.exit(0);
