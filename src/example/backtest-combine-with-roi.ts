import { BackTest } from "../backtest";
// ExtendedAsset supprimé
import { doubleEmaStrategy, rsiStrategy } from "../strategy/basic";
import { combineWithRoi } from "../strategy/combineWithRoi";

// Dataset oscillant pour générer des signaux croisés
const prices = [100, 99, 101, 98, 102, 103, 101, 104, 102, 105, 103, 106, 104];
const dates = prices.map((_, i) => new Date(2020, 0, 1 + i));
const asset: any = {
  dates,
  openings: [...prices],
  highs: [...prices],
  lows: [...prices],
  closings: prices,
  volumes: new Array(prices.length).fill(0),
};

// Compose: OR(doubleEMA, RSI) puis wrapper ROI (pré-calcul)
const s1_or = doubleEmaStrategy(asset, 3, 7);
const s2_or = rsiStrategy(asset);
const strategyOr = combineWithRoi(asset, [s1_or, s2_or], { op: "OR", targetRoi: 5, dcaThreshold: -25 });

// Compose: AND(doubleEMA, RSI) + ROI (pré-calcul)
const s1_and = doubleEmaStrategy(asset, 3, 7);
const s2_and = rsiStrategy(asset);
const strategyAnd = combineWithRoi(asset, [s1_and, s2_and], { op: "AND", targetRoi: 5, dcaThreshold: -25 });

const run = (label: string, strategyObj: any) => {
  const backtest = new BackTest({ initialCapital: 10_000, makerFee: 0.0005, takerFee: 0.001, slippage: 0.0005 });
  const res = backtest.setData(asset, "BTCUSDT").setStrategy(strategyObj).run();
  console.log(`=== ${label} ===`);
  console.log({ netProfit: res.netProfit.toFixed(2), trades: res.totalTrades, winRate: (res.winRate * 100).toFixed(1) + "%" });
  console.log("Baseline Buy&Hold:", {
    totalReturn: (res.baselineBuyAndHold.totalReturn * 100).toFixed(2) + "%",
    netProfit: res.baselineBuyAndHold.netProfit.toFixed(2),
  });
  console.log("Outperformance vs Buy&Hold:", res.outperformanceVsBuyAndHold.toFixed(2));
};
run("Combine OR + ROI", strategyOr);
run("Combine AND + ROI", strategyAnd);
