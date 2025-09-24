import {
  Action,
  Asset,
  ema,
  macd,
  rsi,
  sma,
  type MACDResult,
} from "indicatorts";
import { Strategy } from "../types";

/**
 * Stratégie de croisement de deux moyennes mobiles exponentielles
 */
export const doubleEmaStrategy = (
  asset: Asset,
  fastPeriod = 22,
  slowPeriod = 56
): Strategy => {
  const emaFast = ema(asset.closings, { period: fastPeriod });
  const emaSlow = ema(asset.closings, { period: slowPeriod });

  const strategyResult = {
    longStrategy: new Array(asset.closings.length).fill(Action.HOLD),
    shortStrategy: new Array(asset.closings.length).fill(Action.HOLD),
    length: asset.closings.length,
  };

  // S'assurer d'avoir suffisamment de données
  const startIndex = Math.max(fastPeriod, slowPeriod);

  // Variables pour suivre l'état précédent
  let inLongPosition = false;
  let inShortPosition = false;

  for (let i = startIndex; i < asset.closings.length; i++) {
    const isCrossUp =
      emaFast[i] > emaSlow[i] && emaFast[i - 1] <= emaSlow[i - 1];
    const isCrossDown =
      emaFast[i] < emaSlow[i] && emaFast[i - 1] >= emaSlow[i - 1];
    const priceDirection = asset.closings[i] > asset.closings[i - 1];

    // Signaux d'achat
    if (isCrossUp && priceDirection && !inLongPosition) {
      strategyResult.longStrategy[i] = Action.BUY;
      strategyResult.shortStrategy[i] = Action.SELL;
      inLongPosition = true;
      inShortPosition = false;
    }
    // Signaux de vente
    else if (isCrossDown && !priceDirection && !inShortPosition) {
      strategyResult.longStrategy[i] = Action.SELL;
      strategyResult.shortStrategy[i] = Action.BUY;
      inLongPosition = false;
      inShortPosition = true;
    }
    // Maintien des positions existantes
    else {
      strategyResult.longStrategy[i] = Action.HOLD;
      strategyResult.shortStrategy[i] = Action.HOLD;
    }
  }

  return strategyResult;
};

/**
 * Stratégie de triple moyennes mobiles exponentielles
 */
export const tripleEmaStrategy = (
  asset: Asset,
  fastPeriod = 9,
  mediumPeriod = 21,
  longPeriod = 50
): Strategy => {
  const emaFast = ema(asset.closings, { period: fastPeriod });
  const emaMedium = ema(asset.closings, { period: mediumPeriod });
  const emaLong = ema(asset.closings, { period: longPeriod });

  const strategyResult = {
    longStrategy: new Array(asset.closings.length).fill(Action.HOLD),
    shortStrategy: new Array(asset.closings.length).fill(Action.HOLD),
    length: asset.closings.length,
  };

  // On s'assure d'avoir suffisamment de données pour commencer
  const startIndex = Math.max(fastPeriod, mediumPeriod, longPeriod);

  let previousBullishAlignment = false;
  let previousBearishAlignment = false;

  for (let i = startIndex; i < asset.closings.length; i++) {
    // Alignement des EMAs pour une tendance haussière
    const bullishAlignment =
      emaFast[i] > emaMedium[i] &&
      emaMedium[i] > emaLong[i] &&
      emaFast[i] > emaFast[i - 1]; // Confirmation de la direction

    // Alignement des EMAs pour une tendance baissière
    const bearishAlignment =
      emaFast[i] < emaMedium[i] &&
      emaMedium[i] < emaLong[i] &&
      emaFast[i] < emaFast[i - 1]; // Confirmation de la direction

    // Génération des signaux avec gestion des croisements
    if (bullishAlignment && !previousBullishAlignment) {
      strategyResult.longStrategy[i] = Action.BUY;
      strategyResult.shortStrategy[i] = Action.SELL;
    } else if (bearishAlignment && !previousBearishAlignment) {
      strategyResult.longStrategy[i] = Action.SELL;
      strategyResult.shortStrategy[i] = Action.BUY;
    }

    previousBullishAlignment = bullishAlignment;
    previousBearishAlignment = bearishAlignment;
  }

  return strategyResult;
};

/**
 * Stratégie MACD
 */
export const macdStrategy = (
  asset: Asset,
  customMacd?: MACDResult
): Strategy => {
  const macdResult = customMacd || macd(asset.closings);
  const strategyResult = {
    longStrategy: new Array(macdResult.macdLine.length).fill(Action.HOLD),
    shortStrategy: new Array(macdResult.macdLine.length).fill(Action.HOLD),
    length: macdResult.macdLine.length,
  };

  for (let i = 1; i < macdResult.macdLine.length; i++) {
    if (
      macdResult.macdLine[i] > macdResult.signalLine[i] &&
      macdResult.macdLine[i - 1] <= macdResult.signalLine[i - 1]
    ) {
      strategyResult.longStrategy[i] = Action.BUY;
      strategyResult.shortStrategy[i] = Action.SELL;
    } else if (
      macdResult.macdLine[i] < macdResult.signalLine[i] &&
      macdResult.macdLine[i - 1] >= macdResult.signalLine[i - 1]
    ) {
      strategyResult.longStrategy[i] = Action.SELL;
      strategyResult.shortStrategy[i] = Action.BUY;
    }
  }

  return strategyResult;
};

/**
 * Stratégie RSI
 */
export const rsiStrategy = (asset: Asset, customRsi?: number[]): Strategy => {
  const rsiResult = customRsi || rsi(asset.closings, { period: 14 });
  const strategyResult = {
    longStrategy: new Array(rsiResult.length).fill(Action.HOLD),
    shortStrategy: new Array(rsiResult.length).fill(Action.HOLD),
    length: rsiResult.length,
  };

  for (let i = 0; i < strategyResult.longStrategy.length; i++) {
    if (rsiResult[i] < 30) {
      strategyResult.longStrategy[i] = Action.BUY;
      strategyResult.shortStrategy[i] = Action.SELL;
    } else if (rsiResult[i] > 70) {
      strategyResult.longStrategy[i] = Action.SELL;
      strategyResult.shortStrategy[i] = Action.BUY;
    }
  }
  return strategyResult;
};

/**
 * Stratégie combinée MACD + RSI
 */
export const macdRsiStrategy = (
  asset: Asset,
  customMacd?: MACDResult,
  customRsi?: number[]
): Strategy => {
  const macdResult = customMacd || macd(asset.closings);
  const rsiResult = customRsi || rsi(asset.closings, { period: 14 });
  const prices = asset.closings;

  const strategyResult = {
    longStrategy: new Array(macdResult.macdLine.length).fill(Action.HOLD),
    shortStrategy: new Array(macdResult.macdLine.length).fill(Action.HOLD),
    length: macdResult.macdLine.length,
  };

  const divergenceWindow = 10; // Fenêtre plus large pour éviter les faux signaux

    for (let i = divergenceWindow; i < prices.length; i++) {
      // Vérification des valeurs disponibles
      /* c8 ignore next 2 */
      if (rsiResult[i] === undefined || macdResult.macdLine[i] === undefined)
        continue;

    // Détection des tendances
    const priceDowntrend = prices[i] < prices[i - divergenceWindow];
    const priceUptrend = prices[i] > prices[i - divergenceWindow];
    const macdDowntrend =
      macdResult.macdLine[i] < macdResult.macdLine[i - divergenceWindow];
    const macdUptrend =
      macdResult.macdLine[i] > macdResult.macdLine[i - divergenceWindow];

    // Détection des divergences
    const bullishDivergence =
      priceDowntrend && macdUptrend && rsiResult[i] < 30;
    const bearishDivergence =
      priceUptrend && macdDowntrend && rsiResult[i] > 70;

    // Génération des signaux (conditions combinées pour éviter la duplication de blocs)
    const macdCrossUp =
      macdResult.macdLine[i] > macdResult.signalLine[i] &&
      macdResult.macdLine[i - 1] <= macdResult.signalLine[i - 1];
    const macdCrossDown =
      macdResult.macdLine[i] < macdResult.signalLine[i] &&
      macdResult.macdLine[i - 1] >= macdResult.signalLine[i - 1];

    if (bullishDivergence || (macdCrossUp && rsiResult[i] < 30)) {
      strategyResult.longStrategy[i] = Action.BUY;
      strategyResult.shortStrategy[i] = Action.SELL;
    } else if (bearishDivergence || (macdCrossDown && rsiResult[i] > 70)) {
      strategyResult.longStrategy[i] = Action.SELL;
      strategyResult.shortStrategy[i] = Action.BUY;
    }
  }

  return strategyResult;
};

/**
 * Stratégie d'enveloppes
 */
export const envStrategy = (
  asset: Asset,
  period = 20,
  lowLevel = 5,
  highLevel = 5
): Strategy => {
  const emaResult = ema(asset.closings, { period });
  const envSup = emaResult.map((value) => value * (1 + highLevel / 100));
  const envInf = emaResult.map((value) => value * (1 - lowLevel / 100));
  const strategyResult = {
    longStrategy: new Array(emaResult.length).fill(Action.HOLD),
    shortStrategy: new Array(emaResult.length).fill(Action.HOLD),
    length: emaResult.length,
  };

  for (let i = 0; i < emaResult.length; i++) {
    if (asset.closings[i] < envInf[i]) {
      strategyResult.longStrategy[i] = Action.BUY;
      strategyResult.shortStrategy[i] = Action.SELL;
    } else if (asset.closings[i] > envSup[i]) {
      strategyResult.shortStrategy[i] = Action.BUY;
      strategyResult.longStrategy[i] = Action.SELL;
    }
  }

  return strategyResult;
};

/**
 * Stratégie de trailing stop
 */
export const trailingStopStrategy = (
  asset: Asset,
  trailingPercentage: number = 2
): Strategy => {
  const strategyResult: Strategy = {
    longStrategy: new Array(asset.closings.length).fill(Action.HOLD),
    shortStrategy: new Array(asset.closings.length).fill(Action.HOLD),
    length: asset.closings.length,
  };

  let highestPrice = asset.closings[0];
  let lowestPrice = asset.closings[0];

  for (let i = 1; i < asset.closings.length; i++) {
    const currentPrice = asset.closings[i];

    // Pour les positions longues
    if (currentPrice > highestPrice) {
      highestPrice = currentPrice;
    }

    const longStopPrice = highestPrice * (1 - trailingPercentage / 100);
    if (currentPrice < longStopPrice) {
      strategyResult.longStrategy[i] = Action.SELL;
    } 
    /* c8 ignore start */
    else if (currentPrice > highestPrice) {
      strategyResult.longStrategy[i] = Action.BUY;
    }
    /* c8 ignore stop */

    // Pour les positions courtes
    if (currentPrice < lowestPrice) {
      lowestPrice = currentPrice;
    }

    const shortStopPrice = lowestPrice * (1 + trailingPercentage / 100);
    if (currentPrice > shortStopPrice) {
      strategyResult.shortStrategy[i] = Action.SELL;
    } 
    /* c8 ignore start */
    else if (currentPrice < lowestPrice) {
      strategyResult.shortStrategy[i] = Action.BUY;
    }
    /* c8 ignore stop */
  }

  return strategyResult;
};

/**
 * Stratégie SMA Crossover
 */
export const smaStrategy = (
  asset: Asset,
  fastPeriod = 10,
  slowPeriod = 30
): Strategy => {
  const smaFast = sma(asset.closings, { period: fastPeriod });
  const smaSlow = sma(asset.closings, { period: slowPeriod });

  const strategyResult = {
    longStrategy: new Array(asset.closings.length).fill(Action.HOLD),
    shortStrategy: new Array(asset.closings.length).fill(Action.HOLD),
    length: asset.closings.length,
  };

  const startIndex = Math.max(fastPeriod, slowPeriod);

  for (let i = startIndex; i < asset.closings.length; i++) {
    const fastIndex = i - (asset.closings.length - smaFast.length);
    const slowIndex = i - (asset.closings.length - smaSlow.length);

    if (
      fastIndex >= 1 &&
      slowIndex >= 1 &&
      fastIndex < smaFast.length &&
      slowIndex < smaSlow.length
    ) {
      // Croisement haussier
      if (
        smaFast[fastIndex] > smaSlow[slowIndex] &&
        smaFast[fastIndex - 1] <= smaSlow[slowIndex - 1]
      ) {
        strategyResult.longStrategy[i] = Action.BUY;
        strategyResult.shortStrategy[i] = Action.SELL;
      }
      // Croisement baissier
      else if (
        smaFast[fastIndex] < smaSlow[slowIndex] &&
        smaFast[fastIndex - 1] >= smaSlow[slowIndex - 1]
      ) {
        strategyResult.longStrategy[i] = Action.SELL;
        strategyResult.shortStrategy[i] = Action.BUY;
      }
    }
  }

  return strategyResult;
};


/**
 * Stratégie Buy & Hold: BUY au début (startIndex) puis HOLD jusqu’à la dernière barre
 * Optionnellement émet un SELL sur la dernière barre pour matérialiser une sortie.
 */
export const buyAndHoldStrategy = (
  asset: Asset,
  startIndex = 0,
  exitAtEnd = true
): Strategy => {
  const length = asset.closings.length;
  const strategyResult: Strategy = {
    longStrategy: new Array(length).fill(Action.HOLD),
    shortStrategy: new Array(length).fill(Action.HOLD),
    length,
  };

  if (length === 0) return strategyResult;

  const i = Math.max(0, Math.min(startIndex, length - 1));
  strategyResult.longStrategy[i] = Action.BUY;
  strategyResult.shortStrategy[i] = Action.SELL; // symétrie

  if (exitAtEnd && length - 1 >= i) {
    strategyResult.longStrategy[length - 1] = Action.SELL;
    strategyResult.shortStrategy[length - 1] = Action.BUY;
  }

  return strategyResult;
};

export const roiStrategy = (
  asset: Asset,
  baseStrategy: Strategy,
  targetRoi = 5, // ROI cible en %
  dcaThreshold = -25 // ROI pour lisser / DCA
): Strategy => {
  const result: Strategy = {
    longStrategy: [...baseStrategy.longStrategy],
    shortStrategy: [...baseStrategy.shortStrategy],
    length: baseStrategy.length,
  };

  let inTrade = false;
  let tradeDirection: 1 | -1 | 0 = 0;
  let entryPrice: number | null = null;
  let averagingCount = 0;

  for (let i = 1; i < asset.closings.length; i++) {
    const price = asset.closings[i];

    // Détecter une entrée à partir de la stratégie de base
    if (!inTrade) {
      if (baseStrategy.longStrategy[i] === Action.BUY) {
        inTrade = true;
        tradeDirection = 1;
        entryPrice = price;
        averagingCount = 0;
        // S’assurer du style de signal symétrique
        result.longStrategy[i] = Action.BUY;
        result.shortStrategy[i] = Action.SELL;
      } else if (baseStrategy.shortStrategy[i] === Action.BUY) {
        inTrade = true;
        tradeDirection = -1;
        entryPrice = price;
        averagingCount = 0;
        result.shortStrategy[i] = Action.BUY;
        result.longStrategy[i] = Action.SELL;
      }
    }

    if (inTrade && entryPrice !== null) {
      const roi =
        tradeDirection === 1
          ? ((price - entryPrice) / entryPrice) * 100
          : ((entryPrice - price) / entryPrice) * 100;

      // Sortie si ROI ≥ target
      if (roi >= targetRoi) {
        if (tradeDirection === 1) {
          // Long → clôture
          result.longStrategy[i] = Action.SELL;
          result.shortStrategy[i] = Action.BUY; // pattern de sortie opposée
        } else {
          // Short → clôture
          result.shortStrategy[i] = Action.SELL;
          result.longStrategy[i] = Action.BUY; // pattern de sortie opposée
        }

        inTrade = false;
        tradeDirection = 0;
        entryPrice = null;
        averagingCount = 0;
      }
      // DCA si ROI ≤ dcaThreshold
      else if (roi <= dcaThreshold) {
        if (tradeDirection === 1) {
          // Long → DCA long
          result.longStrategy[i] = Action.BUY;
          result.shortStrategy[i] = Action.SELL;
        } else {
          // Short → DCA short
          result.shortStrategy[i] = Action.BUY;
          result.longStrategy[i] = Action.SELL;
        }
        averagingCount++;
      }
    }
  }

  return result;
};


