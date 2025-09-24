import { describe, it, expect } from "vitest";
import { Action } from "indicatorts";
import { roiStrategy } from "../src/strategy/basic";

const makeAsset = (closings: number[]) => ({ closings } as any);

const makeBaseStrategy = (n: number, entryIndex: number, side: "long" | "short") => ({
  longStrategy: Array.from({ length: n }, (_, i) => (side === "long" && i === entryIndex ? Action.BUY : Action.HOLD)),
  shortStrategy: Array.from({ length: n }, (_, i) => (side === "short" && i === entryIndex ? Action.BUY : Action.HOLD)),
  length: n,
});

describe("roiStrategy", () => {
  it("closes when ROI reaches target", () => {
    // Entrée long à i=1 à 100, puis monte à 106 => ROI 6% >= 5% => SELL
    const prices = [100, 100, 106];
    const asset = makeAsset(prices);
    const base = makeBaseStrategy(prices.length, 1, "long");
    const s = roiStrategy(asset, base, 5, -25);
    expect(s.longStrategy[2]).toBe(Action.SELL);
  });

  it("DCA when ROI under threshold", () => {
    // Entrée long à i=1 à 100, puis chute à 70 => ROI -30% <= -25% => BUY (DCA)
    const prices = [100, 100, 70];
    const asset = makeAsset(prices);
    const base = makeBaseStrategy(prices.length, 1, "long");
    const s = roiStrategy(asset, base, 5, -25);
    expect(s.longStrategy[2]).toBe(Action.BUY);
  });

  it("handles short side with ROI logic", () => {
    // Entrée short à i=1 à 100, baisse à 94 => ROI 6% => SELL côté short
    const prices = [100, 100, 94];
    const asset = makeAsset(prices);
    const base = makeBaseStrategy(prices.length, 1, "short");
    const s = roiStrategy(asset, base, 5, -25);
    expect(s.shortStrategy[2]).toBe(Action.SELL);
  });
});
