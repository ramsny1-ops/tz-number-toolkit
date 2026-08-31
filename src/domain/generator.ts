import {
  getGeneratableNetworks,
  getNetwork,
  type NetworkDefinition,
  type GeneratableNetworkSlug,
} from "./networks.ts";

export type NumberFormat = "local" | "international" | "compact";
export type GenerationMode = "random" | "sequential" | "seeded";

export interface GenerateOptions {
  network: GeneratableNetworkSlug;
  quantity: number;
  format: NumberFormat;
  mode: GenerationMode;
  prefix?: string;
  seed?: string;
  startAt?: number;
  exclude?: ReadonlySet<string>;
}

export interface GeneratedNumber {
  value: string;
  normalized: string;
  local: string;
  prefix: string;
  network: GeneratableNetworkSlug;
}

function secureInt(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) throw new Error("Invalid random range.");
  const maxUint32 = 0x1_0000_0000;
  const limit = Math.floor(maxUint32 / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer); while ((buffer[0] ?? 0) >= limit);
  return (buffer[0] ?? 0) % maxExclusive;
}

function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function formatLocal(local: string, format: NumberFormat): string {
  if (format === "local") return local;
  if (format === "compact") return `255${local.slice(1)}`;
  return `+255${local.slice(1)}`;
}

function assertNetwork(networkSlug: string): NetworkDefinition {
  const network = getNetwork(networkSlug);
  if (!network || !network.generationEnabled) {
    throw new Error(`Network '${networkSlug}' is unavailable for generation.`);
  }
  return network;
}

export function generateNumbers(options: GenerateOptions): GeneratedNumber[] {
  if (!Number.isSafeInteger(options.quantity) || options.quantity < 1) {
    throw new Error("Quantity must be a positive integer.");
  }

  const network = assertNetwork(options.network);
  const prefixes = options.prefix ? [options.prefix] : [...network.prefixes];
  if (options.prefix && !network.prefixes.includes(options.prefix)) {
    throw new Error(`Prefix ${options.prefix} does not belong to ${network.brand}.`);
  }

  const maxPerPrefix = 10_000_000;
  if (options.quantity > maxPerPrefix * prefixes.length) {
    throw new Error("Requested quantity exceeds the unique namespace for the selected prefixes.");
  }

  const exclusion = options.exclude ?? new Set<string>();
  const seen = new Set<string>();
  const results: GeneratedNumber[] = [];
  const random = options.mode === "seeded" ? seededRandom(hashSeed(options.seed ?? "tz-number-toolkit")) : null;
  let sequence = Math.max(0, Math.trunc(options.startAt ?? 0));
  let attempts = 0;
  const maxAttempts = Math.max(options.quantity * 100, 10_000);

  while (results.length < options.quantity) {
    attempts += 1;
    if (attempts > maxAttempts) {
      throw new Error("Unable to satisfy uniqueness constraints. Try another prefix, seed or duplicate policy.");
    }

    let prefix: string;
    let subscriber: number;

    if (options.mode === "sequential") {
      const namespaceIndex = sequence;
      prefix = prefixes[Math.floor(namespaceIndex / maxPerPrefix) % prefixes.length] ?? prefixes[0]!;
      subscriber = namespaceIndex % maxPerPrefix;
      sequence += 1;
    } else if (options.mode === "seeded") {
      const pick = random!();
      prefix = prefixes[Math.floor(pick * prefixes.length)] ?? prefixes[0]!;
      subscriber = Math.floor(random!() * maxPerPrefix);
    } else {
      prefix = prefixes[secureInt(prefixes.length)] ?? prefixes[0]!;
      subscriber = secureInt(maxPerPrefix);
    }

    const local = `${prefix}${subscriber.toString().padStart(7, "0")}`;
    const normalized = `+255${local.slice(1)}`;
    if (seen.has(normalized) || exclusion.has(normalized)) continue;
    seen.add(normalized);

    results.push({
      value: formatLocal(local, options.format),
      normalized,
      local,
      prefix,
      network: network.slug as GeneratableNetworkSlug,
    });
  }

  return results;
}

export interface MixedGenerateOptions {
  quantity: number;
  format: NumberFormat;
  mode: GenerationMode;
  weights: Partial<Record<GeneratableNetworkSlug, number>>;
  seed?: string;
  exclude?: ReadonlySet<string>;
}

export function generateMixedNumbers(options: MixedGenerateOptions): GeneratedNumber[] {
  const networks = getGeneratableNetworks();
  const weighted = networks
    .map((network) => ({ network, weight: Math.max(0, options.weights[network.slug as GeneratableNetworkSlug] ?? 0) }))
    .filter((entry) => entry.weight > 0);

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) throw new Error("At least one mixed-network weight must be greater than zero.");

  const allocations = weighted.map((entry) => ({
    network: entry.network,
    exact: (options.quantity * entry.weight) / totalWeight,
    count: 0,
  }));

  let assigned = 0;
  for (const entry of allocations) {
    entry.count = Math.floor(entry.exact);
    assigned += entry.count;
  }
  allocations.sort((a, b) => (b.exact - b.count) - (a.exact - a.count));
  for (let i = assigned; i < options.quantity; i += 1) allocations[(i - assigned) % allocations.length]!.count += 1;

  const results: GeneratedNumber[] = [];
  const globalSeen = new Set<string>(options.exclude ?? []);
  for (const entry of allocations) {
    if (entry.count === 0) continue;
    const batch = generateNumbers({
      network: entry.network.slug as GeneratableNetworkSlug,
      quantity: entry.count,
      format: options.format,
      mode: options.mode,
      seed: options.seed ? `${options.seed}:${entry.network.slug}` : undefined,
      exclude: globalSeen,
    });
    for (const item of batch) globalSeen.add(item.normalized);
    results.push(...batch);
  }

  return results;
}
