import type { Request, Response } from "express";
import { applicationConfig } from "../config/application.config.ts";
import { analyzeNumbers } from "../domain/analyzer.ts";
import { inspectPhoneNumber, normalizePhoneNumber } from "../domain/phone.ts";
import { getNetwork, NETWORKS } from "../domain/networks.ts";
import { analysisSchema, generationSchema, phoneSchema } from "../schemas/api.schemas.ts";
import { createGeneration } from "../services/generation.service.ts";
import { exportBatch, type ExportFormat } from "../services/export.service.ts";
import {
  deleteGenerationBatch,
  getBatchNumbers,
  getGenerationBatch,
  getStatistics,
  listGenerationBatches,
} from "../repositories/generation.repository.ts";
import { fail, ok } from "../utils/http.ts";

export const apiController = {
  health(_req: Request, res: Response) {
    return ok(res, {
      status: "ok",
      app: applicationConfig.appName,
      runtime: "Bun",
      apiVersion: applicationConfig.apiVersion,
      time: new Date().toISOString(),
    });
  },

  networks(_req: Request, res: Response) {
    return ok(res, NETWORKS);
  },

  network(req: Request, res: Response) {
    const network = getNetwork(req.params.slug ?? "");
    if (!network) return fail(res, 404, "NETWORK_NOT_FOUND", "Network was not found.");
    return ok(res, network);
  },

  generate(req: Request, res: Response) {
    const input = generationSchema.parse(req.body);
    try {
      const result = createGeneration(input);
      return ok(res, {
        ...result,
        count: result.numbers.length,
        warning: "Generated values are synthetic test data and may coincidentally match real subscriber numbers.",
      }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed.";
      return fail(res, 422, "GENERATION_ERROR", message);
    }
  },

  detect(req: Request, res: Response) {
    const { phoneNumber } = phoneSchema.parse(req.body);
    return ok(res, inspectPhoneNumber(phoneNumber));
  },

  validate(req: Request, res: Response) {
    const { phoneNumber } = phoneSchema.parse(req.body);
    const result = inspectPhoneNumber(phoneNumber);
    return ok(res, { valid: result.valid, reason: result.reason, prefix: result.prefix, network: result.allocationNetwork });
  },

  normalize(req: Request, res: Response) {
    const { phoneNumber } = phoneSchema.parse(req.body);
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized) return fail(res, 422, "INVALID_PHONE_NUMBER", "Number cannot be normalized with the current Tanzania mobile registry.");
    return ok(res, { input: phoneNumber, normalized });
  },

  analyze(req: Request, res: Response) {
    const { numbers } = analysisSchema.parse(req.body);
    return ok(res, analyzeNumbers(numbers));
  },

  generations(_req: Request, res: Response) {
    return ok(res, listGenerationBatches(100));
  },

  generation(req: Request, res: Response) {
    const batch = getGenerationBatch(req.params.id ?? "");
    if (!batch) return fail(res, 404, "BATCH_NOT_FOUND", "Generation batch was not found.");
    const numbers = getBatchNumbers(batch.id);
    return ok(res, { batch, numbers });
  },

  deleteGeneration(req: Request, res: Response) {
    const deleted = deleteGenerationBatch(req.params.id ?? "");
    if (!deleted) return fail(res, 404, "BATCH_NOT_FOUND", "Generation batch was not found.");
    return ok(res, { deleted: true });
  },

  statistics(_req: Request, res: Response) {
    return ok(res, getStatistics());
  },

  export(req: Request, res: Response) {
    const batch = getGenerationBatch(req.params.id ?? "");
    if (!batch) return fail(res, 404, "BATCH_NOT_FOUND", "Generation batch was not found.");
    const format = req.params.format as ExportFormat;
    if (!(["csv", "json", "txt"] as string[]).includes(format)) {
      return fail(res, 400, "INVALID_EXPORT_FORMAT", "Supported formats are csv, json and txt.");
    }
    const numbers = getBatchNumbers(batch.id, applicationConfig.maxGenerationSize);
    const body = exportBatch(batch, numbers, format);
    const contentTypes: Record<ExportFormat, string> = {
      csv: "text/csv; charset=utf-8",
      json: "application/json; charset=utf-8",
      txt: "text/plain; charset=utf-8",
    };
    res.setHeader("Content-Type", contentTypes[format]);
    res.setHeader("Content-Disposition", `attachment; filename=\"${batch.public_id}.${format}\"`);
    return res.send(body);
  },
};
