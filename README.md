# trade-backtest

Librairie TypeScript pour backtester des stratégies de trading “à la TradingView”, composer des signaux, appliquer un wrapper ROI/DCA et comparer la performance à un baseline Buy & Hold.

• 100% de couverture de code sur le cœur du backtest.  
• S’appuie sur la librairie d’indicateurs `indicatorts`.

## Installation

```bash
npm install trade-backtest indicatorts
```

## TL;DR (exemple minimal)

```ts
import { BackTest, macdStrategy } from "trade-backtest";
import type { Asset } from "indicatorts";

// Construire un Asset au format indicatorts (arrays parallèles)
const prices = [100, 101, 102, 103, 104, 105];
const dates = prices.map((_, i) => new Date(2020, 0, 1 + i));
const asset: Asset = {
	dates,
	openings: [...prices],
	highs: [...prices],
	lows: [...prices],
	closings: prices,
	volumes: new Array(prices.length).fill(0),
} as any;

// 1) Générer la stratégie (les signaux sont calculés une fois hors BackTest)
const strategy = macdStrategy(asset);

// 2) Lancer le backtest (nouvelle API: setStrategy au lieu de addStrategy)
const res = new BackTest({ initialCapital: 10_000, makerFee: 0.0005, takerFee: 0.001, slippage: 0.0005 })
	.setData(asset, "BTCUSDT")
	.setStrategy(strategy)
	.run();

console.log({ netProfit: res.netProfit, totalTrades: res.totalTrades, winRate: res.winRate });
console.log("Baseline Buy&Hold:", res.baselineBuyAndHold);
console.log("Outperformance vs Buy&Hold:", res.outperformanceVsBuyAndHold);
```

## Stratégies incluses

- basic:
	- `doubleEmaStrategy(asset, fast?, slow?)`
	- `tripleEmaStrategy(asset, short?, mid?, long?)`
	- `smaStrategy(asset, short?, long?)`
	- `macdStrategy(asset, macdImpl?)`
	- `rsiStrategy(asset, period?, overbought?, oversold?)`
	- `envStrategy(asset, period?, lowLevel?, highLevel?)`
	- `trailingStopStrategy(asset, percentage?)`
	- `macdRsiStrategy(asset, macdCfg?, rsiCfg?)`
	- `roiStrategy(asset, baseStrategy, targetRoiPct, dcaThresholdPct)` – wrapper ROI + DCA
	- `buyAndHoldStrategy(asset, startIndex?, closeAtEnd?)`
- combined:
	- `andStrategy(asset, ...strategies)` / `orStrategy(asset, ...strategies)`
	- `andEntryExitStrategy(asset, entryStrategy, exitStrategy)`
	- `combineWithRoi(asset, strategies, { op: "AND" | "OR", targetRoi, dcaThreshold })`
- spécifiques:
	- `macdMomentumDcaStrategy(asset, { allowShort?: boolean }?)` – version “Pine-like” basée sur `macdStrategy` + `roiStrategy`

Toutes les stratégies exposent deux tableaux de signaux `longStrategy` et `shortStrategy` (actions BUY/SELL/HOLD) alignés sur la longueur de la série; le backtest applique ces signaux barre par barre.

## Wrapper ROI + DCA (exemple)

```ts
import { BackTest, macdStrategy, roiStrategy } from "trade-backtest";
import type { Asset } from "indicatorts";

const data: Asset[] = /* ... */ [] as any;

const base = macdStrategy(asset);
const strategy = roiStrategy(asset, base, 5, -25); // Take Profit 5%, DCA si -25%

const res = new BackTest({ initialCapital: 10_000 })
	.setData(asset as any, "BTCUSDT")
	.setStrategy(strategy)
	.run();
console.log(res.netProfit, res.baselineBuyAndHold, res.outperformanceVsBuyAndHold);
```

## Combiner des stratégies + ROI

```ts
import { BackTest, doubleEmaStrategy, rsiStrategy, combineWithRoi } from "trade-backtest";
import type { Asset } from "indicatorts";

const data: Asset[] = /* ... */ [] as any;

const s1 = doubleEmaStrategy(asset, 3, 7);
const s2 = rsiStrategy(asset);
const combined = combineWithRoi(asset, [s1, s2], { op: "OR", targetRoi: 5, dcaThreshold: -25 });

const res = new BackTest({ initialCapital: 10_000 })
  .setData(asset as any, "BTCUSDT")
  .setStrategy(combined)
  .run();
```

## Baseline Buy & Hold et outperformance

Par défaut, le `BackTest` renvoie aussi un baseline “Buy & Hold” naïf (achat à la première barre, vente à la dernière) sans frais ni slippage. Il expose:

- `baselineBuyAndHold: { equity[], netProfit, totalReturn }`
- `outperformanceVsBuyAndHold = netProfit - baseline.netProfit`

Remarque: si votre stratégie applique des frais/slippage, son PnL net sera inférieur au baseline naïf. Pour une comparaison stricte, vous pouvez désactiver frais/slippage dans le backtest, ou implémenter un baseline basé moteur (mêmes frictions appliquées) dans votre code.

## Exemples prêts à l’emploi (dans ce repo)

```bash
# nécessite tsx comme devDep (déjà configuré dans ce repo)
npm run example:basic
npm run example:roi
npm run example:combine-roi
npm run example:macd-dca
npm run example:buy-and-hold

# Exécuter tous les exemples en série:
npm run example:all
```

## Tests et couverture

```bash
npm test
npm run test:coverage
```

## Build

```bash
npm run build
```

## TypeScript et types

Le package fournit `types` via `dist/index.d.ts`. Les types clés incluent `Strategy`, `BackTestConfig`, `BackTestResult`, et des types de moteur de trading pour des cas avancés.

### Changement majeur (breaking) introduit en 2.0.0

- L’API utilise maintenant `setStrategy(strategy: Strategy)` (objet de signaux pré-calculés) à la place de `addStrategy(strategyFn)`.
- Pré-calculer vos signaux: `const strategy = macdStrategy(asset); backtest.setStrategy(strategy);`

Si vous aviez du code ancien:
```ts
// Ancien
bt.addStrategy((asset) => macdStrategy(asset));
// Nouveau
const strat = macdStrategy(asset);
bt.setStrategy(strat);
```

## Licence

MIT © Akim Soulé

