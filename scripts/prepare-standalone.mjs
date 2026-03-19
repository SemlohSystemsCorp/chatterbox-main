// Cross-platform build script for Tauri standalone mode.
// Works on macOS, Linux, and Windows without bash.

import { execSync } from "child_process";
import { existsSync, mkdirSync, cpSync } from "fs";

console.log("Building Next.js in standalone mode...");
execSync("npx next build", {
  stdio: "inherit",
  env: { ...process.env, TAURI_BUILD: "1" },
});

console.log("Copying static assets into standalone directory...");

if (existsSync(".next/static")) {
  mkdirSync(".next/standalone/.next/static", { recursive: true });
  cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
}

if (existsSync("public")) {
  mkdirSync(".next/standalone/public", { recursive: true });
  cpSync("public", ".next/standalone/public", { recursive: true });
}

console.log("Standalone build ready.");
