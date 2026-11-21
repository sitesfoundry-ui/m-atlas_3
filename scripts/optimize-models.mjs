import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const srcDir = path.resolve("assets-src/models");
const outDir = path.resolve("public/models");

if (!fs.existsSync(srcDir)) {
  console.log("assets-src/models/ does not exist; nothing to optimize.");
  process.exit(0);
}

const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".glb"));
if (files.length === 0) {
  console.log("assets-src/models/ is empty; nothing to optimize.");
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const id = path.basename(file, ".glb");
  const inputPath = path.join(srcDir, file);
  const desktopOut = path.join(outDir, `${id}.glb`);
  const mobileOut = path.join(outDir, `${id}-m.glb`);

  const beforeMb = (fs.statSync(inputPath).size / (1024 * 1024)).toFixed(2);

  execFileSync(
    "npx",
    [
      "@gltf-transform/cli",
      "optimize",
      inputPath,
      desktopOut,
      "--simplify",
      "false",
      "--compress",
      "meshopt",
      "--texture-compress",
      "webp",
      "--texture-size",
      "4096",
    ],
    { stdio: "inherit" }
  );

  execFileSync(
    "npx",
    [
      "@gltf-transform/cli",
      "optimize",
      inputPath,
      mobileOut,
      "--simplify",
      "false",
      "--compress",
      "meshopt",
      "--texture-compress",
      "webp",
      "--texture-size",
      "2048",
    ],
    { stdio: "inherit" }
  );

  const deskMb = (fs.statSync(desktopOut).size / (1024 * 1024)).toFixed(2);
  const mobMb = (fs.statSync(mobileOut).size / (1024 * 1024)).toFixed(2);
  console.log(`${id}: ${beforeMb} MB -> desktop ${deskMb} MB, mobile ${mobMb} MB`);
}
