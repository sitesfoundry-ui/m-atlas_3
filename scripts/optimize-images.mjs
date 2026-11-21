import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const srcDir = path.resolve("assets-src/images");
const outDir = path.resolve("public/media/images");
const WIDTHS = [320, 1600, 2400];

if (!fs.existsSync(srcDir)) {
  console.log("assets-src/images/ does not exist; nothing to optimize.");
  process.exit(0);
}

const files = fs.readdirSync(srcDir).filter((f) => /\.(png|jpe?g)$/i.test(f));
if (files.length === 0) {
  console.log("assets-src/images/ is empty; nothing to optimize.");
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const id = path.basename(file, path.extname(file));
  const inputPath = path.join(srcDir, file);
  const pngOut = path.join(outDir, `${id}.png`);
  fs.copyFileSync(inputPath, pngOut);

  for (const width of WIDTHS) {
    const webpOut = path.join(outDir, `${id}-${width}.webp`);
    await sharp(inputPath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 92, alphaQuality: 100, effort: 6 })
      .toFile(webpOut);
  }
  console.log(`Optimized ${id} variants (320, 1600, 2400) + original PNG`);
}
