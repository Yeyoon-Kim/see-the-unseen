import { cp, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const frontendDist = resolve(rootDir, "frontend", "dist");
const rootDist = resolve(rootDir, "dist");

await rm(rootDist, { recursive: true, force: true });
await cp(frontendDist, rootDist, { recursive: true });

console.log("Vercel output synced to ./dist");
