import { describe, it, expect } from "vitest";
import { TradingEngine } from "../src/engine/tradingEngine";
import { MixHoldSideEnum, OrderSideEnum } from "../src/types";
import { makeOrder } from "./helpers";

describe("TradingEngine extra coverage", () => {
  it("omits lastOrderId when non-string id (optional spread else branch)", () => {
    const eng = new TradingEngine([], 10);
    const now = new Date(2020, 0, 1);
    // Intentionally break the type of id to trigger the else branch of the spread
    const badIdOrder: any = {
      id: 123, // not a string on purpose
      symbol: "XBTUSDT",
      side: OrderSideEnum.BUY,
      posSide: MixHoldSideEnum.LONG,
      size: 1,
      priceAvg: 100,
      fee: 0,
      createdAt: now,
    };
    eng.addOrder(badIdOrder as any);
    const pos = eng.getPosition("XBTUSDT", MixHoldSideEnum.LONG, 110);
    expect(pos).not.toBeNull();
    // lastOrderId should not be present because typeof acc.lastOrderId !== 'string'
    expect("lastOrderId" in (pos as any)).toBe(false);
    // openedAt should still be provided
    expect(pos!.openedAt).toBeInstanceOf(Date);
  });

  it("counts a losing trade (lossCount++)", () => {
    const eng = new TradingEngine([], 5);
    const t0 = new Date(2020, 0, 1);
    eng.addOrder(makeOrder({ id: "o1", symbol: "LTCUSDT", side: OrderSideEnum.BUY, posSide: MixHoldSideEnum.LONG, size: 1, priceAvg: 100, createdAt: t0 }));
    eng.addOrder(makeOrder({ id: "o2", symbol: "LTCUSDT", side: OrderSideEnum.SELL, posSide: MixHoldSideEnum.LONG, size: 1, priceAvg: 90, fee: 0.1, createdAt: new Date(t0.getTime() + 1) }));
    const realized = eng.getRealizedPnLStats();
    expect(realized.tradeCount).toBe(1);
    expect(realized.winCount).toBe(0);
    expect(realized.lossCount).toBe(1); // ensures the else-if (roundPnL < 0) branch executes
    expect(realized.totalRealizedPnL).toBeLessThan(0);
    // best and worst should both be the same negative value for a single losing trade
    expect(realized.best).toBeCloseTo(realized.worst, 10);
  });
});
