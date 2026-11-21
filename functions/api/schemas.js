import { z } from "zod";
import { specimens } from "../../src/content/specimens.js";

export const SPECIMEN_IDS = specimens.map((s) => s.id);
export const CONTACT_TOPICS = ["general", "suggest", "press", "feedback"];

export const contactSchema = z
  .object({
    requestId: z.string().trim().min(1).max(128),
    fullName: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
    phone: z
      .string()
      .trim()
      .max(40)
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    topic: z.enum(["general", "suggest", "press", "feedback"]),
    specimenId: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    message: z.string().trim().min(1).max(2000),
    consentGiven: z.literal(true),
    website: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.specimenId != null) {
      if (data.topic !== "feedback") {
        ctx.addIssue({
          code: "custom",
          path: ["specimenId"],
          message: "Specimen can only be selected when topic is feedback.",
        });
      } else if (!SPECIMEN_IDS.includes(data.specimenId)) {
        ctx.addIssue({
          code: "custom",
          path: ["specimenId"],
          message: "Unknown specimen.",
        });
      }
    }
  });

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  locale: z.enum(["mn", "en"]).default("mn"),
});
