import { Action, Asset } from "indicatorts";
// Helpers locaux d'exemple (actifs complets)
const makeRangingAsset = (n = 120, amplitude = 0.5): Asset => {
  const closings = Array.from({ length: n }, (_, i) => 100 + Math.sin(i * 0.3) * amplitude);
  const dates = Array.from({ length: n }, (_, i) => new Date(2020, 0, 1 + i));
  return {
    dates,
    openings: closings.map((c) => c - 0.1),
    highs: closings.map((c) => c + 0.3),
    lows: closings.map((c) => c - 0.3),
    closings,
    volumes: Array.from({ length: n }, () => 1000),
  };
};
const makeTrendingAsset = (n = 150, slope = 0.6): Asset => {
  const closings = Array.from({ length: n }, (_, i) => 100 + i * slope);
  const dates = Array.from({ length: n }, (_, i) => new Date(2020, 0, 1 + i));
  return {
    dates,
    openings: closings.map((c) => c - 0.2),
    highs: closings.map((c) => c + 0.5),
    lows: closings.map((c) => c - 0.5),
    closings,
    volumes: Array.from({ length: n }, () => 1000),
  };
};
import { doubleEmaStrategy, macdStrategy, rsiStrategy, envStrategy, trailingStopStrategy, smaStrategy } from "../strategy/basic";
import { adaptiveStrategy } from "../strategy/adaptive";

// Générer 2 jeux de données
const ranging = makeRangingAsset(120, 2);
const trending = makeTrendingAsset(150, 0.6);

// Calcul de signaux avec différentes stratégies
const sDouble = doubleEmaStrategy(ranging, 5, 20);
const sMacd = macdStrategy(trending);
const sRsi = rsiStrategy(ranging);
const sEnv = envStrategy(ranging, 10, 2, 2);
const sTrail = trailingStopStrategy(ranging, 1.5);
const sSma = smaStrategy(trending, 10, 30);
const sAdaptive = adaptiveStrategy(trending);

const countSignals = (arr: Action[]) => ({
  BUY: arr.filter((x) => x === Action.BUY).length,
  SELL: arr.filter((x) => x === Action.SELL).length,
  HOLD: arr.filter((x) => x === Action.HOLD).length,
});

console.log("=== Strategies Showcase ===");
console.log("Double EMA (ranging) long:", countSignals(sDouble.longStrategy));
console.log("MACD (trending) long:", countSignals(sMacd.longStrategy));
console.log("RSI (ranging) long:", countSignals(sRsi.longStrategy));
console.log("Env (ranging) long:", countSignals(sEnv.longStrategy));
console.log("Trailing (ranging) long:", countSignals(sTrail.longStrategy));
console.log("SMA (trending) long:", countSignals(sSma.longStrategy));
console.log("Adaptive (trending) long:", countSignals(sAdaptive.longStrategy));
