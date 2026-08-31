import { getNetworkByPrefix, type NetworkDefinition } from "./networks.ts";

export interface PhoneInspection {
  input: string;
  sanitized: string;
  valid: boolean;
  reason: string | null;
  local: string | null;
  international: string | null;
  compactInternational: string | null;
  nationalSignificantNumber: string | null;
  prefix: string | null;
  subscriberNumber: string | null;
  allocationNetwork: NetworkDefinition | null;
  portabilityNotice: string;
}

const PORTABILITY_NOTICE =
  "Prefix detection identifies the original numbering allocation. Mobile Number Portability means the current carrier may differ.";

export function sanitizePhoneInput(input: string): string {
  return input.trim().replace(/[\s().-]/g, "");
}

export function toLocalCandidate(input: string): string | null {
  const value = sanitizePhoneInput(input);
  if (/^0\d{9}$/.test(value)) return value;
  if (/^\+255\d{9}$/.test(value)) return `0${value.slice(4)}`;
  if (/^255\d{9}$/.test(value)) return `0${value.slice(3)}`;
  if (/^[67]\d{8}$/.test(value)) return `0${value}`;
  return null;
}

export function inspectPhoneNumber(input: string): PhoneInspection {
  const sanitized = sanitizePhoneInput(input);
  const local = toLocalCandidate(input);

  if (!local) {
    return {
      input,
      sanitized,
      valid: false,
      reason: "Expected a Tanzanian mobile number in local or +255 format.",
      local: null,
      international: null,
      compactInternational: null,
      nationalSignificantNumber: null,
      prefix: null,
      subscriberNumber: null,
      allocationNetwork: null,
      portabilityNotice: PORTABILITY_NOTICE,
    };
  }

  const prefix = local.slice(0, 3);
  const network = getNetworkByPrefix(prefix) ?? null;
  if (!network) {
    return {
      input,
      sanitized,
      valid: false,
      reason: `Prefix ${prefix} is not present in this project's Tanzanian mobile allocation registry.`,
      local,
      international: `+255${local.slice(1)}`,
      compactInternational: `255${local.slice(1)}`,
      nationalSignificantNumber: local.slice(1),
      prefix,
      subscriberNumber: local.slice(3),
      allocationNetwork: null,
      portabilityNotice: PORTABILITY_NOTICE,
    };
  }

  return {
    input,
    sanitized,
    valid: true,
    reason: null,
    local,
    international: `+255${local.slice(1)}`,
    compactInternational: `255${local.slice(1)}`,
    nationalSignificantNumber: local.slice(1),
    prefix,
    subscriberNumber: local.slice(3),
    allocationNetwork: network,
    portabilityNotice: PORTABILITY_NOTICE,
  };
}

export function normalizePhoneNumber(input: string): string | null {
  const result = inspectPhoneNumber(input);
  return result.valid ? result.international : null;
}
