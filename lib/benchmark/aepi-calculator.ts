import { EntityReflectionSnapshot } from '../schema';

export class AepiCalculator {
  // [factoid, procedural, comparative, authority, schema, topical, geo]
  private static WEIGHT_PRESETS: Record<string, number[]> = {
    skincare:       [0.25, 0.15, 0.15, 0.20, 0.10, 0.10, 0.05],
    wedding_studio: [0.10, 0.10, 0.20, 0.15, 0.10, 0.15, 0.20],
    medical:        [0.30, 0.15, 0.10, 0.25, 0.10, 0.05, 0.05],
    default:        [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.10]
  };

  /**
   * Calculates the composite AEPI (AI Engine Presence Index) for a given snapshot and industry type
   */
  static calculate(snapshot: EntityReflectionSnapshot, industryType: string): number {
    const weights = this.WEIGHT_PRESETS[industryType] || this.WEIGHT_PRESETS.default;

    const errValues = [
      snapshot.err_factoid,
      snapshot.err_procedural,
      snapshot.err_comparative,
      snapshot.err_authority,
      snapshot.err_schema,
      snapshot.err_topical,
      snapshot.err_geo
    ];

    // 1. Calculate Base Weighted ERR Sum
    let baseWeightedSum = 0;
    for (let i = 0; i < errValues.length; i++) {
      baseWeightedSum += errValues[i] * weights[i];
    }

    // 2. Compute Tech Modifer (0.8 ~ 1.0)
    // 0.8 base + 0.2 scaling based on tech audit score
    const techScore = snapshot.tech_mod_score;
    const techModifier = 0.8 + 0.2 * (techScore / 100);

    // 3. Compute EEAT Modifier (0.8 ~ 1.0)
    const eeatScore = snapshot.eeat_mod_score;
    const eeatModifier = 0.8 + 0.2 * (eeatScore / 100);

    // 4. Calculate Final Index
    const aepi = baseWeightedSum * techModifier * eeatModifier;

    // Round to 1 decimal place
    return parseFloat(Math.min(100, Math.max(0, aepi)).toFixed(1));
  }

  /**
   * Get the weight preset for an industry
   */
  static getWeights(industryType: string): number[] {
    return this.WEIGHT_PRESETS[industryType] || this.WEIGHT_PRESETS.default;
  }
}
