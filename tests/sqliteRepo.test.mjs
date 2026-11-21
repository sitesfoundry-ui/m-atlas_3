import assert from "node:assert/strict";
import test from "node:test";
import { createSqliteRepo } from "../functions/repository/sqliteRepo.js";

test("sqliteRepo inserts contact message once per requestId and deduplicates newsletter email", async () => {
  const repo = createSqliteRepo(":memory:");
  await repo.init();

  assert.equal(await repo.ping(), true);

  await repo.createContactMessage({
    requestId: "req-1",
    fullName: "Sarnai",
    email: "sarnai@example.com",
    phone: null,
    topic: "feedback",
    specimenId: "kingfisher",
    message: "Great plate",
    consentGiven: true,
  });

  await repo.createContactMessage({
    requestId: "req-1",
    fullName: "Sarnai",
    email: "sarnai@example.com",
    phone: null,
    topic: "feedback",
    specimenId: "kingfisher",
    message: "Great plate",
    consentGiven: true,
  });

  await repo.subscribeEmail({ email: "Reader@Example.com", locale: "mn" });
  await repo.subscribeEmail({ email: "reader@example.com", locale: "en" });

  const counts = await repo.counts();
  assert.equal(counts.contact_messages, 1);
  assert.equal(counts.newsletter_subscribers, 1);

  await repo.close();
});
