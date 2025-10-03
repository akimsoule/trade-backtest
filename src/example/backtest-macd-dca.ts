import { BackTest } from "../backtest";
// ExtendedAsset supprimé
import { macdMomentumDcaStrategy } from "../strategy/macdMomentumDca";

// Petit dataset synthétique avec variations pour déclencher MACD
const prices = [100, 102, 105, 103, 98, 95, 96, 99, 104, 108, 107, 110, 108, 105, 102, 101, 103, 106, 109, 107];

const dates = prices.map((_, i) => new Date(2020, 0, 1 + i));
const asset: any = {
  dates,
  openings: [...prices],
  highs: [...prices],
  lows: [...prices],
  closings: prices,
  volumes: new Array(prices.length).fill(0),
};

const backtest = new BackTest({
  initialCapital: 10000,
  leverage: 1,
  makerFee: 0.0005,
  takerFee: 0.001,
  slippage: 0.0005,
});

// Stratégie MACD Momentum DCA: paramètres par défaut (TP 5%, DCA sous -25%) pré-calculée
const strategy = macdMomentumDcaStrategy(asset, { allowShort: false });

backtest.setData(asset, "BTCUSDT").setStrategy(strategy);
const result = backtest.run();

console.log("=== BackTest MACD Momentum DCA ===");
console.log({
  netProfit: result.netProfit.toFixed(2),
  grossProfit: result.grossProfit.toFixed(2),
  totalFees: result.totalFees.toFixed(2),
  totalTrades: result.totalTrades,
  winRate: (result.winRate * 100).toFixed(1) + "%",
  maxDrawdown: (result.maxDrawdown * 100).toFixed(2) + "%",
  sharpeRatio: Number.isFinite(result.sharpeRatio) ? result.sharpeRatio.toFixed(2) : "0.00",
});
console.log(
  "Equity:",
  result.equity.map((p) => ({ t: p.timestamp.toISOString().slice(0, 10), e: p.equity.toFixed(2) }))
);

console.log("Baseline Buy&Hold:", {
  totalReturn: (result.baselineBuyAndHold.totalReturn * 100).toFixed(2) + "%",
  netProfit: result.baselineBuyAndHold.netProfit.toFixed(2),
});
console.log("Outperformance vs Buy&Hold:", result.outperformanceVsBuyAndHold.toFixed(2));
