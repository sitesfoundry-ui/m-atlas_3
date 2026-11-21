import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { categories } from "../src/content/categories.js";
import { specimens } from "../src/content/specimens.js";
import { volumes } from "../src/content/volumes.js";
import enStrings from "../src/i18n/en.js";
import mnStrings from "../src/i18n/mn.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const spriteSource = fs.readFileSync(
  path.join(rootDir, "src/components/shell/IconSprite.jsx"),
  "utf8"
);
const spriteIds = new Set(
  [...spriteSource.matchAll(/<symbol\s+id="([^"]+)"/g)].map((m) => m[1])
);

const CYRILLIC_RE = /[\u0400-\u04FF]/;
const LATIN_FAMILY_RE = /^[A-Z][a-z]+idae$/;

const specimenMap = new Map(specimens.map((spec) => [spec.id, spec]));

function collectMnStrings(value, keyPath = "", out = []) {
  if (!value || typeof value !== "object") return out;
  if (keyPath === "credit") return out;

  if (
    Object.prototype.hasOwnProperty.call(value, "mn") &&
    typeof value.mn === "string"
  ) {
    out.push({ keyPath, text: value.mn });
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((item, idx) => collectMnStrings(item, `${keyPath}[${idx}]`, out));
    return out;
  }

  for (const [k, v] of Object.entries(value)) {
    const nextPath = keyPath ? `${keyPath}.${k}` : k;
    collectMnStrings(v, nextPath, out);
  }
  return out;
}

test("all category specimen references resolve to valid specimens", () => {
  for (const [volumeId, list] of Object.entries(categories)) {
    for (const cat of list) {
      assert.ok(
        specimenMap.has(cat.specimen),
        `Category ${volumeId}/${cat.slug} references missing specimen "${cat.specimen}"`
      );
      assert.equal(
        specimenMap.get(cat.specimen).volume,
        volumeId,
        `Category ${volumeId}/${cat.slug} specimen "${cat.specimen}" belongs to wrong volume`
      );
    }
  }
});

test("every specimen is listed in its volume", () => {
  for (const spec of specimens) {
    const vol = volumes[spec.volume];
    assert.ok(vol, `Specimen "${spec.id}" references unknown volume "${spec.volume}"`);
    assert.ok(
      vol.specimens.includes(spec.id),
      `Specimen "${spec.id}" is missing from volumes.${spec.volume}.specimens`
    );
  }
});

test("specimen ids and numbers are unique", () => {
  const seenIds = new Set();
  const seenNos = new Set();

  for (const spec of specimens) {
    assert.ok(spec.id && typeof spec.id === "string", "Specimen id must be a non-empty string");
    assert.ok(!seenIds.has(spec.id), `Duplicate specimen id "${spec.id}"`);
    seenIds.add(spec.id);

    assert.ok(spec.no && typeof spec.no === "string", `Specimen "${spec.id}" missing no`);
    assert.ok(!seenNos.has(spec.no), `Duplicate specimen no "${spec.no}"`);
    seenNos.add(spec.no);
  }
});

test("specimen tags, traits, icons, traitLabels, and lens follow schema", () => {
  for (const spec of specimens) {
    assert.equal(
      spec.tags?.length,
      3,
      `Specimen "${spec.id}" must have 3 tags (got ${spec.tags?.length})`
    );
    assert.equal(
      spec.traits?.length,
      4,
      `Specimen "${spec.id}" must have 4 traits (got ${spec.traits?.length})`
    );

    for (const trait of spec.traits) {
      assert.ok(
        spriteIds.has(trait.icon),
        `Specimen "${spec.id}" trait icon "${trait.icon}" not found in IconSprite.jsx`
      );
      assert.ok(
        Object.prototype.hasOwnProperty.call(enStrings.traitLabels, trait.key),
        `Specimen "${spec.id}" trait key "${trait.key}" missing from en.js traitLabels`
      );
      assert.ok(
        Object.prototype.hasOwnProperty.call(mnStrings.traitLabels, trait.key),
        `Specimen "${spec.id}" trait key "${trait.key}" missing from mn.js traitLabels`
      );
    }

    assert.match(
      spec.lens,
      /^\d{1,3}% \d{1,3}%$/,
      `Specimen "${spec.id}" lens "${spec.lens}" does not match "^\\d{1,3}% \\d{1,3}%$"`
    );
  }
});

test("every Mongolian specimen string contains Cyrillic (Latin family names & credit exempt)", () => {
  for (const spec of specimens) {
    const mnEntries = collectMnStrings(spec);
    assert.ok(mnEntries.length > 0, `Specimen "${spec.id}" has no Mongolian strings`);
    for (const { keyPath, text } of mnEntries) {
      if (keyPath === "family" && LATIN_FAMILY_RE.test(text)) continue;
      assert.match(
        text,
        CYRILLIC_RE,
        `Specimen "${spec.id}" mn string at "${keyPath}" lacks Cyrillic: "${text}"`
      );
    }
  }
});

test("every credited specimen carries https:// source and license URLs", () => {
  for (const spec of specimens) {
    if (!spec.credit) continue;
    assert.ok(spec.credit.title, `Specimen "${spec.id}" credit missing title`);
    assert.ok(spec.credit.author, `Specimen "${spec.id}" credit missing author`);
    assert.ok(spec.credit.license, `Specimen "${spec.id}" credit missing license`);
    assert.ok(
      typeof spec.credit.url === "string" && spec.credit.url.startsWith("https://"),
      `Specimen "${spec.id}" credit.url must start with https://`
    );
    assert.ok(
      typeof spec.credit.licenseUrl === "string" && spec.credit.licenseUrl.startsWith("https://"),
      `Specimen "${spec.id}" credit.licenseUrl must start with https://`
    );
  }
});
