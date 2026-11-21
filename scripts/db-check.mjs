import "dotenv/config";
import { createRepository } from "../functions/repository/index.js";

async function main() {
  const repo = createRepository();
  try {
    await repo.init();
    const ok = await repo.ping();
    const counts = await repo.counts();
    console.log(
      `db:check ok (${repo.kind}, ping=${ok}): contact_messages=${counts.contact_messages}, newsletter_subscribers=${counts.newsletter_subscribers}`
    );
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? err.code : "db_error";
    console.error("db:check failed:", code);
    process.exitCode = 1;
  } finally {
    await repo.close();
  }
}

main();
