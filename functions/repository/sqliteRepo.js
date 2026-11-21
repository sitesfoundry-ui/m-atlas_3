import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export function createSqliteRepo(dbPath = process.env.DB_PATH || "./data/matlas.db") {
  let db = null;

  function ensureDb() {
    if (db) return db;
    if (dbPath !== ":memory:") {
      fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
    }
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA journal_mode = WAL;");
    return db;
  }

  return {
    kind: "sqlite",

    async init() {
      const conn = ensureDb();
      const schemaPath = path.resolve("db/schema.sqlite.sql");
      const sql = fs.readFileSync(schemaPath, "utf8");
      conn.exec(sql);
    },

    async createContactMessage({
      requestId,
      fullName,
      email,
      phone,
      topic,
      specimenId,
      message,
      consentGiven,
    }) {
      const conn = ensureDb();
      const createdAt = new Date().toISOString();
      const stmt = conn.prepare(`
        INSERT INTO contact_messages (
          request_id, full_name, email, phone, topic, specimen_id, message, consent_given, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(request_id) DO NOTHING
      `);
      stmt.run(
        requestId,
        fullName,
        email,
        phone || null,
        topic,
        specimenId || null,
        message,
        consentGiven ? 1 : 0,
        createdAt
      );
      return { createdAt };
    },

    async subscribeEmail({ email, locale = "mn" }) {
      const conn = ensureDb();
      const createdAt = new Date().toISOString();
      const normalized = email.trim().toLowerCase();
      const stmt = conn.prepare(`
        INSERT INTO newsletter_subscribers (email, locale, created_at)
        VALUES (?, ?, ?)
        ON CONFLICT(email) DO NOTHING
      `);
      stmt.run(normalized, locale, createdAt);
      return { createdAt };
    },

    async ping() {
      const conn = ensureDb();
      const row = conn.prepare("SELECT 1 AS ok").get();
      return Boolean(row && row.ok === 1);
    },

    async counts() {
      const conn = ensureDb();
      const contact = conn.prepare("SELECT COUNT(*) AS n FROM contact_messages").get();
      const newsletter = conn.prepare("SELECT COUNT(*) AS n FROM newsletter_subscribers").get();
      return {
        contact_messages: Number(contact?.n || 0),
        newsletter_subscribers: Number(newsletter?.n || 0),
      };
    },

    async close() {
      if (db) {
        db.close();
        db = null;
      }
    },
  };
}
