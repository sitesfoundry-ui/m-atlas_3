import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { specimens } from "../src/content/specimens.js";

function parseGlbJson(buffer) {
  if (buffer.length < 20) throw new Error("Invalid GLB header");
  const magic = buffer.toString("ascii", 0, 4);
  if (magic !== "glTF") throw new Error("Not a GLB file");
  const chunkLen = buffer.readUInt32LE(12);
  const chunkType = buffer.toString("ascii", 16, 20);
  if (chunkType !== "JSON") throw new Error("Missing JSON chunk");
  return JSON.parse(buffer.toString("utf8", 20, 20 + chunkLen));
}

function summarizeGlb(gltf) {
  let vertices = 0;
  let triangles = 0;
  const accessors = gltf.accessors || [];
  for (const mesh of gltf.meshes || []) {
    for (const prim of mesh.primitives || []) {
      const posIdx = prim.attributes?.POSITION;
      if (typeof posIdx === "number" && accessors[posIdx]) {
        vertices += accessors[posIdx].count || 0;
      }
      if (typeof prim.indices === "number" && accessors[prim.indices]) {
        triangles += Math.floor((accessors[prim.indices].count || 0) / 3);
      } else if (typeof posIdx === "number" && accessors[posIdx]) {
        triangles += Math.floor((accessors[posIdx].count || 0) / 3);
      }
    }
  }
  const textures = (gltf.textures || []).length;
  const extensions = gltf.extensionsUsed || [];
  return { vertices, triangles, textures, extensions };
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const writeDocs = process.argv.includes("--write");
  const rows = [];

  for (const spec of specimens) {
    const imgBuf = await fetchBuffer(spec.image);
    const meta = await sharp(imgBuf).metadata();
    const imgMb = (imgBuf.length / (1024 * 1024)).toFixed(2);
    rows.push(
      `| \`${spec.id}\` image | PNG/WebP | ${meta.width} × ${meta.height} | ${imgMb} MB | Cut-out illustration |`
    );

    const glbBuf = await fetchBuffer(spec.model);
    const gltf = parseGlbJson(glbBuf);
    const info = summarizeGlb(gltf);
    const glbMb = (glbBuf.length / (1024 * 1024)).toFixed(2);
    rows.push(
      `| \`${spec.id}\` model | GLB | ${info.vertices.toLocaleString()} verts / ${info.triangles.toLocaleString()} tris | ${glbMb} MB | ${info.textures} textures; ${info.extensions.join(", ") || "none"} |`
    );
  }

  const table = [
    "| Asset | Type | Source dimensions / specs | File size | Notes |",
    "|---|---|---|---|---|",
    ...rows,
  ].join("\n");

  console.log(table);

  if (writeDocs) {
    const docPath = path.resolve("docs/ASSETS.md");
    const existing = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";
    const updated = existing.replace(/\| Asset \|[\s\S]*?(?=\n\n## )/, table);
    fs.writeFileSync(docPath, updated, "utf8");
    console.log("Updated docs/ASSETS.md");
  }
}

main().catch((err) => {
  console.error("media:probe failed:", err.message);
  process.exit(1);
});
