import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";
import { createApiHandlers } from "./api/handlers.js";
import { isKnownRoute } from "./knownRoutes.js";

/**
 * @param {object} options
 * @param {any} options.repo
 * @param {() => boolean} [options.isDbReady]
 * @param {string} [options.distDir]
 * @param {boolean} [options.isProduction]
 * @param {any} [options.devMiddleware]
 */
export function createApp({
  repo,
  isDbReady = () => true,
  distDir = path.resolve("dist"),
  isProduction = false,
  devMiddleware = null,
}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );

  app.use(express.json({ limit: "32kb" }));

  const formLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ ok: false, code: "rate_limited" });
    },
  });

  const handlers = createApiHandlers(repo, isDbReady);
  app.get("/api/health", handlers.health);
  app.post("/api/contact", formLimiter, handlers.contact);
  app.post("/api/newsletter", formLimiter, handlers.newsletter);
  app.use("/api", (_req, res) => {
    res.status(404).json({ ok: false, code: "not_found" });
  });

  if (!isProduction && devMiddleware) {
    app.use(devMiddleware);
  } else if (isProduction) {
    const resolvedDist = path.resolve(distDir);
    const notFound = (_req, res) => res.status(404).send("Not found");

    app.use(
      "/assets",
      express.static(path.join(resolvedDist, "assets"), {
        setHeaders(res) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        },
      }),
      notFound
    );
    app.use(
      "/models",
      express.static(path.join(resolvedDist, "models"), {
        setHeaders(res) {
          res.setHeader(
            "Cache-Control",
            "public, max-age=604800, stale-while-revalidate=86400"
          );
        },
      }),
      notFound
    );
    app.use(
      "/media",
      express.static(path.join(resolvedDist, "media"), {
        setHeaders(res) {
          res.setHeader(
            "Cache-Control",
            "public, max-age=604800, stale-while-revalidate=86400"
          );
        },
      }),
      notFound
    );
    app.use(
      "/draco",
      express.static(path.join(resolvedDist, "draco"), {
        setHeaders(res) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        },
      }),
      notFound
    );
    app.use(
      express.static(resolvedDist, {
        index: false,
        maxAge: "1h",
        setHeaders(res, filePath) {
          if (filePath.endsWith("index.html")) {
            res.setHeader("Cache-Control", "no-cache");
          }
        },
      })
    );
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        return next();
      }
      if (path.extname(req.path)) {
        return res.status(404).send("Not found");
      }
      const indexFile = path.join(resolvedDist, "index.html");
      if (fs.existsSync(indexFile)) {
        res.setHeader("Cache-Control", "no-cache");
        return res.status(isKnownRoute(req.path) ? 200 : 404).sendFile(indexFile);
      }
      return res.status(404).send("Build missing");
    });
  }

  app.use((err, req, res, _next) => {
    const errObj = err && typeof err === "object" ? err : {};
    const type = "type" in errObj ? errObj.type : undefined;
    const rawStatus = "status" in errObj ? Number(errObj.status) : 500;
    const status = rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500;
    const code = "code" in errObj && errObj.code ? errObj.code : type || "server_error";

    if (
      req.path.startsWith("/api") ||
      type === "entity.parse.failed" ||
      type === "entity.too.large"
    ) {
      if (type === "entity.parse.failed" || (err instanceof SyntaxError && status === 400)) {
        return res.status(400).json({ ok: false, code: "invalid_json" });
      }
      if (type === "entity.too.large" || status === 413) {
        return res.status(413).json({ ok: false, code: "payload_too_large" });
      }
      console.error("[server:error]", code);
      return res.status(status).json({ ok: false, code: "server_error" });
    }

    console.error("[server:error]", code);
    return res.status(status).send("Server error");
  });

  return app;
}
