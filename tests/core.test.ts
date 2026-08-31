import { describe, expect, test } from "bun:test";
import { analyzeNumbers } from "../src/domain/analyzer.ts";
import { generateNumbers } from "../src/domain/generator.ts";
import { inspectPhoneNumber, normalizePhoneNumber } from "../src/domain/phone.ts";


describe("Tanzania phone inspection", () => {
  test("detects Airtel 068", () => {
    const result = inspectPhoneNumber("0689123456");
    expect(result.valid).toBe(true);
    expect(result.prefix).toBe("068");
    expect(result.allocationNetwork?.slug).toBe("airtel");
    expect(result.international).toBe("+255689123456");
  });

  test("maps legacy Tigo prefix allocation to Yas", () => {
    const result = inspectPhoneNumber("0712345678");
    expect(result.allocationNetwork?.slug).toBe("yas");
  });

  test("accepts international formatting", () => {
    expect(normalizePhoneNumber("+255 73 492 8123")).toBe("+255734928123");
  });

  test("rejects malformed length", () => {
    expect(inspectPhoneNumber("068123").valid).toBe(false);
  });
});

describe("Generator", () => {
  test("generates requested unique Airtel quantity", () => {
    const values = generateNumbers({ network:"airtel", quantity:200, format:"international", mode:"random" });
    expect(values).toHaveLength(200);
    expect(new Set(values.map((item) => item.normalized)).size).toBe(200);
    expect(values.every((item) => ["066","068","069","078"].includes(item.prefix))).toBe(true);
  });

  test("seeded generation is reproducible", () => {
    const a = generateNumbers({ network:"vodacom", quantity:20, format:"local", mode:"seeded", seed:"same-seed" });
    const b = generateNumbers({ network:"vodacom", quantity:20, format:"local", mode:"seeded", seed:"same-seed" });
    expect(a.map((x) => x.value)).toEqual(b.map((x) => x.value));
  });

  test("sequential generation stays valid", () => {
    const values = generateNumbers({ network:"ttcl", quantity:5, format:"local", mode:"sequential", startAt:42 });
    expect(values.map((x) => x.value)).toEqual(["0730000042","0730000043","0730000044","0730000045","0730000046"]);
  });
});

describe("Bulk analyzer", () => {
  test("summarizes network allocations", () => {
    const summary = analyzeNumbers(["0689123456", "0712345678", "0734928123", "123"]);
    expect(summary.total).toBe(4);
    expect(summary.valid).toBe(3);
    expect(summary.invalid).toBe(1);
    expect(summary.byNetwork.airtel).toBe(1);
    expect(summary.byNetwork.yas).toBe(1);
    expect(summary.byNetwork.ttcl).toBe(1);
  });
});
