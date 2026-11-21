import assert from "node:assert/strict";
import test from "node:test";
import { runCheck } from "../scripts/check-i18n.mjs";
import { format, formatDate } from "../src/i18n/index.js";

test("format replaces placeholders cleanly", () => {
  assert.equal(format("{family} · Specimen {no}", { family: "UPUPIDAE", no: "MA-101" }), "UPUPIDAE · Specimen MA-101");
  assert.equal(format("{n} species", { n: 8 }), "8 species");
});

test("formatDate formats dates for English and Mongolian", () => {
  assert.equal(formatDate("2026-11-05", "en"), "5 Nov 2026");
  assert.equal(formatDate("2026-11-05", "mn"), "2026.11.05");
});

test("i18n bundles match keys and Mongolian has Cyrillic", () => {
  const errors = runCheck();
  assert.deepEqual(errors, []);
});
