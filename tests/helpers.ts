import { Action, Asset } from "indicatorts";
import { Order, OrderSideEnum, MixHoldSideEnum, Strategy } from "../src/types";

export const makeAsset = (n = 50): Asset => {
  const closings = Array.from({ length: n }, (_, i) => 100 + i);
  const dates = Array.from({ length: n }, (_, i) => new Date(2020, 0, 1 + i));
  return {
    dates,
    openings: closings.map((c) => c - 0.5),
    highs: closings.map((c) => c + 1),
    lows: closings.map((c) => c - 1),
    closings,
    volumes: Array.from({ length: n }, () => 1000),
  };
};

export const makeTrendingAsset = (n = 120, slope = 0.5): Asset => {
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

export const makeRangingAsset = (n = 120, amplitude = 0.5): Asset => {
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

export const makeVolatileBearishAsset = (n = 120): Asset => {
  // Construire une série avec grandes pertes et petites reprises pour obtenir RSI bas et forte volatilité
  let price = 100;
  const closings: number[] = [];
  for (let i = 0; i < n; i++) {
    const ret = i % 2 === 0 ? -0.08 : 0.01; // -8%, +1%
    price = price * (1 + ret);
    closings.push(price);
  }
  const dates = Array.from({ length: n }, (_, i) => new Date(2020, 0, 1 + i));
  return {
    dates,
    openings: closings.map((c) => c * 0.999),
    highs: closings.map((c) => c * 1.005),
    lows: closings.map((c) => c * 0.995),
    closings,
    volumes: Array.from({ length: n }, () => 1000),
  };
};

// Générateur d'ordre typé pour le moteur
export const makeOrder = (partial: Partial<Order> & { id: string }): Order => ({
  id: partial.id,
  symbol: partial.symbol ?? "BTCUSDT",
  side: partial.side ?? OrderSideEnum.BUY,
  posSide: partial.posSide ?? MixHoldSideEnum.LONG,
  size: partial.size ?? 1,
  priceAvg: partial.priceAvg ?? 100,
  fee: partial.fee ?? 0,
  createdAt: partial.createdAt ?? new Date(2020, 0, 1),
});

// Stratégie constante (utile pour combiner ET/OU)
export const makeConstStrategy = (n: number, long: Action, short: Action): Strategy => ({
  longStrategy: new Array(n).fill(long),
  shortStrategy: new Array(n).fill(short),
  length: n,
});
