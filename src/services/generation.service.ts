import { randomUUID } from "node:crypto";
import { applicationConfig } from "../config/application.config.ts";
import {
  generateMixedNumbers,
  generateNumbers,
  type GeneratedNumber,
  type GenerationMode,
  type NumberFormat,
} from "../domain/generator.ts";
import type { GeneratableNetworkSlug } from "../domain/networks.ts";
import {
  getPreviouslyGeneratedSet,
  saveGenerationBatch,
} from "../repositories/generation.repository.ts";

export interface GenerationRequest {
  network: GeneratableNetworkSlug | "mixed";
  quantity: number;
  format: NumberFormat;
  mode: GenerationMode;
  prefix?: string;
  seed?: string;
  startAt?: number;
  save?: boolean;
  preventPreviouslyGenerated?: boolean;
  weights?: Partial<Record<GeneratableNetworkSlug, number>>;
}

function publicBatchId(): string {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `GEN-${stamp}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function createGeneration(request: GenerationRequest): {
  batchId: string;
  saved: boolean;
  numbers: GeneratedNumber[];
} {
  if (request.quantity > applicationConfig.maxGenerationSize) {
    throw new Error(`Maximum generation size is ${applicationConfig.maxGenerationSize}.`);
  }

  const exclusion = request.preventPreviouslyGenerated
    ? getPreviouslyGeneratedSet(request.network === "mixed" ? undefined : request.network)
    : undefined;

  const numbers = request.network === "mixed"
    ? generateMixedNumbers({
        quantity: request.quantity,
        format: request.format,
        mode: request.mode,
        weights: request.weights ?? {},
        seed: request.seed,
        exclude: exclusion,
      })
    : generateNumbers({
        network: request.network,
        quantity: request.quantity,
        format: request.format,
        mode: request.mode,
        prefix: request.prefix,
        seed: request.seed,
        startAt: request.startAt,
        exclude: exclusion,
      });

  const batchId = publicBatchId();
  const saved = request.save !== false;
  if (saved) {
    saveGenerationBatch({
      publicId: batchId,
      network: request.network,
      format: request.format,
      mode: request.mode,
      seed: request.seed,
      prefix: request.prefix,
      numbers,
    });
  }
  return { batchId, saved, numbers };
}
