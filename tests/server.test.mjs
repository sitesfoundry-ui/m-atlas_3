import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createApp } from "../functions/app.js";

function createFakeRepo(overrides = {}) {
  return {
    async ping() {
      return true;
    },
    async createContactMessage() {
      return { createdAt: new Date().toISOString() };
    },
    async subscribeEmail() {
      return { createdAt: new Date().toISOString() };
    },
    async close() {},
    ...overrides,
  };
}

async function startTestServer(options) {
  const app = createApp(options);
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${addr.port}`,
        close: () =>
          new Promise((done) => {
            server.close(() => done(undefined));
          }),
      });
    });
  });
}

test("API health, 404, malformed JSON, payload limit, security headers, and static 404s", async () => {
  const tmpDist = fs.mkdtempSync(path.join(os.tmpdir(), "matlas-dist-"));
  fs.mkdirSync(path.join(tmpDist, "assets"), { recursive: true });
  fs.writeFileSync(
    path.join(tmpDist, "index.html"),
    "<!doctype html><html><body>M Atlas</body></html>"
  );

  let dbReady = false;
  const srv = await startTestServer({
    repo: createFakeRepo(),
    isDbReady: () => dbReady,
    distDir: tmpDist,
    isProduction: true,
  });

  try {
    // DB unavailable -> 503, then 200 once ready
    const h503 = await fetch(`${srv.baseUrl}/api/health`);
    assert.equal(h503.status, 503);
    assert.deepEqual(await h503.json(), { ok: false, code: "unavailable" });
    assert.equal(h503.headers.get("x-content-type-options"), "nosniff");
    assert.equal(h503.headers.get("x-powered-by"), null);
    assert.equal(h503.headers.get("x-frame-options"), null);

    dbReady = true;
    const h200 = await fetch(`${srv.baseUrl}/api/health`);
    assert.equal(h200.status, 200);
    assert.deepEqual(await h200.json(), { ok: true });

    // Unknown API route -> JSON 404
    const apiMissing = await fetch(`${srv.baseUrl}/api/unknown`);
    assert.equal(apiMissing.status, 404);
    assert.deepEqual(await apiMissing.json(), { ok: false, code: "not_found" });

    // Broken JSON -> 400 JSON
    const badJson = await fetch(`${srv.baseUrl}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad",
    });
    assert.equal(badJson.status, 400);
    assert.deepEqual(await badJson.json(), { ok: false, code: "invalid_json" });

    // Oversized JSON (>32kb) -> 413 JSON
    const oversized = JSON.stringify({
      email: "reader@example.com",
      locale: "mn",
      pad: "x".repeat(40 * 1024),
    });
    const tooLarge = await fetch(`${srv.baseUrl}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: oversized,
    });
    assert.equal(tooLarge.status, 413);
    assert.deepEqual(await tooLarge.json(), { ok: false, code: "payload_too_large" });

    // Missing static assets -> 404 (not index.html)
    const missingAsset = await fetch(`${srv.baseUrl}/assets/missing.js`);
    assert.equal(missingAsset.status, 404);

    const missingModel = await fetch(`${srv.baseUrl}/models/x.glb`);
    assert.equal(missingModel.status, 404);

    const missingFavicon = await fetch(`${srv.baseUrl}/favicon.ico`);
    assert.equal(missingFavicon.status, 404);

    // SPA route -> 200 HTML
    const spaRoute = await fetch(`${srv.baseUrl}/myths`);
    assert.equal(spaRoute.status, 200);
    assert.match(spaRoute.headers.get("content-type") || "", /text\/html/);
    assert.match(await spaRoute.text(), /M Atlas/);

    const aboutRoute = await fetch(`${srv.baseUrl}/about`);
    assert.equal(aboutRoute.status, 200);
    assert.match(aboutRoute.headers.get("content-type") || "", /text\/html/);

    // Unknown SPA routes -> 404 status with index.html shell
    for (const missingPath of ["/nope", "/notes/nope", "/collections/nope", "/legal/nope"]) {
      const missingRes = await fetch(`${srv.baseUrl}${missingPath}`);
      assert.equal(missingRes.status, 404, `expected 404 for ${missingPath}`);
      assert.match(missingRes.headers.get("content-type") || "", /text\/html/);
      assert.match(await missingRes.text(), /M Atlas/);
    }
  } finally {
    await srv.close();
    fs.rmSync(tmpDist, { recursive: true, force: true });
  }
});

test("Rate limit returns 429 on 11th newsletter submission within window", async () => {
  const srv = await startTestServer({
    repo: createFakeRepo(),
    isDbReady: () => true,
    isProduction: false,
  });

  try {
    for (let i = 0; i < 10; i++) {
      const res = await fetch(`${srv.baseUrl}/api/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `reader${i}@example.com`, locale: "mn" }),
      });
      assert.equal(res.status, 200);
    }

    const res11 = await fetch(`${srv.baseUrl}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "reader10@example.com", locale: "mn" }),
    });
    assert.equal(res11.status, 429);
    assert.deepEqual(await res11.json(), { ok: false, code: "rate_limited" });
  } finally {
    await srv.close();
  }
});
