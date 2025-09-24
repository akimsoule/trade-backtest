import { describe, it, expect, vi } from "vitest";

// Mock de l'analyse pour forcer une condition inconnue et déclencher le default
vi.mock("../src/strategy/analysis", () => ({
  analyzeMarket: (_asset: any, _period?: number, _i?: number) => ({
    volatility: 0,
    trendStrength: 0,
    condition: "UNKNOWN",
  }),
}));

import { adaptiveStrategy } from "../src/strategy/adaptive";

describe("adaptiveStrategy default branch", () => {
  it("uses default envStrategy when condition is unknown", () => {
    const closings = new Array(60).fill(100).map((v, i) => v + Math.sin(i / 5));
    const asset = { closings } as any;
    const s = adaptiveStrategy(asset);
    expect(s.length).toBe(closings.length);
  });
});
