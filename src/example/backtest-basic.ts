import { BackTest } from "../backtest";

// Données synthétiques simples (BTCUSDT 5 jours) sous forme d'Asset indicatorts
const closings = [7000, 7100, 7300, 7200, 7400];
const dates = closings.map((_, i) => new Date(2020, 0, 1 + i));
const asset: any = {
  dates,
  openings: [...closings],
  highs: [...closings],
  lows: [...closings],
  closings,
  volumes: new Array(closings.length).fill(0),
};

// Stratégie naïve: BUY au jour 2, SELL au jour 4 (indices 1 et 3)
const strategy = {
  longStrategy: [0, 1, 0, 0, 1],
  shortStrategy: [0, 0, 0, 1, 0],
  length: 5,
};

const backtest = new BackTest({
  initialCapital: 10000,
  leverage: 1,
  makerFee: 0.001,
  takerFee: 0.002,
  slippage: 0.001,
});

backtest.setData(asset, "BTCUSDT").setStrategy(strategy);

const result = backtest.run();

console.log("=== Résultat BackTest Basique ===");
console.log({
  netProfit: result.netProfit,
  grossProfit: result.grossProfit,
  totalFees: result.totalFees,
  totalTrades: result.totalTrades,
  winRate: result.winRate,
  maxDrawdown: result.maxDrawdown,
  sharpeRatio: result.sharpeRatio,
});
console.log("Equity curve:", result.equity.map((p) => ({ t: p.timestamp.toISOString().slice(0,10), e: p.equity.toFixed(2) })));
