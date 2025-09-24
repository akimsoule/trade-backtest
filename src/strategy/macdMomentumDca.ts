import { macd, Action } from "indicatorts";
import { Strategy } from "../types";
import { macdStrategy, roiStrategy } from "./basic";

export interface MacdMomentumDcaOptions {
  fast?: number; // longueur MACD rapide
  slow?: number; // longueur MACD lente
  signal?: number; // longueur MACD signal
  takeProfitRoiPct?: number; // seuil de sortie gagnante (par ex 5)
  dcaThresholdRoiPct?: number; // seuil de lissage (par ex -25)
  allowShort?: boolean; // activer l’entrée short sur croisement baissier
}

/**
 * Stratégie « MACD Momentum DCA — MACD ONLY » (traduction Pine v6)
 *
 * Règles résumées:
 * - Entrée si pas en position et croisement MACD: up => long, down => short (si allowShort)
 * - ROI temps réel basé sur le prix d’entrée initial (non réinitialisé au DCA)
 *   ROI long = (close - entryPrice) / entryPrice * 100
 *   ROI short = (entryPrice - close) / entryPrice * 100
 * - Sortie uniquement si signal opposé ET ROI >= takeProfitRoiPct
 * - Lissage (DCA) si signal opposé ET ROI < dcaThresholdRoiPct (ré-entrée dans le même sens)
 * - Si ROI entre les deux seuils, on ne fait rien (on maintient)
 */
export const macdMomentumDcaStrategy = (
  asset: Parameters<typeof macdStrategy>[0],
  options: MacdMomentumDcaOptions = {}
): Strategy => {
  const {
    fast = 12,
    slow = 26,
    signal = 9,
    takeProfitRoiPct = 5,
    dcaThresholdRoiPct = -25,
    allowShort = true,
  } = options;

  // 1) Base MACD (avec paramétrage custom)
  const custom = macd(asset.closings, { fast, slow, signal });
  let base = macdStrategy(asset, custom);

  // 2) Option: désactiver les entrées short (on neutralise les BUY côté short)
  if (!allowShort) {
    base = {
      longStrategy: base.longStrategy,
      shortStrategy: base.shortStrategy.map(() => Action.HOLD),
      length: base.length,
    };
  }

  // 3) Appliquer le wrapper ROI + DCA par-dessus la base
  let withRoi = roiStrategy(asset, base, takeProfitRoiPct, dcaThresholdRoiPct);
  if (!allowShort) {
    withRoi = {
      longStrategy: withRoi.longStrategy,
      shortStrategy: withRoi.shortStrategy.map((x) => (x === Action.BUY ? Action.HOLD : x)),
      length: withRoi.length,
    };
  }
  return withRoi;
};
