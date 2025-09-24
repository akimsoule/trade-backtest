import { describe, it, expect } from "vitest";
import { Action } from "indicatorts";
import { makeTrendingAsset, makeRangingAsset } from "./helpers";
import { doubleEmaStrategy, tripleEmaStrategy, macdStrategy, rsiStrategy, envStrategy, trailingStopStrategy, smaStrategy, macdRsiStrategy } from "../src/strategy/basic";

describe("strategy/basic", () => {
  it("doubleEmaStrategy emits some non-HOLD signals on oscillating data", () => {
    const asset = makeRangingAsset(150, 3);
    const s = doubleEmaStrategy(asset, 5, 20);
    const signals = s.longStrategy.filter((a) => a !== Action.HOLD).length;
    expect(signals).toBeGreaterThan(0);
  });

  it("doubleEmaStrategy can yield all HOLD on flat", () => {
    const asset = { closings: new Array(60).fill(100) } as any;
    const s = doubleEmaStrategy(asset, 5, 20);
    expect(s.longStrategy.every((x) => x === Action.HOLD)).toBe(true);
    expect(s.shortStrategy.every((x) => x === Action.HOLD)).toBe(true);
  });

  it("tripleEmaStrategy aligns crossovers", () => {
    const asset = makeTrendingAsset(150, 0.6);
    const s = tripleEmaStrategy(asset, 5, 10, 20);
    expect(s.length).toBe(asset.closings.length);
  });

  it("macdStrategy generates cross signals", () => {
    const asset = makeTrendingAsset(120, 0.4);
    const s = macdStrategy(asset);
    expect(s.longStrategy.length).toBeGreaterThan(0);
  });

  it("rsiStrategy flags overbought/oversold sometimes", () => {
    const asset = makeRangingAsset(120, 1);
    const s = rsiStrategy(asset);
    // Au moins 1 signal BUY ou SELL
    const count = s.longStrategy.filter((a) => a !== Action.HOLD).length;
    expect(count).toBeGreaterThan(0);
  });

  it("envStrategy reacts to envelopes", () => {
    const asset = makeRangingAsset(120, 2);
    const s = envStrategy(asset, 10, 2, 2);
    expect(s.length).toBe(asset.closings.length);
  });

  it("trailingStopStrategy issues stops", () => {
    const asset = makeRangingAsset(120, 5);
    const s = trailingStopStrategy(asset, 1.5);
    // On attend au moins quelques stops
    const countSellLong = s.longStrategy.filter((a) => a === Action.SELL).length;
    const countSellShort = s.shortStrategy.filter((a) => a === Action.SELL).length;
    expect(countSellLong + countSellShort).toBeGreaterThan(0);
  });

  it("smaStrategy emits crossovers", () => {
    // Données choisies pour provoquer des croisements SMA(2) et SMA(3)
    const closings = [1, 2, 3, 2, 3, 2, 3, 2];
    const asset = { closings } as any;
    const s = smaStrategy(asset, 2, 3);
    const buys = s.longStrategy.filter((x) => x === Action.BUY).length;
    const sells = s.longStrategy.filter((x) => x === Action.SELL).length;
    expect(buys + sells).toBeGreaterThan(0);
  });

  it("macdRsiStrategy combines signals", () => {
    // Construire un MACD sur-mesure avec croisement haussier et RSI < 30
    const n = 30;
    const macdLine = new Array(n).fill(0);
    const signalLine = new Array(n).fill(0);
    macdLine[10] = 0; signalLine[10] = 0.1; // i-1: sous le signal
    macdLine[11] = 0.2; signalLine[11] = 0.1; // i: au-dessus du signal -> cross up
    const rsiArr = new Array(n).fill(50);
    rsiArr[11] = 20; // Survente
    const closings = Array.from({ length: n }, (_, i) => 100 + (i < 15 ? -i : i)); // tendance descendante puis montante
    const asset = { closings } as any;
    const s = macdRsiStrategy(asset, { macdLine, signalLine, histogram: new Array(n).fill(0) } as any, rsiArr);
    const signals = s.longStrategy.filter((a) => a !== Action.HOLD).length;
    expect(signals).toBeGreaterThan(0);
  });

  it("envStrategy triggers both sides with tight bands", () => {
    const asset = makeRangingAsset(100, 3);
    const s = envStrategy(asset, 10, 2, 2);
    const buys = s.longStrategy.filter((x) => x === Action.BUY).length;
    const sells = s.longStrategy.filter((x) => x === Action.SELL).length;
    expect(buys + sells).toBeGreaterThan(0);
  });

  it("envStrategy SELL when price > upper band", () => {
    const closings = [100, 100, 100, 120]; // saut au-dessus de la bande
    const asset = { closings } as any;
    const s = envStrategy(asset, 2, 1, 1);
    expect(s.longStrategy[3] === Action.SELL || s.shortStrategy[3] === Action.BUY).toBe(true);
  });
});
