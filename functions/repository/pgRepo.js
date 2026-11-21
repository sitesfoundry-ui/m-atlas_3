import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

export function buildPgConfig(databaseUrl, env = process.env) {
  const parsed = new URL(databaseUrl);
  parsed.searchParams.delete("sslmode");

  let ssl = false;
  if (env.PG_CA_CERT && env.PG_CA_CERT.trim().length > 0) {
    ssl = {
      ca: env.PG_CA_CERT.replace(/\\n/g, "\n"),
      rejectUnauthorized: true,
    };
  } else if (env.NODE_ENV === "production") {
    ssl = { rejectUnauthorized: true };
  }

  return {
    connectionString: parsed.toString(),
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    ssl,
  };
}

export function createPgRepo(databaseUrl = process.env.DATABASE_URL) {
  const pool = new Pool(buildPgConfig(databaseUrl, process.env));

  pool.on("error", (err) => {
    const code = err && typeof err === "object" && "code" in err ? err.code : "pool_error";
    console.error("[pgRepo] pool error:", code);
  });

  return {
    kind: "postgres",

    async init() {
      const schemaPath = path.resolve("db/schema.postgres.sql");
      const sql = fs.readFileSync(schemaPath, "utf8");
      await pool.query(sql);
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
      const createdAt = new Date().toISOString();
      await pool.query(
        `
          INSERT INTO contact_messages (
            request_id, full_name, email, phone, topic, specimen_id, message, consent_given, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (request_id) DO NOTHING
        `,
        [
          requestId,
          fullName,
          email,
          phone || null,
          topic,
          specimenId || null,
          message,
          Boolean(consentGiven),
          createdAt,
        ]
      );
      return { createdAt };
    },

    async subscribeEmail({ email, locale = "mn" }) {
      const createdAt = new Date().toISOString();
      const normalized = email.trim().toLowerCase();
      await pool.query(
        `
          INSERT INTO newsletter_subscribers (email, locale, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (email) DO NOTHING
        `,
        [normalized, locale, createdAt]
      );
      return { createdAt };
    },

    async ping() {
      const res = await pool.query("SELECT 1 AS ok");
      return Boolean(res.rows[0] && res.rows[0].ok === 1);
    },

    async counts() {
      const contact = await pool.query("SELECT COUNT(*)::int AS n FROM contact_messages");
      const newsletter = await pool.query("SELECT COUNT(*)::int AS n FROM newsletter_subscribers");
      return {
        contact_messages: Number(contact.rows[0]?.n || 0),
        newsletter_subscribers: Number(newsletter.rows[0]?.n || 0),
      };
    },

    async close() {
      await pool.end();
    },
  };
}
