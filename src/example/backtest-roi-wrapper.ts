import { BackTest } from "../backtest";
import { macdStrategy, roiStrategy } from "../strategy/basic";
// ExtendedAsset supprimé

// Dataset synthétique court qui monte puis consolide
const prices = [100, 101, 102, 103, 104, 105, 104, 103, 104, 106];
const dates = prices.map((_, i) => new Date(2020, 0, 1 + i));
const asset: any = {
  dates,
  openings: [...prices],
  highs: [...prices],
  lows: [...prices],
  closings: prices,
  volumes: new Array(prices.length).fill(0),
};

// Stratégie de base: MACD ; puis wrapper ROI+DCA (TP 5%, DCA -25%) pré-calculée
const base = macdStrategy(asset);
const strategy = roiStrategy(asset, base, 5, -25);

const backtest = new BackTest({
  initialCapital: 10_000,
  leverage: 1,
  makerFee: 0.0005,
  takerFee: 0.001,
  slippage: 0.0005,
});

const res = backtest.setData(asset, "BTCUSDT").setStrategy(strategy).run();

console.log("=== BackTest ROI Wrapper (MACD→ROI) ===");
console.log({
  netProfit: res.netProfit.toFixed(2),
  totalTrades: res.totalTrades,
  winRate: (res.winRate * 100).toFixed(1) + "%",
  maxDrawdown: (res.maxDrawdown * 100).toFixed(2) + "%",
});
console.log(
  "Equity:",
  res.equity.map((p) => ({ t: p.timestamp.toISOString().slice(0, 10), e: p.equity.toFixed(2) }))
);
console.log("Baseline Buy&Hold:", {
  totalReturn: (res.baselineBuyAndHold.totalReturn * 100).toFixed(2) + "%",
  netProfit: res.baselineBuyAndHold.netProfit.toFixed(2),
});
console.log("Outperformance vs Buy&Hold:", res.outperformanceVsBuyAndHold.toFixed(2));
