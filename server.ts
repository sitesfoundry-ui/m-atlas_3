import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { createApiHandlers } from "./functions/api/handlers.js";
import { createRepository } from "./functions/repository/index.js";

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === "production";

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  const repo = createRepository();
  let dbReady = false;
  try {
    await repo.init();
    dbReady = true;
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? err.code : "init_error";
    console.error("[db:init]", code);
  }

  const handlers = createApiHandlers(repo, () => dbReady);
  app.get("/api/health", handlers.health);
  app.post("/api/contact", handlers.contact);
  app.post("/api/newsletter", handlers.newsletter);
  app.use("/api", (_req, res) => {
    res.status(404).json({ ok: false, code: "not_found" });
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve("dist");
    app.use(
      "/assets",
      express.static(path.join(distDir, "assets"), {
        setHeaders(res) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        },
      })
    );
    app.use(
      "/models",
      express.static(path.join(distDir, "models"), {
        setHeaders(res) {
          res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
        },
      })
    );
    app.use(
      "/media",
      express.static(path.join(distDir, "media"), {
        setHeaders(res) {
          res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
        },
      })
    );
    app.use(
      express.static(distDir, {
        index: false,
        setHeaders(res, filePath) {
          if (filePath.endsWith("index.html")) {
            res.setHeader("Cache-Control", "no-cache");
          }
        },
      })
    );
    app.get("*", (_req, res) => {
      const indexFile = path.join(distDir, "index.html");
      if (fs.existsSync(indexFile)) {
        res.setHeader("Cache-Control", "no-cache");
        return res.sendFile(indexFile);
      }
      return res.status(404).send("Build missing");
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`M Atlas listening on http://localhost:${PORT}`);
  });
}

startServer();
