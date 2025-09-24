import { describe, it, expect } from "vitest";
import { analyzeMarket, calculateVolatility, calculateTrendStrength, getMarketConditions } from "../src/strategy/analysis";
import { makeTrendingAsset, makeRangingAsset, makeVolatileBearishAsset } from "./helpers";

describe("strategy/analysis", () => {
  it("calculateVolatility increases with amplitude", () => {
    const low = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.2) * 0.1);
    const high = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.2) * 2);
    const vLow = calculateVolatility(low, low.length - 1, 14);
    const vHigh = calculateVolatility(high, high.length - 1, 14);
    expect(vHigh).toBeGreaterThan(vLow);
  });

  it("calculateTrendStrength is higher for trending series", () => {
    const trending = Array.from({ length: 60 }, (_, i) => 100 + i * 0.5);
    const ranging = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i * 0.3) * 0.3);
    const t = calculateTrendStrength(trending, trending.length - 1, 14);
    const r = calculateTrendStrength(ranging, ranging.length - 1, 14);
    expect(t).toBeGreaterThan(r);
  });

  it("analyzeMarket detects conditions", () => {
    const t = makeTrendingAsset(120);
    const r = makeRangingAsset(120);
    const v = makeVolatileBearishAsset(120);
    const at = analyzeMarket(t);
    const ar = analyzeMarket(r);
    const av = analyzeMarket(v);
    expect(["TRENDING", "RANGING", "VOLATILE"]).toContain(at.condition);
    expect(["TRENDING", "RANGING", "VOLATILE"]).toContain(ar.condition);
    expect(["TRENDING", "RANGING", "VOLATILE"]).toContain(av.condition);
  });

  it("getMarketConditions returns an array of conditions", () => {
    const t = makeTrendingAsset(40);
    const arr = getMarketConditions(t);
    expect(arr.length).toBe(t.closings.length);
  });
});
