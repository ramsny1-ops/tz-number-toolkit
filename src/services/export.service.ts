import type { GenerationBatchRecord, StoredNumberRecord } from "../repositories/generation.repository.ts";

export type ExportFormat = "csv" | "json" | "txt";

function safeCsvCell(value: string): string {
  const protectedValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${protectedValue.replaceAll('"', '""')}"`;
}

export function exportBatch(batch: GenerationBatchRecord, numbers: StoredNumberRecord[], format: ExportFormat): string {
  if (format === "json") {
    return JSON.stringify({
      batch: {
        id: batch.public_id,
        network: batch.network,
        quantity: batch.quantity,
        format: batch.format,
        mode: batch.mode,
        createdAt: batch.created_at,
      },
      numbers: numbers.map((row) => ({
        number: row.normalized_number,
        local: row.local_number,
        network: row.network,
        prefix: row.prefix,
      })),
    }, null, 2);
  }

  if (format === "txt") return numbers.map((row) => row.normalized_number).join("\n") + "\n";

  const header = "number,local,network,prefix";
  const rows = numbers.map((row) => [
    safeCsvCell(row.normalized_number),
    safeCsvCell(row.local_number),
    safeCsvCell(row.network),
    safeCsvCell(row.prefix),
  ].join(","));
  return [header, ...rows].join("\n") + "\n";
}
