import { EntityReflectionSnapshot } from '../schema';

export interface AEPIBreakdown {
  composite: number;
  dimensions: Record<string, number>;
  tech_modifier: number;
  eeat_modifier: number;
  industry: string;
  weights_used: Record<string, number>;
}

export class AepiCalculator {
  // [factoid, procedural, comparative, authority, schema, topical, geo]
  private static WEIGHT_PRESETS: Record<string, Record<string, number>> = {
    skincare:       { factoid: 0.20, procedural: 0.15, comparative: 0.25, authority: 0.15, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.05 },
    wedding_studio: { factoid: 0.10, procedural: 0.10, comparative: 0.15, authority: 0.10, schema_org: 0.10, topical_cluster: 0.15, local_geo: 0.30 },
    medical:        { factoid: 0.25, procedural: 0.20, comparative: 0.10, authority: 0.25, schema_org: 0.10, topical_cluster: 0.05, local_geo: 0.05 },
    
    k_beauty:       { factoid: 0.15, procedural: 0.20, comparative: 0.25, authority: 0.10, schema_org: 0.10, topical_cluster: 0.15, local_geo: 0.05 },
    food_bev:       { factoid: 0.20, procedural: 0.15, comparative: 0.20, authority: 0.10, schema_org: 0.15, topical_cluster: 0.10, local_geo: 0.10 },
    education:      { factoid: 0.25, procedural: 0.15, comparative: 0.15, authority: 0.20, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.05 },
    pet_care:       { factoid: 0.20, procedural: 0.20, comparative: 0.20, authority: 0.15, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.05 },
    legal:          { factoid: 0.15, procedural: 0.15, comparative: 0.10, authority: 0.30, schema_org: 0.10, topical_cluster: 0.05, local_geo: 0.15 },
    finance:        { factoid: 0.20, procedural: 0.15, comparative: 0.15, authority: 0.25, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.05 },
    fashion:        { factoid: 0.10, procedural: 0.10, comparative: 0.30, authority: 0.10, schema_org: 0.10, topical_cluster: 0.25, local_geo: 0.05 },
    travel:         { factoid: 0.15, procedural: 0.15, comparative: 0.15, authority: 0.10, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.25 },
    real_estate:    { factoid: 0.15, procedural: 0.10, comparative: 0.15, authority: 0.15, schema_org: 0.10, topical_cluster: 0.05, local_geo: 0.30 },
    
    default:        { factoid: 0.15, procedural: 0.15, comparative: 0.15, authority: 0.15, schema_org: 0.15, topical_cluster: 0.15, local_geo: 0.10 },
  };

  /**
   * Calculates the composite AEPI
   */
  static calculate(snapshot: EntityReflectionSnapshot, industryType: string): number {
    return this.calculateWithBreakdown(snapshot, industryType).composite;
  }

  static calculateWithBreakdown(snapshot: EntityReflectionSnapshot, industryType: string): AEPIBreakdown {
    const weights = this.WEIGHT_PRESETS[industryType] || this.WEIGHT_PRESETS.default;
    const dimensions: Record<string, number> = {};
    
    let baseScore = 0;
    for (const [dim, weight] of Object.entries(weights)) {
      const errKey = `err_${dim}` as keyof EntityReflectionSnapshot;
      const dimScore = (snapshot[errKey] as number || 0);
      dimensions[dim] = dimScore;
      baseScore += dimScore * weight;
    }

    const techScore = snapshot.tech_mod_score;
    const techModifier = 0.8 + 0.2 * (techScore / 100);

    const eeatScore = snapshot.eeat_mod_score;
    const eeatModifier = 0.8 + 0.2 * (eeatScore / 100);

    const aepi = baseScore * techModifier * eeatModifier;
    
    return {
      composite: parseFloat(Math.min(100, Math.max(0, aepi)).toFixed(1)),
      dimensions,
      tech_modifier: parseFloat(techModifier.toFixed(3)),
      eeat_modifier: parseFloat(eeatModifier.toFixed(3)),
      industry: industryType,
      weights_used: weights,
    };
  }

  static getWeights(industryType: string): Record<string, number> {
    return this.WEIGHT_PRESETS[industryType] || this.WEIGHT_PRESETS.default;
  }
}
