import { describe, it, expect } from "vitest";
import { macdMomentumDcaStrategy } from "../src/strategy/macdMomentumDca";
import { Action } from "indicatorts";

const makeTrendingAsset = (n = 100, slope = 0.5) => {
  const closings = Array.from({ length: n }, (_, i) => 100 + i * slope);
  return { closings } as any;
};

describe("macdMomentumDcaStrategy", () => {
  it("returns same length as asset", () => {
    const asset = makeTrendingAsset(120, 0.4);
    const s = macdMomentumDcaStrategy(asset, { allowShort: true });
    expect(s.length).toBe(asset.closings.length);
  });

  it("does not emit short BUY when allowShort=false", () => {
    const asset = makeTrendingAsset(150, 0.2);
    const s = macdMomentumDcaStrategy(asset, { allowShort: false });
    const shortBuys = s.shortStrategy.filter((a) => a === Action.BUY).length;
    expect(shortBuys).toBe(0);
  });
});
