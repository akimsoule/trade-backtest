import { describe, it, expect } from "vitest";
import { TradingEngine } from "../src/engine/tradingEngine";
import { BackTest } from "../src/backtest";
import { MixHoldSideEnum, OrderSideEnum, type Order } from "../src/types";

// Tests ciblés pour couvrir des branches/lines manquantes

describe("Coverage edge cases", () => {
  it("BackTest.run() jette si data manquante", () => {
    const bt = new BackTest({ initialCapital: 1000 });
    bt.addStrategy(() => ({ longStrategy: [0], shortStrategy: [0], length: 1 }));
    expect(() => bt.run()).toThrowError();
  });

  it("BackTest.run() jette si stratégie manquante", () => {
    const bt = new BackTest({ initialCapital: 1000 });
    // data présente mais pas de stratégie
    // @ts-expect-error on n'a pas besoin de tous les champs pour ce test
    bt.setData([{ symbol: "BTCUSDT", timestamp: new Date(), close: 100 }]);
    expect(() => bt.run()).toThrowError();
  });

  it("LiquidationPrice retourne 0 si equity <= 0 (frais > marge)", () => {
    const eng = new TradingEngine([], 1_000_000); // levier énorme => marge très faible
    const now = new Date(2020, 0, 1);
    // Ordre d'ouverture avec frais élevés via cast pour couvrir l'équité négative
    const badFeeOpen: Order = {
      id: "o1",
      symbol: "BTCUSDT",
      side: OrderSideEnum.BUY,
      posSide: MixHoldSideEnum.LONG,
      size: 1,
      priceAvg: 100,
      fee: 10, // frais qui dépasseront la marge
      createdAt: now,
    };
    eng.addOrder(badFeeOpen);
    const pos = eng.getPosition("BTCUSDT", MixHoldSideEnum.LONG, 100);
    expect(pos).not.toBeNull();
    // marge ~ notional/leverage = 100/1_000_000 = 0.0001 < fees=10 => liquidationPrice 0
    expect(pos!.liquidationPrice).toBe(0);
  });

  it("buildPositions: branches else pour lastOrderId/openedAt (undefined)", () => {
    const eng = new TradingEngine([], 10);
    // Forcer id et createdAt undefined pour couvrir les spreads conditionnels
    const open = {
      id: undefined,
      symbol: "ETHUSDT",
      side: OrderSideEnum.BUY,
      posSide: MixHoldSideEnum.LONG,
      size: 1,
      priceAvg: 100,
      fee: 0,
      createdAt: undefined,
    } as unknown as Order;
    eng.addOrder(open);
    const stats = eng.getPortfolioStats({ ETHUSDT: 120 });
    expect(stats.positions.length).toBe(1);
    const p = stats.positions[0] as any;
    // lastOrderId et openedAt ne doivent pas être présents
    expect("lastOrderId" in p).toBe(false);
    expect("openedAt" in p).toBe(false);
  });

  it("Compte les shorts dans getPortfolioStats", () => {
    const eng = new TradingEngine([], 10);
    const now = new Date(2020, 0, 1);
    eng.addOrder({
      id: "s1",
      symbol: "ADAUSDT",
      side: OrderSideEnum.SELL,
      posSide: MixHoldSideEnum.SHORT,
      size: 2,
      priceAvg: 10,
      fee: 0,
      createdAt: now,
    });
    const stats = eng.getPortfolioStats({ ADAUSDT: 9 });
    expect(stats.shortCount).toBeGreaterThanOrEqual(1);
  });
});
