import { BackTest } from "../backtest";
import { buyAndHoldStrategy } from "../strategy/basic";
// ExtendedAsset supprimé

const prices = [100, 101, 102, 103, 104, 105];
const dates = prices.map((_, i) => new Date(2020, 0, 1 + i));
const asset: any = {
  dates,
  openings: [...prices],
  highs: [...prices],
  lows: [...prices],
  closings: prices,
  volumes: new Array(prices.length).fill(0),
};

const strategy = buyAndHoldStrategy(asset, 0, true);

const bt = new BackTest({ initialCapital: 10_000, makerFee: 0.0005, takerFee: 0.001, slippage: 0.0005 });
const res = bt.setData(asset, "BTCUSDT").setStrategy(strategy).run();

console.log("=== BackTest Buy & Hold ===");
console.log({ netProfit: res.netProfit.toFixed(2), trades: res.totalTrades, winRate: (res.winRate * 100).toFixed(1) + "%" });
console.log("Baseline Buy&Hold:", {
  totalReturn: (res.baselineBuyAndHold.totalReturn * 100).toFixed(2) + "%",
  netProfit: res.baselineBuyAndHold.netProfit.toFixed(2),
});
console.log("Outperformance vs Buy&Hold:", res.outperformanceVsBuyAndHold.toFixed(2));
