# M Atlas 6b: credits and a data test

Paste this whole message into the Google AI Studio builder of project 3 (M Atlas). Part 6a (the nine specimens with their `credit` objects) must already be in the project. This is part 2 of 3.

> **Part 2 of 3.** Do only this part. **Step 0:** save this whole message word for word as `docs/specs/matlas-6b.md` in the project (so it survives if the chat context is reset), then implement it. If you cannot see the complete text of this message (for example an attachment is missing or cut off), stop and tell me instead of guessing any data.

---

## Rules

1. **Look at the current code before you change anything.** Earlier fix prompts may already have changed files. Where this prompt names a file or a field that no longer matches the code, follow the code and keep the intent.
2. **The design stays exactly as it is.** Fonts, colours, spacing, layout, video, animation, breakpoints, the footer, the 404 page, the contact details (address, phone, links) and every existing page are not touched.
3. **Mongolian text must never break the layout.** Check in both languages at 320, 360, 390, 414, 600, 768, 1024, 1280 and 1440 px wide. Fix the cause in CSS (wrapping, `min-width: 0`, `overflow-wrap`), never by shrinking fonts below what the design already uses.
4. Code must read as if a careful human wrote it: plain names, no dead code, no commented-out blocks, no `console.log`. No new npm dependency.
5. Do not paste, upload or "analyse" the model files inside this builder. They live on the media host and are only loaded by URL.

## What to build

The nine specimens added in part 6a each carry a `credit` object `{ title, author, url, license, licenseUrl }`. Read them from `src/content/specimens.js`; do not retype or change them.

### 1.  Credits (required by the CC BY licence)
Every new entry has a `credit` object (they are in `specimens.js`, added in part 6a). Show it as one small line under the 3D viewer in the specimen detail panel, in the smallest caption style the design already has. English form: `Model: {title} by {author} · {license}. Simplified and compressed for the web.` Mongolian form: `3D загвар: {title} — {author} · {license}. Вэбд зориулан хөнгөвчилж, шахсан.` The title, the author and the licence are links (`target="_blank" rel="noopener noreferrer"`, with a visually hidden "(opens in a new tab)" / "(шинэ цонхонд нээгдэнэ)"). For the entries with `license: "CC0"` the line says `Public domain (CC0)` / `Нийтийн өмч (CC0)` and omits the "by" part's link style if the author is an institution without a profile link. Put the template strings in the i18n files (both languages, same keys). The existing four specimens have no `credit`, and for them no line is drawn. The line may wrap to two lines on a phone; it must never overflow, and it must stay below the viewer's controls.

Create or extend `docs/CREDITS.md` with one table row per model: id, title, author, source URL, licence, licence URL, what was changed (decimated, compressed, textures resized), date added.

## 2. Data test

Add `tests/specimens.test.mjs`, which imports `specimens.js` and `categories.js` and asserts: every `categories[*][*].specimen` exists in `specimens`; every specimen is listed in its volume; ids and `no` values are unique; every entry has `tags.length === 3` and `traits.length === 4`; every trait `icon` exists in `IconSprite.jsx`; every trait `key` exists in `traitLabels` in both languages; every Mongolian string contains a Cyrillic letter (Latin family names and `credit` fields are exempt); `lens` matches `^\d{1,3}% \d{1,3}%$`; and every entry with `credit` has an `https://` `url` and `licenseUrl`.

## Checks to run and report

1. The credit line shows under the viewer for each of the nine new specimens in both languages, and for the old four no line is drawn. Links open in a new tab and carry the hidden "(opens in a new tab)" text. At every width in the list above the line wraps without overflowing or touching the viewer controls.
2. `docs/CREDITS.md` has one row per model with all columns filled.
3. `npm run check:i18n`, `npm run lint`, `npm test` (including the new test) and `npm run build` all pass.
