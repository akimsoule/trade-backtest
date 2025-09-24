import { describe, it, expect } from "vitest";
import { TradingEngine } from "../src/engine/tradingEngine";
import { MixHoldSideEnum, OrderSideEnum } from "../src/types";
import { makeOrder } from "./helpers";

describe("TradingEngine", () => {
  it("builds positions and computes portfolio stats", () => {
    const now = new Date(2020, 0, 1);
    const eng = new TradingEngine([], 10);
    eng.addOrder(makeOrder({ id: "1", side: OrderSideEnum.BUY, posSide: MixHoldSideEnum.LONG, size: 1, priceAvg: 100, createdAt: now }));
    eng.addOrder(makeOrder({ id: "2", side: OrderSideEnum.BUY, posSide: MixHoldSideEnum.LONG, size: 1, priceAvg: 110, createdAt: new Date(now.getTime() + 1) }));
    const pos = eng.getPosition("BTCUSDT", MixHoldSideEnum.LONG, 120);
    expect(pos).not.toBeNull();
    expect(pos!.size).toBe(2);
    expect(pos!.entryPrice).toBeCloseTo(105);
    const stats = eng.getPortfolioStats({ BTCUSDT: 120 });
    expect(stats.countPositions).toBe(1);
    expect(stats.totalNotional).toBeCloseTo(240);
  });

  it("computes realized PnL and closed trades", () => {
    const now = new Date(2020, 0, 1);
    const eng = new TradingEngine([], 10);
    eng.addOrder(makeOrder({ id: "1", side: OrderSideEnum.BUY, posSide: MixHoldSideEnum.LONG, size: 1, priceAvg: 100, createdAt: now }));
    eng.addOrder(makeOrder({ id: "2", side: OrderSideEnum.SELL, posSide: MixHoldSideEnum.LONG, size: 1, priceAvg: 120, fee: 0.1, createdAt: new Date(now.getTime() + 2) }));
    const realized = eng.getRealizedPnLStats();
    expect(realized.tradeCount).toBe(1);
    expect(realized.totalRealizedPnL).toBeCloseTo(19.9, 1);
    const closed = eng.getClosedTrades();
    expect(closed.length).toBe(1);
    expect(closed[0].size).toBe(1);
  });

  it("handles partial then full close and cleans openedAt", () => {
    const now = new Date(2020, 0, 1);
    const eng = new TradingEngine([], 5);
    // Open 2 units long
    eng.addOrder(makeOrder({ id: "o1", side: OrderSideEnum.BUY, posSide: MixHoldSideEnum.LONG, size: 2, priceAvg: 100, createdAt: now }));
    // Partial close 1
    eng.addOrder(makeOrder({ id: "o2", side: OrderSideEnum.SELL, posSide: MixHoldSideEnum.LONG, size: 1, priceAvg: 105, createdAt: new Date(now.getTime() + 1) }));
    // Build positions (should still be opened)
    let positions = eng.rebuildAllPositions({ BTCUSDT: 106 });
    expect(positions.length).toBe(1);
    expect(positions[0].size).toBeCloseTo(1);
    expect(positions[0].openedAt).toBeInstanceOf(Date);
    // Full close remaining 1
    eng.addOrder(makeOrder({ id: "o3", side: OrderSideEnum.SELL, posSide: MixHoldSideEnum.LONG, size: 1, priceAvg: 110, createdAt: new Date(now.getTime() + 2) }));
    positions = eng.rebuildAllPositions({ BTCUSDT: 110 });
    expect(positions.length).toBe(0); // deletion of openedAt path executed while collapsing
  });

  it("supports SHORT positions and liquidation equity <= 0", () => {
    const now = new Date(2020, 0, 1);
    // Large fee to force equity <= 0
    const eng = new TradingEngine([], 1);
    eng.addOrder(makeOrder({ id: "s1", symbol: "ETHUSDT", side: OrderSideEnum.SELL, posSide: MixHoldSideEnum.SHORT, size: 1, priceAvg: 200, fee: 300, createdAt: now }));
    const pos = eng.getPosition("ETHUSDT", MixHoldSideEnum.SHORT, 200);
    expect(pos).not.toBeNull();
    expect(pos!.openSide).toBe(OrderSideEnum.SELL);
    // With fee > margin (200), liquidationPrice should be 0 (equity <= 0 branch)
    expect(pos!.liquidationPrice).toBe(0);
  });
});
