import { TradingEngine } from "../engine/tradingEngine";
import { MixHoldSideEnum, OrderSideEnum, type Order } from "../types";

// Petit quickstart: 2 BUY puis 1 SELL clôture totale
const eng = new TradingEngine([], 10);
const now = new Date(2020, 0, 1);

const o = (p: Partial<Order> & { id: string }): Order => ({
  id: p.id,
  symbol: p.symbol ?? "BTCUSDT",
  side: p.side ?? OrderSideEnum.BUY,
  posSide: p.posSide ?? MixHoldSideEnum.LONG,
  size: p.size ?? 1,
  priceAvg: p.priceAvg ?? 100,
  fee: p.fee ?? 0,
  createdAt: p.createdAt ?? now,
});

eng.addOrder(o({ id: "1", side: OrderSideEnum.BUY, posSide: MixHoldSideEnum.LONG, size: 1, priceAvg: 100, createdAt: now }));
eng.addOrder(o({ id: "2", side: OrderSideEnum.BUY, posSide: MixHoldSideEnum.LONG, size: 1, priceAvg: 110, createdAt: new Date(now.getTime() + 1) }));
eng.addOrder(o({ id: "3", side: OrderSideEnum.SELL, posSide: MixHoldSideEnum.LONG, size: 2, priceAvg: 120, fee: 0.1, createdAt: new Date(now.getTime() + 2) }));

const pos = eng.getPosition("BTCUSDT", MixHoldSideEnum.LONG, 120);
console.log("Position (doit être null car tout est clôturé):", pos);

const stats = eng.getPortfolioStats({ BTCUSDT: 120 });
console.log("Portfolio stats:", {
  countPositions: stats.countPositions,
  totalUnrealizedPnL: stats.totalUnrealizedPnL,
});

const realized = eng.getRealizedPnLStats();
console.log("Realized PnL:", realized);

const closed = eng.getClosedTrades();
console.log("Closed trades:", closed);
