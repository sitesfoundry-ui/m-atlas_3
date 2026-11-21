import "dotenv/config";
import path from "node:path";
import { createApp } from "./functions/app.js";
import { createRepository } from "./functions/repository/index.js";

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === "production";

async function startServer() {
  const repo = createRepository();
  let dbReady = false;
  let shuttingDown = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  let vite: import("vite").ViteDevServer | null = null;
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
  }

  const app = createApp({
    repo,
    isDbReady: () => dbReady,
    distDir: path.resolve("dist"),
    isProduction: isProd,
    devMiddleware: vite ? vite.middlewares : null,
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`M Atlas listening on http://localhost:${PORT}`);
  });

  const initDbWithBackoff = async (delayMs = 2000) => {
    if (shuttingDown) return;
    try {
      await repo.init();
      dbReady = true;
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err ? err.code : "init_error";
      console.error("[db:init]", code);
      if (shuttingDown) return;
      retryTimer = setTimeout(() => {
        void initDbWithBackoff(Math.min(30000, delayMs * 2));
      }, delayMs);
      retryTimer.unref?.();
    }
  };

  void initDbWithBackoff();

  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    await new Promise((resolve) => {
      server.close(() => resolve(undefined));
    });
    if (vite) {
      await vite.close();
    }
    await repo.close();
    process.exit(0);
  };

  process.on("SIGTERM", () => {
    void shutdown();
  });
  process.on("SIGINT", () => {
    void shutdown();
  });
}

startServer();
