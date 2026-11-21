import { contactSchema, newsletterSchema } from "./schemas.js";

export function createApiHandlers(repo, isDbReady = () => true) {
  return {
    async health(_req, res) {
      if (!isDbReady()) {
        return res.status(503).json({ ok: false, code: "unavailable" });
      }
      try {
        const ok = await repo.ping();
        if (!ok) {
          return res.status(503).json({ ok: false, code: "unavailable" });
        }
        return res.json({ ok: true });
      } catch (err) {
        const code = err && typeof err === "object" && "code" in err ? err.code : "db_error";
        console.error("[api/health]", code);
        return res.status(503).json({ ok: false, code: "unavailable" });
      }
    },

    async contact(req, res) {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      if (typeof body.website === "string" && body.website.trim().length > 0) {
        return res.json({ ok: true });
      }

      const parsed = contactSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({ ok: false, code: "invalid_input" });
      }

      if (!isDbReady()) {
        return res.status(503).json({ ok: false, code: "unavailable" });
      }

      try {
        await repo.createContactMessage({
          requestId: parsed.data.requestId,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          topic: parsed.data.topic,
          specimenId: parsed.data.specimenId,
          message: parsed.data.message,
          consentGiven: parsed.data.consentGiven,
        });
        return res.json({ ok: true });
      } catch (err) {
        const code = err && typeof err === "object" && "code" in err ? err.code : "db_error";
        console.error("[api/contact]", parsed.data.requestId, code);
        return res.status(503).json({ ok: false, code: "unavailable" });
      }
    },

    async newsletter(req, res) {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const parsed = newsletterSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({ ok: false, code: "invalid_input" });
      }

      if (!isDbReady()) {
        return res.status(503).json({ ok: false, code: "unavailable" });
      }

      try {
        await repo.subscribeEmail({
          email: parsed.data.email,
          locale: parsed.data.locale,
        });
        return res.json({ ok: true });
      } catch (err) {
        const code = err && typeof err === "object" && "code" in err ? err.code : "db_error";
        console.error("[api/newsletter]", code);
        return res.status(503).json({ ok: false, code: "unavailable" });
      }
    },
  };
}
