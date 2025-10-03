import { describe, it, expect } from "vitest";
import { BackTest } from "../src/backtest";
// ExtendedAsset supprimé; on utilise un type inline minimal

describe("BackTest", () => {
  it("effectue un backtest simple long only", () => {
    // Créer les données de marché
    const closings = [7000, 7100, 7300, 7200, 7400];
    const dates = closings.map((_,i)=> new Date(2020,0,1+i));
    const asset: any = {
      dates,
      openings: [...closings],
      highs: [...closings],
      lows: [...closings],
      closings,
      volumes: new Array(closings.length).fill(0),
    };

    // Créer une stratégie simple (achat à J1, vente à J4)
    const strategy = {
      longStrategy: [0, 1, 0, 0, 1],
      shortStrategy: [0, 0, 0, 1, 0],
      length: 5,
    };

    const backtest = new BackTest({
      initialCapital: 10000,
      leverage: 1,
      makerFee: 0.001,
      takerFee: 0.002,
      slippage: 0.001,
    });

  backtest.setData(asset, "BTCUSDT").setStrategy(strategy);
    const result = backtest.run();

    // Vérifications de base
    expect(result.totalTrades).toBeGreaterThan(0);
    expect(result.equity.length).toBe(5);  // Mise à jour du nombre d'équity points attendus
    expect(result.equity[0].equity).toBe(10000);

    // Vérification que l'équité finale est différente du capital initial
  expect(result.equity[closings.length - 1].equity).not.toBe(10000);

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