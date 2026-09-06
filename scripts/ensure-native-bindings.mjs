#!/usr/bin/env node
/**
 * EdgeOne's preinstalled Node is 22.11.0. Rolldown 1.2 / Vite 8 mark their
 * native bindings as optional with engines `^20.19.0 || >=22.12.0`, so npm
 * silently skips `@rolldown/binding-linux-x64-gnu`. This script installs the
 * matching binary before `vite build` if it is missing.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const VERSION = "1.2.7";
const GNU = "@rolldown/binding-linux-x64-gnu";
const MUSL = "@rolldown/binding-linux-x64-musl";

function present(pkg) {
  try {
    require.resolve(pkg);
    return true;
  } catch {
    return false;
  }
}

function hasBinding() {
  return present(GNU) || present(MUSL);
}

function isMusl() {
  if (existsSync("/etc/alpine-release")) return true;
  try {
    return readFileSync("/usr/bin/ldd", "utf8").includes("musl");
  } catch {
    return false;
  }
}

function install(pkg) {
  console.log(`[edgeone] installing ${pkg}@${VERSION} (Rolldown native binding)`);
  const env = { ...process.env, npm_config_engine_strict: "false" };
  const result = spawnSync(
    "npm",
    ["install", `${pkg}@${VERSION}`, "--no-save", "--no-engine-strict", "--include=optional"],
    { stdio: "inherit", env },
  );
  return (result.status ?? 1) === 0;
}

if (hasBinding()) {
  console.log("[edgeone] Rolldown native binding present");
  process.exit(0);
}

const preferred = isMusl() ? MUSL : GNU;
const fallback = preferred === GNU ? MUSL : GNU;
install(preferred);
if (!hasBinding()) install(fallback);

if (hasBinding()) {
  console.log("[edgeone] Rolldown native binding installed");
  process.exit(0);
}

console.error("[edgeone] Rolldown native binding still missing after install");
process.exit(1);
