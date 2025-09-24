import { describe, it, expect } from "vitest";
import { BackTest } from "../src/backtest";
import { type ExtendedAsset } from "../src/types";

describe("BackTest", () => {
  it("effectue un backtest simple long only", () => {
    // Créer les données de marché
    const data: ExtendedAsset[] = [
      { symbol: "BTCUSDT", timestamp: new Date("2020-01-01"), close: 7000 },
      { symbol: "BTCUSDT", timestamp: new Date("2020-01-02"), close: 7100 },
      { symbol: "BTCUSDT", timestamp: new Date("2020-01-03"), close: 7300 },
      { symbol: "BTCUSDT", timestamp: new Date("2020-01-04"), close: 7200 },
      { symbol: "BTCUSDT", timestamp: new Date("2020-01-05"), close: 7400 },
    ].map(d => ({ ...d } as ExtendedAsset));

    // Créer une stratégie simple (achat à J1, vente à J4)
    const strategyFn = () => ({
      longStrategy: [0, 1, 0, 0, 1],
      shortStrategy: [0, 0, 0, 1, 0],
      length: 5,
    });

    const backtest = new BackTest({
      initialCapital: 10000,
      leverage: 1,
      makerFee: 0.001,
      takerFee: 0.002,
      slippage: 0.001,
    });

    backtest.setData(data).addStrategy(strategyFn);
    const result = backtest.run();

    // Vérifications de base
    expect(result.totalTrades).toBeGreaterThan(0);
    expect(result.equity.length).toBe(5);  // Mise à jour du nombre d'équity points attendus
    expect(result.equity[0].equity).toBe(10000);

    // Vérification que l'équité finale est différente du capital initial
    expect(result.equity[data.length - 1].equity).not.toBe(10000);

    // Vérification de la cohérence des statistiques
    expect(result.winningTrades + result.losingTrades).toBe(result.totalTrades);
    expect(result.winRate).toBe(result.winningTrades / result.totalTrades);

    // Vérification de la présence des frais
    expect(result.totalFees).toBeGreaterThan(0);

    // Vérification des changements d'équité cohérents
    for (let i = 1; i < result.equity.length; i++) {
      expect(result.equity[i].timestamp.getTime()).toBeGreaterThan(result.equity[i-1].timestamp.getTime());
    }
  });
});