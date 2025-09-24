import { BackTest } from "../backtest";
import type { ExtendedAsset } from "../types";
import { doubleEmaStrategy, rsiStrategy } from "../strategy/basic";
import { combineWithRoi } from "../strategy/combineWithRoi";

// Dataset oscillant pour générer des signaux croisés
const prices = [100, 99, 101, 98, 102, 103, 101, 104, 102, 105, 103, 106, 104];
const data: ExtendedAsset[] = prices.map((p, i) => ({
  symbol: "BTCUSDT",
  timestamp: new Date(2020, 0, 1 + i),
  close: p,
})) as any;

// Compose: OR(doubleEMA, RSI) puis wrapper ROI
const strategyFnOr = (asset: any) => {
  const s1 = doubleEmaStrategy(asset, 3, 7);
  const s2 = rsiStrategy(asset);
  return combineWithRoi(asset, [s1, s2], { op: "OR", targetRoi: 5, dcaThreshold: -25 });
};

// Compose: AND(doubleEMA, RSI) + ROI
const strategyFnAnd = (asset: any) => {
  const s1 = doubleEmaStrategy(asset, 3, 7);
  const s2 = rsiStrategy(asset);
  return combineWithRoi(asset, [s1, s2], { op: "AND", targetRoi: 5, dcaThreshold: -25 });
};

const run = (label: string, strategyFn: any) => {
  const backtest = new BackTest({ initialCapital: 10_000, makerFee: 0.0005, takerFee: 0.001, slippage: 0.0005 });
  const res = backtest.setData(data).addStrategy(strategyFn).run();
  console.log(`=== ${label} ===`);
  console.log({ netProfit: res.netProfit.toFixed(2), trades: res.totalTrades, winRate: (res.winRate * 100).toFixed(1) + "%" });
  console.log("Baseline Buy&Hold:", {
    totalReturn: (res.baselineBuyAndHold.totalReturn * 100).toFixed(2) + "%",
    netProfit: res.baselineBuyAndHold.netProfit.toFixed(2),
  });
  console.log("Outperformance vs Buy&Hold:", res.outperformanceVsBuyAndHold.toFixed(2));
};

run("Combine OR + ROI", strategyFnOr);
run("Combine AND + ROI", strategyFnAnd);
