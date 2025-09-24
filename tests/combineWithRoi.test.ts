import { describe, it, expect } from "vitest";
import { Action } from "indicatorts";
import { combineWithRoi } from "../src/strategy/combineWithRoi";

const makeAsset = (closings: number[]) => ({ closings } as any);

const mkStrat = (n: number, idx: number, side: "long" | "short") => ({
  longStrategy: Array.from({ length: n }, (_, i) => (side === "long" && i === idx ? Action.BUY : Action.HOLD)),
  shortStrategy: Array.from({ length: n }, (_, i) => (side === "short" && i === idx ? Action.BUY : Action.HOLD)),
  length: n,
});

describe("combineWithRoi", () => {
  it("OR combines entries and applies ROI SELL", () => {
    const prices = [100, 100, 106];
    const asset = makeAsset(prices);
    const s1 = mkStrat(prices.length, 1, "long");
    const s2 = mkStrat(prices.length, 0, "short");
    const s = combineWithRoi(asset, [s1, s2], { op: "OR", targetRoi: 5, dcaThreshold: -25 });
    expect(s.longStrategy[2]).toBe(Action.SELL);
  });

  it("AND requires both to enter", () => {
    const prices = [100, 100, 106];
    const asset = makeAsset(prices);
    const s1 = mkStrat(prices.length, 1, "long");
    const s2 = mkStrat(prices.length, 1, "long");
    const s = combineWithRoi(asset, [s1, s2], { op: "AND", targetRoi: 5, dcaThreshold: -25 });
    expect(s.length).toBe(prices.length);
    expect(s.longStrategy[1]).toBe(Action.BUY);
    expect(s.longStrategy[2]).toBe(Action.SELL);
  });
});
