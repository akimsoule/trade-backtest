import { Asset } from "indicatorts";
import { Strategy } from "../types";
import { andStrategy, orStrategy } from "./combined";
import { roiStrategy } from "./basic";

export type CombineOp = "AND" | "OR";

export interface CombineWithRoiOptions {
  op?: CombineOp; // opérateur de base entre stratégies (défaut: OR)
  targetRoi?: number; // ROI cible en % (défaut 5)
  dcaThreshold?: number; // seuil DCA en % (défaut -25)
}

/**
 * Combine plusieurs stratégies (AND/OR), puis applique un wrapper ROI + DCA.
 * - Chaque stratégie fournit des signaux BUY/SELL/HOLD
 * - On combine ces signaux en une stratégie unique
 * - Puis on applique roiStrategy pour la gestion sortie TP et DCA
 */
export const combineWithRoi = (
  asset: Asset,
  strategies: Strategy[],
  opts: CombineWithRoiOptions = {}
): Strategy => {
  const { op = "OR", targetRoi = 5, dcaThreshold = -25 } = opts;

  const base = op === "AND" ? andStrategy(asset, strategies) : orStrategy(asset, strategies);
  const withRoi = roiStrategy(asset, base, targetRoi, dcaThreshold);
  return withRoi;
};
