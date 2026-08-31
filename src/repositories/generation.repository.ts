import { db } from "../database/database.ts";
import type { GeneratedNumber, GenerationMode, NumberFormat } from "../domain/generator.ts";

export interface GenerationBatchRecord {
  id: number;
  public_id: string;
  network: string;
  quantity: number;
  format: NumberFormat;
  mode: GenerationMode;
  seed: string | null;
  prefix: string | null;
  created_at: string;
}

export interface SaveBatchInput {
  publicId: string;
  network: string;
  format: NumberFormat;
  mode: GenerationMode;
  seed?: string;
  prefix?: string;
  numbers: readonly GeneratedNumber[];
}

const insertBatch = db.query(`
  INSERT INTO generation_batches
    (public_id, network, quantity, format, mode, seed, prefix, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  RETURNING id
`);

const insertNumber = db.query(`
  INSERT INTO generated_numbers
    (batch_id, normalized_number, local_number, network, prefix, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

export function saveGenerationBatch(input: SaveBatchInput): void {
  const transaction = db.transaction(() => {
    const createdAt = new Date().toISOString();
    const row = insertBatch.get(
      input.publicId,
      input.network,
      input.numbers.length,
      input.format,
      input.mode,
      input.seed ?? null,
      input.prefix ?? null,
      createdAt,
    ) as { id: number };

    for (const number of input.numbers) {
      insertNumber.run(
        row.id,
        number.normalized,
        number.local,
        number.network,
        number.prefix,
        createdAt,
      );
    }
  });
  transaction();
}

export function listGenerationBatches(limit = 50): GenerationBatchRecord[] {
  return db.query(`
    SELECT id, public_id, network, quantity, format, mode, seed, prefix, created_at
    FROM generation_batches
    ORDER BY id DESC
    LIMIT ?
  `).all(limit) as GenerationBatchRecord[];
}

export function getGenerationBatch(publicId: string): GenerationBatchRecord | null {
  return (db.query(`
    SELECT id, public_id, network, quantity, format, mode, seed, prefix, created_at
    FROM generation_batches WHERE public_id = ? LIMIT 1
  `).get(publicId) as GenerationBatchRecord | null) ?? null;
}

export interface StoredNumberRecord {
  id: number;
  normalized_number: string;
  local_number: string;
  network: string;
  prefix: string;
  created_at: string;
}

export function getBatchNumbers(batchId: number, limit = 10_000, offset = 0): StoredNumberRecord[] {
  return db.query(`
    SELECT id, normalized_number, local_number, network, prefix, created_at
    FROM generated_numbers
    WHERE batch_id = ?
    ORDER BY id ASC
    LIMIT ? OFFSET ?
  `).all(batchId, limit, offset) as StoredNumberRecord[];
}

export function getPreviouslyGeneratedSet(network?: string): Set<string> {
  const rows = network
    ? db.query("SELECT normalized_number FROM generated_numbers WHERE network = ?").all(network)
    : db.query("SELECT normalized_number FROM generated_numbers").all();
  return new Set((rows as { normalized_number: string }[]).map((row) => row.normalized_number));
}

export function deleteGenerationBatch(publicId: string): boolean {
  return db.query("DELETE FROM generation_batches WHERE public_id = ?").run(publicId).changes > 0;
}

export function getStatistics(): {
  totalGenerated: number;
  totalBatches: number;
  todayGenerated: number;
  byNetwork: { network: string; count: number }[];
  byPrefix: { prefix: string; count: number }[];
} {
  const totalGenerated = (db.query("SELECT COUNT(*) AS count FROM generated_numbers").get() as { count: number }).count;
  const totalBatches = (db.query("SELECT COUNT(*) AS count FROM generation_batches").get() as { count: number }).count;
  const todayGenerated = (db.query(`
    SELECT COUNT(*) AS count FROM generated_numbers
    WHERE date(created_at) = date('now')
  `).get() as { count: number }).count;
  const byNetwork = db.query(`
    SELECT network, COUNT(*) AS count FROM generated_numbers
    GROUP BY network ORDER BY count DESC
  `).all() as { network: string; count: number }[];
  const byPrefix = db.query(`
    SELECT prefix, COUNT(*) AS count FROM generated_numbers
    GROUP BY prefix ORDER BY count DESC
  `).all() as { prefix: string; count: number }[];
  return { totalGenerated, totalBatches, todayGenerated, byNetwork, byPrefix };
}
