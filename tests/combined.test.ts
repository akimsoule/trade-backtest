import { describe, it, expect } from "vitest";
import { Action } from "indicatorts";
import { andStrategy, orStrategy, andEntryExitStrategy } from "../src/strategy/combined";
import { makeAsset, makeConstStrategy as makeConst } from "./helpers";

describe("strategy/combined", () => {
  it("andStrategy", () => {
    const asset = makeAsset(10);
    const s1 = makeConst(10, Action.BUY, Action.HOLD);
    const s2 = makeConst(10, Action.BUY, Action.SELL);
    const c = andStrategy(asset, [s1, s2]);
    expect(c.longStrategy.every((x) => x === Action.BUY)).toBe(true);
    expect(c.shortStrategy.every((x) => x === Action.HOLD)).toBe(true);
  });

  it("orStrategy", () => {
    const asset = makeAsset(10);
    const s1 = makeConst(10, Action.SELL, Action.HOLD);
    const s2 = makeConst(10, Action.HOLD, Action.BUY);
    const c = orStrategy(asset, [s1, s2]);
    expect(c.longStrategy.every((x) => x === Action.SELL)).toBe(true);
    expect(c.shortStrategy.every((x) => x === Action.BUY)).toBe(true);
  });

  it("orStrategy prioritizes BUY over SELL when both present", () => {
    const asset = makeAsset(5);
    const s1 = makeConst(5, Action.BUY, Action.SELL);
    const s2 = makeConst(5, Action.SELL, Action.BUY);
    const c = orStrategy(asset, [s1, s2]);
    expect(c.longStrategy.every((x) => x === Action.BUY)).toBe(true);
    expect(c.shortStrategy.every((x) => x === Action.BUY)).toBe(true);
  });

  it("andEntryExitStrategy", () => {
    const asset = makeAsset(10);
    const entry = makeConst(10, Action.BUY, Action.BUY);
    const exit = makeConst(10, Action.SELL, Action.SELL);
    const c = andEntryExitStrategy(asset, entry, exit);
    expect(c.longStrategy.every((x) => x === Action.BUY || x === Action.SELL || x === Action.HOLD)).toBe(true);
  });
  it("andEntryExitStrategy HOLD when no entry/exit", () => {
    const asset = makeAsset(8);
    const entry = makeConst(8, Action.HOLD, Action.HOLD);
    const exit = makeConst(8, Action.HOLD, Action.HOLD);
    const c = andEntryExitStrategy(asset, entry, exit);
    expect(c.longStrategy.every((x) => x === Action.HOLD)).toBe(true);
    expect(c.shortStrategy.every((x) => x === Action.HOLD)).toBe(true);
  });

  it("andStrategy covers SELL and short BUY branches", () => {
    const asset = makeAsset(5);
    const s1 = makeConst(5, Action.SELL, Action.BUY);
    const s2 = makeConst(5, Action.SELL, Action.BUY);
    const c = andStrategy(asset, [s1, s2]);
    expect(c.longStrategy.every((x) => x === Action.SELL)).toBe(true);
    expect(c.shortStrategy.every((x) => x === Action.BUY)).toBe(true);
  });

  it("orStrategy HOLD when no signals", () => {
    const asset = makeAsset(7);
    const s1 = makeConst(7, Action.HOLD, Action.HOLD);
    const s2 = makeConst(7, Action.HOLD, Action.HOLD);
    const c = orStrategy(asset, [s1, s2]);
    expect(c.longStrategy.every((x) => x === Action.HOLD)).toBe(true);
    expect(c.shortStrategy.every((x) => x === Action.HOLD)).toBe(true);
  });
});
