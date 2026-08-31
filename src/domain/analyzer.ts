import { inspectPhoneNumber } from "./phone.ts";

export interface AnalysisSummary {
  total: number;
  valid: number;
  invalid: number;
  byNetwork: Record<string, number>;
  byPrefix: Record<string, number>;
  items: ReturnType<typeof inspectPhoneNumber>[];
}

export function analyzeNumbers(numbers: readonly string[]): AnalysisSummary {
  const items = numbers.map(inspectPhoneNumber);
  const byNetwork: Record<string, number> = {};
  const byPrefix: Record<string, number> = {};
  let valid = 0;

  for (const item of items) {
    if (!item.valid) continue;
    valid += 1;
    const network = item.allocationNetwork?.slug ?? "unknown";
    byNetwork[network] = (byNetwork[network] ?? 0) + 1;
    if (item.prefix) byPrefix[item.prefix] = (byPrefix[item.prefix] ?? 0) + 1;
  }

  return {
    total: items.length,
    valid,
    invalid: items.length - valid,
    byNetwork,
    byPrefix,
    items,
  };
}
