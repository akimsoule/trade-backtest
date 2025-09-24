import { TradingEngine } from "./engine/tradingEngine";
import {
  type BackTestConfig,
  type BackTestResult,
  type EquityPoint,
  type StrategyFn,
  MixHoldSideEnum,
  OrderSideEnum,
  type Order,
  type ExtendedAsset,
} from "./types";

export class BackTest {
  private readonly config: Required<BackTestConfig>;
  private readonly engine: TradingEngine;
  private readonly strategies: StrategyFn[] = [];
  private data: ExtendedAsset[] = [];
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
    this.equity = [{
      timestamp: new Date(),
      equity: config.initialCapital,
      drawdown: 0
    }];
  }

  /** Ajoute une stratégie au backtest */
  addStrategy(strategy: StrategyFn): this {
    this.strategies.push(strategy);
    return this;
  }

  /** Définit les données de marché à utiliser */
  setData(data: ExtendedAsset[]): this {
    this.data = data;
    return this;
  }

  private updateEquity(timestamp: Date, currentEquity: number): void {
    const peak = this.equity.length
      ? Math.max(...this.equity.map(e => e.equity))
      : currentEquity;
    const drawdown = peak > 0 ? (peak - currentEquity) / peak : 0;
    this.equity.push({ timestamp, equity: currentEquity, drawdown });
  }

  private calculateSharpeRatio(): number {
    if (this.equity.length < 2) return 0;
    
    // Calculer les rendements journaliers
    const returns = this.equity.slice(1).map((point, i) => 
      (point.equity - this.equity[i].equity) / this.equity[i].equity
    );

    // Calculer la moyenne et l'écart-type des rendements
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Ratio de Sharpe annualisé (252 jours de trading)
    return mean === 0 ? 0 : (mean * Math.sqrt(252)) / stdDev;
  }

  private processSignalsAtIndex(
    asset: ExtendedAsset,
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

  private updatePortfolio(asset: ExtendedAsset): number {
    const stats = this.engine.getPortfolioStats({ [asset.symbol]: asset.close });
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
    if (!this.data.length || !this.strategies.length) {
      throw new Error("Data and strategies must be set before running backtest");
    }

    let currentEquity = this.config.initialCapital;

    // Filtrer les données selon la période
    const filteredData = this.data.filter(
      d => d.timestamp >= this.config.startDate && d.timestamp <= this.config.endDate
    );

    // Construire un Asset minimal pour calculer les signaux (basé sur filteredData)
    const closings = filteredData.map(d => d.close);
    const dates = filteredData.map(d => d.timestamp);
    const assetForSignals = {
      dates,
      openings: closings.slice(),
      highs: closings.slice(),
      lows: closings.slice(),
      closings,
      volumes: new Array(closings.length).fill(0),
    } as const;

    // Calculer les signaux une fois (on prend la première stratégie pour l'instant)
    const signals = this.strategies[0](assetForSignals as any);
    this.equity.length = 0;
    for (let i = 0; i < filteredData.length; i++) {
      const asset = filteredData[i];
      const longSig = signals.longStrategy[i] ?? 0;
      const shortSig = signals.shortStrategy[i] ?? 0;
      this.processSignalsAtIndex(asset, currentEquity, longSig, shortSig);
      currentEquity = this.updatePortfolio(asset);
      this.updateEquity(asset.timestamp, currentEquity);
    }

    // Calculer les statistiques finales
    const lastPrice = { [filteredData[filteredData.length - 1].symbol]: filteredData[filteredData.length - 1].close };
    const finalStats = this.engine.getPortfolioStats(lastPrice);
    const realizedStats = this.engine.getRealizedPnLStats();
    const trades = this.engine.getClosedTrades();
    const winningTrades = trades.filter(t => t.realizedPnl > 0);

    // Baseline Buy & Hold (sans frais/slippage) sur 1 unité notionnelle: capital varie proportionnellement au prix
    const bhEquity: EquityPoint[] = [];
    if (filteredData.length > 0) {
      const p0 = filteredData[0].close;
      const initial = this.config.initialCapital;
      for (const d of filteredData) {
        const equity = initial * (d.close / p0);
        const peak = bhEquity.length ? Math.max(...bhEquity.map(e => e.equity)) : equity;
        const drawdown = peak > 0 ? (peak - equity) / peak : 0;
        bhEquity.push({ timestamp: d.timestamp, equity, drawdown });
      }
    }
    const bhNet = bhEquity.length ? bhEquity[bhEquity.length - 1].equity - this.config.initialCapital : 0;
    const bhTotalReturn = bhEquity.length ? (bhEquity[bhEquity.length - 1].equity - this.config.initialCapital) / this.config.initialCapital : 0;

    return {
      netProfit: realizedStats.totalRealizedPnL - realizedStats.totalFeesClosed - finalStats.totalFeesOpen,
      grossProfit: realizedStats.totalRealizedPnL,
      totalFees: realizedStats.totalFeesClosed + finalStats.totalFeesOpen,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: trades.length - winningTrades.length,
      winRate: trades.length > 0 ? winningTrades.length / trades.length : 0,
      maxDrawdown: Math.max(...this.equity.map(e => e.drawdown)),
      sharpeRatio: this.calculateSharpeRatio(),
      positions: finalStats.positions,
      trades,
      equity: this.equity,
      baselineBuyAndHold: {
        equity: bhEquity,
        netProfit: bhNet,
        totalReturn: bhTotalReturn,
      },
      outperformanceVsBuyAndHold: (realizedStats.totalRealizedPnL - realizedStats.totalFeesClosed - finalStats.totalFeesOpen) - bhNet,
    };
  }
}