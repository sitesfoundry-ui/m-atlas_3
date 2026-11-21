import { createPgRepo } from "./pgRepo.js";
import { createSqliteRepo } from "./sqliteRepo.js";

export function createRepository() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl.trim().length > 0) {
    return createPgRepo(databaseUrl);
  }
  return createSqliteRepo(process.env.DB_PATH || "./data/matlas.db");
}
