import { describe, it, expect } from "vitest";
import { adaptiveStrategy } from "../src/strategy/adaptive";
import { analyzeMarket } from "../src/strategy/analysis";
import { makeTrendingAsset, makeRangingAsset, makeVolatileBearishAsset } from "./helpers";

describe("strategy/adaptive", () => {
  it("adapts on trending market", () => {
    const asset = makeTrendingAsset(150, 0.7);
    const analysis = analyzeMarket(asset);
    const s = adaptiveStrategy(asset);
    expect(s.length).toBe(asset.closings.length);
    expect(["TRENDING", "RANGING", "VOLATILE"]).toContain(analysis.condition);
  });

  it("adapts on ranging market", () => {
    const asset = makeRangingAsset(150, 1.5);
    const s = adaptiveStrategy(asset);
    expect(s.length).toBe(asset.closings.length);
  });

  it("adapts on volatile market", () => {
    const asset = makeVolatileBearishAsset(150);
    const s = adaptiveStrategy(asset);
    expect(s.length).toBe(asset.closings.length);
  });
});
