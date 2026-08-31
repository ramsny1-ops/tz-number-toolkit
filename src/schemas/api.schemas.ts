import { z } from "zod";
import { applicationConfig } from "../config/application.config.ts";

const generatableNetwork = z.enum(["airtel", "vodacom", "yas", "halotel", "ttcl"]);
const allGenerationNetworks = z.union([generatableNetwork, z.literal("mixed")]);

export const generationSchema = z.object({
  network: allGenerationNetworks,
  quantity: z.coerce.number().int().min(1).max(applicationConfig.maxGenerationSize),
  format: z.enum(["local", "international", "compact"]).default("international"),
  mode: z.enum(["random", "sequential", "seeded"]).default("random"),
  prefix: z.string().regex(/^0[67]\d$/).optional(),
  seed: z.string().trim().min(1).max(100).optional(),
  startAt: z.coerce.number().int().min(0).max(9_999_999).optional(),
  save: z.boolean().optional().default(true),
  preventPreviouslyGenerated: z.boolean().optional().default(false),
  weights: z.record(generatableNetwork, z.number().min(0).max(1000)).optional(),
}).superRefine((value, context) => {
  if (value.mode === "seeded" && !value.seed) {
    context.addIssue({ code: "custom", path: ["seed"], message: "Seed is required in seeded mode." });
  }
  if (value.network === "mixed" && !value.weights) {
    context.addIssue({ code: "custom", path: ["weights"], message: "Weights are required for mixed generation." });
  }
  if (value.network === "mixed" && value.prefix) {
    context.addIssue({ code: "custom", path: ["prefix"], message: "Prefix cannot be fixed in mixed mode." });
  }
});

export const phoneSchema = z.object({
  phoneNumber: z.string().trim().min(1).max(40),
});

export const analysisSchema = z.object({
  numbers: z.array(z.string().max(40)).min(1).max(applicationConfig.maxAnalysisSize),
});
