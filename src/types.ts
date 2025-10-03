/**
 * Types de base pour la librairie de backtesting
 */

import { Action, Asset } from "indicatorts";

/** Stratégie avec signaux longs et courts */
export interface Strategy {
  longStrategy: Action[];
  shortStrategy: Action[];
  length: number;
}

/** Fabrique de stratégie: prend un Asset et retourne des signaux */
export type StrategyFn = (asset: Asset) => Strategy;

// On n'utilise plus ExtendedAsset: on s'appuie directement sur Asset (de indicatorts)
// Le BackTest suppose simplement que l'Asset fourni possède au moins:
//  - timestamp: Date[] (ou dates)
//  - closings: number[]
// Pour compatibilité ascendante, on acceptera encore des objets avec symbol/timestamp/close en interne (cast) sans typer explicitement.

/** Configuration du backtest */
export interface BackTestConfig {
  initialCapital: number;
  leverage?: number;
  makerFee?: number;
  takerFee?: number;
  slippage?: number;
  startDate?: Date;
  endDate?: Date;
}

/** Résultats du backtest */
export interface BackTestResult {
  netProfit: number;
  grossProfit: number;
  totalFees: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  positions: Position[];
  trades: ClosedTrade[];
  equity: EquityPoint[];
  /** Baseline Buy & Hold sur la même période/config */
  baselineBuyAndHold: {
    equity: EquityPoint[];
    netProfit: number;
    totalReturn: number; // (equity_final - initial) / initial
  };
  /** Surperformance nette vs baseline */
  outperformanceVsBuyAndHold: number; // netProfit - baseline.netProfit
}

/** Point d'équité pour le graphique d'évolution du capital */
export interface EquityPoint {
  timestamp: Date;
  equity: number;
  drawdown: number;
}

/** Modes de combinaison de plusieurs stratégies */
export type CombineMode = "AND" | "OR" | "MAJORITY" | "WEIGHTED" | "PRIORITY";

export interface CombineConfig {
  mode: CombineMode;
  /**
  * Poids pour WEIGHTED (même ordre que les stratégies). Si défini avec MAJORITY,
  * sert de majorité pondérée; threshold est le score minimal (par défaut 0) pour valider un signal.
   */
  weights?: number[];
  /** Seuil pour WEIGHTED/MAJORITY pondéré. Par défaut 0 (plus d'achats que de ventes). */
  threshold?: number;
  /** Ordre de priorité (indices des stratégies) pour PRIORITY */
  priorityOrder?: number[];
}

export type MarketCondition = "TRENDING" | "RANGING" | "VOLATILE";

export interface MarketAnalysis {
  volatility: number;
  trendStrength: number;
  condition: MarketCondition;
}

export interface StrategyParameters {
  trending: {
    macd: {
      fast: number;
      slow: number;
      signal: number;
    };
  };
  ranging: {
    env: {
      period: number;
      lowLevel: number;
      highLevel: number;
    };
  };
  volatile: {
    env: {
      period: number;
      lowLevel: number;
      highLevel: number;
    };
    trailingStop: {
      percentage: number;
    };
  };
}

export type PositionSide = "LONG" | "SHORT" | "FLAT";

export interface Trade {
  side: Exclude<PositionSide, "FLAT">;
  entryIndex: number;
  exitIndex: number;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  fees: number;
  pnl: number; // en devise de cotation
  returnPct: number; // pnl / (entryPrice*quantity)
}

export interface BacktestOptions {
  initialCapital?: number; // défaut 10000
  quantity?: number; // défaut 1 (unité)
  feesPct?: number; // 0.001 = 0.1%
  slippagePct?: number; // 0.0005 = 0.05%
  allowShort?: boolean; // défaut true si shortStrategy est fourni
  periodsPerYear?: number; // pour annualiser (défaut 252)
}

export interface BacktestResult {
  equity: number[];
  returns: number[]; // rendements par barre de l’equity
  trades: Trade[];
  totalPnl: number;
  options: Required<BacktestOptions>;
}

/**
 * Types du moteur de trading (centralisés)
 */
export enum MixHoldSideEnum {
  LONG = "long",
  SHORT = "short",
}

export enum OrderSideEnum {
  BUY = "buy",
  SELL = "sell",
}

export interface Order {
  id: string;
  symbol: string;
  side: OrderSideEnum; // buy/sell
  posSide: MixHoldSideEnum; // long/short
  size: number; // quantité en base (ex: BTC)
  priceAvg: number; // prix d'exécution
  fee?: number; // frais payés (UST)
  createdAt: Date;
}

export interface Position {
  symbol: string;
  posSide: MixHoldSideEnum;
  openSide: OrderSideEnum;
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnlUnrealized: number;
  totalFee: number;
  notionalValue: number;
  marginRequired: number;
  liquidationPrice: number;
  lastOrderId?: string;
  openedAt?: Date;
}

export interface PortfolioStats {
  positions: Position[];
  countPositions: number;
  longCount: number;
  shortCount: number;
  totalUnrealizedPnL: number;
  totalFeesOpen: number;
  totalNotional: number;
  totalMargin: number;
  bySymbol: Map<string, { notional: number; pnlUnrealized: number; size: number }>;
}

export interface RealizedPnLStats {
  totalRealizedPnL: number;
  totalFeesClosed: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number; // 0..1
  avgProfit: number; // par trade clôturé
  best: number;
  worst: number;
  avgHoldMs: number; // durée moyenne de détention sur trades clôturés
}

export interface ClosedTrade {
  symbol: string;
  posSide: MixHoldSideEnum;
  size: number; // taille totale clôturée (round)
  realizedPnl: number; // net (gross - fees)
  grossPnl: number;
  feesOpenUsed: number; // part des frais d'ouverture affectée à cette clôture
  feesClose: number; // somme des fees de fermeture
  openedAt: Date;
  closedAt: Date;
  lastCloseOrderId?: string;
}
