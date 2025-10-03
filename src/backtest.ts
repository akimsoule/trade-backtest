import { TradingEngine } from "./engine/tradingEngine";
import {
  type BackTestConfig,
  type BackTestResult,
  type EquityPoint,
  type Strategy,
  MixHoldSideEnum,
  OrderSideEnum,
  type Order,
} from "./types";
import type { Asset } from "indicatorts";

export class BackTest {
  private readonly config: Required<BackTestConfig>;
  private readonly engine: TradingEngine;
  // Stratégie unique (après demande utilisateur). Elle doit déjà contenir les tableaux de signaux.
  private strategy: Strategy | null = null;
  private asset: Asset | null = null;
  private assetSymbol: string = "ASSET";
  private readonly equity: EquityPoint[] = [];

  constructor(config: BackTestConfig) {
    this.config = {
      makerFee: 0.0002, // 0.02%
      takerFee: 0.0005, // 0.05%
      slippage: 0.0001, // 0.01%
      leverage: 1,
      startDate: new Date(0),
      endDate: new Date(8640000000000000),
      ...config,
    };
    this.engine = new TradingEngine([], this.config.leverage);
    this.equity = [
      {
        timestamp: new Date(),
        equity: config.initialCapital,
        drawdown: 0,
      },
    ];
  }

  /** Définit la stratégie (objet pré-calculé avec longStrategy / shortStrategy) */
  setStrategy(strategy: Strategy): this {
    this.strategy = strategy;
    return this;
  }

  /**
   * Définit l'Asset de marché (structure array indicatorts).
   * @param asset Asset indicatorts (dates, openings, highs, lows, closings, volumes)
   * @param symbol (optionnel) symbole utilisé pour les positions
   */
  setData(asset: Asset, symbol = "ASSET"): this {
    this.asset = asset;
    this.assetSymbol = symbol;
    return this;
  }

  private updateEquity(timestamp: Date, currentEquity: number): void {
    const peak = this.equity.length
      ? Math.max(...this.equity.map((e) => e.equity))
      : currentEquity;
    const drawdown = peak > 0 ? (peak - currentEquity) / peak : 0;
    this.equity.push({ timestamp, equity: currentEquity, drawdown });
  }

  private calculateSharpeRatio(): number {
    if (this.equity.length < 2) return 0;

    // Calculer les rendements journaliers
    const returns = this.equity
      .slice(1)
      .map(
        (point, i) =>
          (point.equity - this.equity[i].equity) / this.equity[i].equity
      );

    // Calculer la moyenne et l'écart-type des rendements
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      returns.length;
    const stdDev = Math.sqrt(variance);

    // Ratio de Sharpe annualisé (252 jours de trading)
    return mean === 0 ? 0 : (mean * Math.sqrt(252)) / stdDev;
  }

  private processSignalsAtIndex(
    asset: any,
    currentEquity: number,
    longSignal: number,
    shortSignal: number
  ): void {
    if (longSignal === 1) {
      const size = (currentEquity * this.config.leverage) / asset.close;
      const order: Order = {
        id: Date.now().toString(),
        symbol: asset.symbol,
        createdAt: asset.timestamp,
        side: OrderSideEnum.BUY,
        posSide: MixHoldSideEnum.LONG,
        size,
        priceAvg: asset.close * (1 + this.config.slippage),
        fee: size * asset.close * this.config.takerFee,
      };
      this.engine.addOrder(order);
    }

    if (shortSignal === 1) {
      const position = this.engine.getPosition(
        asset.symbol,
        MixHoldSideEnum.LONG,
        asset.close
      );
      if (position) {
        const order: Order = {
          id: Date.now().toString(),
          symbol: asset.symbol,
          createdAt: asset.timestamp,
          side: OrderSideEnum.SELL,
          posSide: MixHoldSideEnum.LONG,
          size: position.size,
          priceAvg: asset.close * (1 - this.config.slippage),
          fee: position.size * asset.close * this.config.takerFee,
        };
        this.engine.addOrder(order);
      }
    }
  }

  private updatePortfolio(asset: any): number {
    const stats = this.engine.getPortfolioStats({
      [asset.symbol]: asset.close,
    });
    const pnlStats = this.engine.getRealizedPnLStats();
    const newEquity =
      this.config.initialCapital +
      pnlStats.totalRealizedPnL +
      stats.totalUnrealizedPnL -
      pnlStats.totalFeesClosed -
      stats.totalFeesOpen;
    return newEquity;
  }

  /** Exécute le backtest */
  run(): BackTestResult {
    if (!this.asset?.closings?.length || !this.strategy) {
      throw new Error(
        "Asset and strategy must be set before running backtest"
      );
    }

    let currentEquity = this.config.initialCapital;

    // Indices filtrés par date
    const datesArr: Date[] =
      (this.asset.dates as any) || (this.asset as any).dates;
    const closingsArr: number[] = this.asset.closings;
    const filteredIndices = this.buildFilteredIndices(datesArr);

  // La stratégie est déjà fournie sous forme de signaux
  const signals = this.strategy;
    this.equity.length = 0;
    for (const i of filteredIndices) {
      const bar = {
        timestamp: datesArr[i],
        close: closingsArr[i],
        symbol: this.assetSymbol,
      };
      const longSig = signals.longStrategy[i] ?? 0;
      const shortSig = signals.shortStrategy[i] ?? 0;
      this.processSignalsAtIndex(bar, currentEquity, longSig, shortSig);
      currentEquity = this.updatePortfolio(bar);
      this.updateEquity(bar.timestamp, currentEquity);
    }

    // Calculer les statistiques finales
    const lastIdx = filteredIndices[filteredIndices.length - 1];
    const lastPrice = { [this.assetSymbol]: closingsArr[lastIdx] };
    const finalStats = this.engine.getPortfolioStats(lastPrice);
    const realizedStats = this.engine.getRealizedPnLStats();
    const trades = this.engine.getClosedTrades();
    const winningTrades = trades.filter((t) => t.realizedPnl > 0);

    // Baseline Buy & Hold (sans frais/slippage) sur 1 unité notionnelle: capital varie proportionnellement au prix
    const bhEquity: EquityPoint[] = [];
    if (filteredIndices.length > 0) {
      const p0 = closingsArr[filteredIndices[0]];
      const initial = this.config.initialCapital;
      for (const i of filteredIndices) {
        const close = closingsArr[i];
        const ts = datesArr[i];
        const equity = initial * (close / p0);
        const peak = bhEquity.length
          ? Math.max(...bhEquity.map((e) => e.equity))
          : equity;
        const drawdown = peak > 0 ? (peak - equity) / peak : 0;
        bhEquity.push({ timestamp: ts, equity, drawdown });
      }
    }
    const bhNet = bhEquity.length
      ? bhEquity[bhEquity.length - 1].equity - this.config.initialCapital
      : 0;
    const bhTotalReturn = bhEquity.length
      ? (bhEquity[bhEquity.length - 1].equity - this.config.initialCapital) /
        this.config.initialCapital
      : 0;

    return {
      netProfit:
        realizedStats.totalRealizedPnL -
        realizedStats.totalFeesClosed -
        finalStats.totalFeesOpen,
      grossProfit: realizedStats.totalRealizedPnL,
      totalFees: realizedStats.totalFeesClosed + finalStats.totalFeesOpen,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: trades.length - winningTrades.length,
      winRate: trades.length > 0 ? winningTrades.length / trades.length : 0,
      maxDrawdown: Math.max(...this.equity.map((e) => e.drawdown)),
      sharpeRatio: this.calculateSharpeRatio(),
      positions: finalStats.positions,
      trades,
      equity: this.equity,
      baselineBuyAndHold: {
        equity: bhEquity,
        netProfit: bhNet,
        totalReturn: bhTotalReturn,
      },
      outperformanceVsBuyAndHold:
        realizedStats.totalRealizedPnL -
        realizedStats.totalFeesClosed -
        finalStats.totalFeesOpen -
        bhNet,
    };
  }
  private buildFilteredIndices(datesArr: Date[]): number[] {
    const res: number[] = [];
    // Tolérance: si startDate / endDate sont undefined dans la config fournie, on applique des bornes extrêmes
    const start = this.config.startDate ?? new Date(0);
    const end = this.config.endDate ?? new Date(8640000000000000);
    for (let i = 0; i < datesArr.length; i++) {
      const ts = datesArr[i];
      if (ts >= start && ts <= end) res.push(i);
    }
    return res;
  }
}
