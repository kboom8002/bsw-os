export interface BMriResult {
  value: number;
  components: {
    AAS: number;
    OCR: number;
    BSF: number;
    QTC: number;
    GCTR: number;
    ARS: number;
    competitivePositionScore: number;
    confidencePenalty: number;
    volatilityPenalty: number;
  };
}

export function computeBMRI(
  AAS: number,
  OCR: number,
  BSF: number,
  QTC: number,
  GCTR: number,
  ARS: number,
  competitorAas: number,
  confidencePenalty: number,
  volatilityPenalty: number
): BMriResult {
  // Competitive_Position_Score = max(0, target_AAS/100 - competitor_AAS/100 + 0.5) * 100
  // Or in percentage scale: max(0, AAS - competitorAas + 50)
  const targetAAS = AAS;
  const competitivePositionScore = Math.max(0, targetAAS - competitorAas + 50);

  // B-MRI Formula:
  // 0.20*AAS + 0.15*OCR + 0.20*BSF + 0.15*QTC + 0.15*GCTR + 0.10*ARS + 0.05*Competitive_Position_Score - confidence_penalty - volatility_penalty
  // Note: All inputs are in 0-100 scale (percentages), penalties are also scaled appropriately.
  // Wait, confidence_penalty = (1-confidence)*0.10. Since confidence is e.g. 0.95, penalty is 0.005.
  // Wait! In 100-based scale, penalty would be scaled by 100: penalty * 100.
  // Let's make sure the output fits the standard 0-100 percentage range.
  const bMriRaw = 
    (0.20 * AAS) + 
    (0.15 * OCR) + 
    (0.20 * BSF) + 
    (0.15 * QTC) + 
    (0.15 * GCTR) + 
    (0.10 * ARS) + 
    (0.05 * competitivePositionScore) - 
    (confidencePenalty * 100) - 
    (volatilityPenalty * 100);

  const value = Number(Math.max(0, Math.min(100, bMriRaw)).toFixed(2));

  return {
    value,
    components: {
      AAS,
      OCR,
      BSF,
      QTC,
      GCTR,
      ARS,
      competitivePositionScore: Number(competitivePositionScore.toFixed(2)),
      confidencePenalty,
      volatilityPenalty
    }
  };
}
