# trade-backtest

Librairie TypeScript minimaliste pour backtester des stratégies de trading et combiner plusieurs stratégies.

## Installation

```
npm install trade-backtest indicatorts
```

## Utilisation rapide

```ts
import { runBacktest, computePerformance, compileStrategies, macdStrategy, rsiStrategy } from "trade-backtest";
import { Asset } from "indicatorts";

const asset: Asset = /* chargez vos données OHLCV */ {} as any;

const combined = compileStrategies(asset, [
	(a) => macdStrategy(a),
	(a) => rsiStrategy(a),
], { mode: "MAJORITY", weights: [1, 1] });

const bt = runBacktest(asset, combined, { initialCapital: 10000, quantity: 1 });
const perf = computePerformance(bt);
console.log(perf);
```

