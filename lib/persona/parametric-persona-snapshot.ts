import { CognitiveIntensityMetrics } from './cognitive-intensity-scorer';
import { VibeAlignmentResult } from './vibe-drift-detector';
import { ParameterValues, StatisticalDistribution } from './statistical-prober';
import { FidelityAggregatorResult } from './fidelity-aggregator';

export interface ParametricPersonaSnapshot {
  id?: string;
  workspace_id: string;
  website_url: string;
  brand_name: string;
  industry: string;
  engine_name: string;
  tier: 'free' | 'tier1' | 'tier1.5' | 'tier2' | 'tier3';
  measured_at: string;
  
  cognitive_intensity: {
    overall: CognitiveIntensityMetrics;
    b2c?: CognitiveIntensityMetrics;
    b2b?: CognitiveIntensityMetrics;
    gap_analysis?: {
      b2b_b2c_delta: number;
      weaker_model: 'B2B' | 'B2C' | 'BALANCED';
      recommendation_ko: string;
    };
  };
  
  b2c_distributions?: Record<keyof ParameterValues, StatisticalDistribution>;
  b2b_distributions?: Record<keyof ParameterValues, StatisticalDistribution>;
  
  vibe_alignment?: {
    b2c?: VibeAlignmentResult;
    b2b?: VibeAlignmentResult;
  };
  
  cognitive_map?: {
    b2c?: { auto_associations: string[]; competitive_frame: string[]; };
    b2b?: { auto_associations: string[]; competitive_frame: string[]; };
  };
  
  total_probes: number;
  total_llm_calls: number;

  // V3.0 Simulation Results (Tier 3 Only)
  fidelity_simulation?: {
    baseline_result: FidelityAggregatorResult;
    conditioned_result: FidelityAggregatorResult;
    persona_spec_yaml: string;
    delta_score: number;
  };
  
  delta_from_previous?: {
    cognitive_intensity_delta: number;
    vibe_alignment_delta: number;
    drifted_axes_change: string[];
  };
}
