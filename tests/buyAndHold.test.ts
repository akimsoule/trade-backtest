import { describe, it, expect } from "vitest";
import { Action } from "indicatorts";
import { buyAndHoldStrategy } from "../src/strategy/basic";

describe("buyAndHoldStrategy", () => {
  it("buys at startIndex and sells at the end", () => {
    const asset = { closings: [100, 101, 102] } as any;
    const s = buyAndHoldStrategy(asset, 1, true);
    expect(s.length).toBe(3);
    expect(s.longStrategy[1]).toBe(Action.BUY);
    expect(s.longStrategy[2]).toBe(Action.SELL);
  });

  it("does not sell at end when exitAtEnd=false", () => {
    const asset = { closings: [100, 101, 102, 103] } as any;
    const s = buyAndHoldStrategy(asset, 0, false);
    expect(s.longStrategy[0]).toBe(Action.BUY);
    const sells = s.longStrategy.filter((x) => x === Action.SELL).length;
    expect(sells).toBe(0);
  });
});
