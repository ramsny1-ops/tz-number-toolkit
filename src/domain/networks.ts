export type NetworkSlug = "halotel" | "telxer" | "yas" | "airtel" | "vodacom" | "ttcl";
export type GeneratableNetworkSlug = Exclude<NetworkSlug, "telxer">;

export interface NetworkDefinition {
  slug: NetworkSlug;
  brand: string;
  operator: string;
  prefixes: readonly string[];
  operational: boolean;
  generationEnabled: boolean;
  legacyNames: readonly string[];
}

export const NETWORKS: readonly NetworkDefinition[] = Object.freeze([
  {
    slug: "halotel",
    brand: "Halotel",
    operator: "Viettel Tanzania PLC",
    prefixes: ["061", "062", "063"],
    operational: true,
    generationEnabled: true,
    legacyNames: [],
  },
  {
    slug: "telxer",
    brand: "Telxer",
    operator: "Telxer Enterprise Limited",
    prefixes: ["064"],
    operational: false,
    generationEnabled: false,
    legacyNames: [],
  },
  {
    slug: "yas",
    brand: "Yas",
    operator: "Honora Tanzania PLC",
    prefixes: ["065", "067", "070", "071", "077"],
    operational: true,
    generationEnabled: true,
    legacyNames: ["Tigo"],
  },
  {
    slug: "airtel",
    brand: "Airtel",
    operator: "Airtel Tanzania PLC",
    prefixes: ["066", "068", "069", "078"],
    operational: true,
    generationEnabled: true,
    legacyNames: [],
  },
  {
    slug: "vodacom",
    brand: "Vodacom",
    operator: "Vodacom Tanzania PLC",
    prefixes: ["072", "074", "075", "076", "079"],
    operational: true,
    generationEnabled: true,
    legacyNames: [],
  },
  {
    slug: "ttcl",
    brand: "TTCL",
    operator: "Tanzania Telecommunications Corporation",
    prefixes: ["073"],
    operational: true,
    generationEnabled: true,
    legacyNames: [],
  },
]);

const bySlug = new Map(NETWORKS.map((network) => [network.slug, network] as const));
const byPrefix = new Map<string, NetworkDefinition>();
for (const network of NETWORKS) {
  for (const prefix of network.prefixes) byPrefix.set(prefix, network);
}

export function getNetwork(slug: string): NetworkDefinition | undefined {
  const normalized = slug.trim().toLowerCase();
  if (normalized === "tigo") return bySlug.get("yas");
  return bySlug.get(normalized as NetworkSlug);
}

export function getNetworkByPrefix(prefix: string): NetworkDefinition | undefined {
  return byPrefix.get(prefix);
}

export function getGeneratableNetworks(): NetworkDefinition[] {
  return NETWORKS.filter((network) => network.generationEnabled);
}
