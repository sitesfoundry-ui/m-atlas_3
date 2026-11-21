import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const srcDir = path.resolve("assets-src/footer");
const outDir = path.resolve("public/media/footer");
const srcVideo = path.join(srcDir, "scene.mp4");
const srcPoster = path.join(srcDir, "poster.jpg");

if (!fs.existsSync(srcVideo) && !fs.existsSync(srcPoster)) {
  console.log("assets-src/footer/ has no scene.mp4 or poster.jpg; nothing to optimize.");
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });

if (fs.existsSync(srcVideo)) {
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      srcVideo,
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-an",
      "-movflags",
      "+faststart",
      path.join(outDir, "scene.mp4"),
    ],
    { stdio: "inherit" }
  );

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      srcVideo,
      "-c:v",
      "libvpx-vp9",
      "-crf",
      "28",
      "-b:v",
      "0",
      "-row-mt",
      "1",
      "-an",
      path.join(outDir, "scene.webm"),
    ],
    { stdio: "inherit" }
  );
}

if (fs.existsSync(srcPoster)) {
  await sharp(srcPoster)
    .webp({ quality: 92 })
    .toFile(path.join(outDir, "poster.webp"));
}

console.log("Footer media written to public/media/footer/");
