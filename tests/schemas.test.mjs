import assert from "node:assert/strict";
import test from "node:test";
import { contactSchema, newsletterSchema } from "../functions/api/schemas.js";

test("contactSchema accepts valid general message without specimenId", () => {
  const parsed = contactSchema.parse({
    requestId: "550e8400-e29b-41d4-a716-446655440000",
    fullName: "Bat-Erdene",
    email: "bat@example.com",
    phone: "",
    topic: "general",
    specimenId: null,
    message: "Hello editors",
    consentGiven: true,
  });
  assert.equal(parsed.phone, null);
  assert.equal(parsed.specimenId, null);
});

test("contactSchema rejects specimenId unless topic is feedback", () => {
  const res = contactSchema.safeParse({
    requestId: "550e8400-e29b-41d4-a716-446655440001",
    fullName: "Bat-Erdene",
    email: "bat@example.com",
    topic: "general",
    specimenId: "kingfisher",
    message: "Note on kingfisher",
    consentGiven: true,
  });
  assert.equal(res.success, false);
});

test("contactSchema accepts valid specimenId when topic is feedback", () => {
  const res = contactSchema.safeParse({
    requestId: "550e8400-e29b-41d4-a716-446655440002",
    fullName: "Bat-Erdene",
    email: "bat@example.com",
    topic: "feedback",
    specimenId: "phoenix",
    message: "Feedback on phoenix",
    consentGiven: true,
  });
  assert.equal(res.success, true);
});

test("contactSchema rejects unknown specimenId even on feedback", () => {
  const res = contactSchema.safeParse({
    requestId: "550e8400-e29b-41d4-a716-446655440003",
    fullName: "Bat-Erdene",
    email: "bat@example.com",
    topic: "feedback",
    specimenId: "leviathan",
    message: "Feedback",
    consentGiven: true,
  });
  assert.equal(res.success, false);
});

test("newsletterSchema lowercases email and validates locale", () => {
  const parsed = newsletterSchema.parse({
    email: "  Reader@Example.COM ",
    locale: "en",
  });
  assert.equal(parsed.email, "reader@example.com");
  assert.equal(parsed.locale, "en");
});
