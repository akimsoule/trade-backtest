import { describe, it, expect } from "vitest";
import { Action } from "indicatorts";
import {
  tripleEmaStrategy,
  macdRsiStrategy,
} from "../src/strategy/basic";
import { andStrategy, orStrategy, andEntryExitStrategy } from "../src/strategy/combined";
import { makeConstStrategy as makeConst } from "./helpers";
const makeAsset = (closings: number[]) => ({ closings } as any);

describe("strategy extra coverage", () => {
  it("tripleEmaStrategy triggers bearish alignment SELL", () => {
    // Strongly decreasing series to force bearish alignment transitions
    const closings = Array.from({ length: 120 }, (_, i) => 200 - i * 0.8);
    const asset = makeAsset(closings);
    const s = tripleEmaStrategy(asset, 5, 10, 20);
    const sells = s.longStrategy.filter((x) => x === Action.SELL).length;
    expect(sells).toBeGreaterThan(0);
  });

  it("macdRsiStrategy triggers bearish case (cross down + RSI>70)", () => {
    const n = 40;
    const macdLine = new Array(n).fill(0);
    const signalLine = new Array(n).fill(0);
    // Create a cross-down at index 15
    macdLine[14] = 0.2; signalLine[14] = 0.1; // i-1 above
    macdLine[15] = 0.0; signalLine[15] = 0.1; // i below -> cross down
    const rsiArr = new Array(n).fill(50);
    rsiArr[15] = 80; // Overbought to validate bearish combo
    const closings = Array.from({ length: n }, (_, i) => 100 + Math.sin(i / 2));
    const asset = makeAsset(closings);
    const s = macdRsiStrategy(
      asset,
      { macdLine, signalLine, histogram: new Array(n).fill(0) } as any,
      rsiArr
    );
    expect(s.longStrategy.some((x) => x === Action.SELL)).toBe(true);
  });

  it("andStrategy yields HOLD when no consensus", () => {
    const n = 6;
    const asset = makeAsset(new Array(n).fill(100));
    const s1 = makeConst(n, Action.BUY, Action.BUY);
    const s2 = makeConst(n, Action.SELL, Action.SELL);
    const c = andStrategy(asset, [s1, s2]);
    expect(c.longStrategy.every((x) => x === Action.HOLD)).toBe(true);
    expect(c.shortStrategy.every((x) => x === Action.HOLD)).toBe(true);
  });

  it("orStrategy short SELL when any short SELL and no short BUY", () => {
    const n = 5;
    const asset = makeAsset(new Array(n).fill(100));
    const s1 = makeConst(n, Action.HOLD, Action.SELL);
    const s2 = makeConst(n, Action.HOLD, Action.HOLD);
    const c = orStrategy(asset, [s1, s2]);
    expect(c.shortStrategy.every((x) => x === Action.SELL)).toBe(true);
  });

  it("andEntryExitStrategy SELL branches for long and short", () => {
    const n = 4;
    const asset = makeAsset(new Array(n).fill(100));
    const entry = makeConst(n, Action.HOLD, Action.HOLD);
    const exit = makeConst(n, Action.SELL, Action.SELL);
    const c = andEntryExitStrategy(asset, entry, exit);
    expect(c.longStrategy.every((x) => x === Action.SELL || x === Action.HOLD)).toBe(true);
    expect(c.shortStrategy.every((x) => x === Action.SELL || x === Action.HOLD)).toBe(true);
    // Ensure at least one SELL actually present to execute those lines
    expect(c.longStrategy.some((x) => x === Action.SELL)).toBe(true);
    expect(c.shortStrategy.some((x) => x === Action.SELL)).toBe(true);
  });
});
