import { BackTest } from "../backtest";
import { type ExtendedAsset } from "../types";

// Données synthétiques simple (BTCUSDT 5 jours)
const data: ExtendedAsset[] = (
  [
    { symbol: "BTCUSDT", timestamp: new Date("2020-01-01"), close: 7000 },
    { symbol: "BTCUSDT", timestamp: new Date("2020-01-02"), close: 7100 },
    { symbol: "BTCUSDT", timestamp: new Date("2020-01-03"), close: 7300 },
    { symbol: "BTCUSDT", timestamp: new Date("2020-01-04"), close: 7200 },
    { symbol: "BTCUSDT", timestamp: new Date("2020-01-05"), close: 7400 },
  ] as any
) as ExtendedAsset[]; // Cast nécessaire car ExtendedAsset étend Asset (barres simplifiées ici)

// Stratégie naïve: BUY au jour 2, SELL au jour 4 (indices 1 et 3)
const strategyFn = () => ({
  longStrategy: [0, 1, 0, 0, 1],
  shortStrategy: [0, 0, 0, 1, 0],
  length: 5,
});

const backtest = new BackTest({
  initialCapital: 10000,
  leverage: 1,
  makerFee: 0.001,
  takerFee: 0.002,
  slippage: 0.001,
});

backtest.setData(data).addStrategy(strategyFn);

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
