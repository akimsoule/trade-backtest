import { describe, it, expect } from "vitest";
import { Action } from "indicatorts";
import { andStrategy } from "../src/strategy/combined";
import { makeAsset, makeConstStrategy as makeConst } from "./helpers";

describe("combined extra coverage", () => {
  it("andStrategy short SELL when all short SELL", () => {
    const n = 6;
    const asset = makeAsset(n);
    const s1 = makeConst(n, Action.HOLD, Action.SELL);
    const s2 = makeConst(n, Action.HOLD, Action.SELL);
    const c = andStrategy(asset, [s1, s2]);
    expect(c.shortStrategy.every((x) => x === Action.SELL)).toBe(true);
  });
});
