// ===== Standard Attractor Types (9종) =====
export type AttractorType =
  | 'discovery'
  | 'problem_clarification'
  | 'anxiety_reducer'
  | 'trust'
  | 'evidence'
  | 'comparison_anchor'
  | 'aspiration'
  | 'conversion_trigger'
  | 'ecosystem';

export type AttractorScope = 'domain' | 'brand';
export type AttractorStatus = 'draft' | 'active' | 'deprecated';
export type ChannelType = 'homepage' | 'answer_card' | 'chatbot' | 'cardnews' | 'ad' | 'sales_script' | 'llm_txt';
export type GapType = 'missing_attractor' | 'weak_attractor' | 'misaligned_attractor' | 'overused_attractor' | 'unsafe_attractor' | 'broken_media_soliton' | 'conversion_gap' | 'trust_gap';
export type VibeLevel = 'low' | 'medium' | 'high';
export type ClaimStrength = 'none' | 'limited' | 'supported' | 'strong';

// ===== Context Tensor (7축) =====
export interface ContextTensor {
  domain: string;
  user_state: string;
  risk_state: 'low' | 'medium' | 'high' | 'uncertain';
  intent_state: string;
  evidence_state: string;
  time_state: string;
  channel_state: ChannelType;
}

// ===== Vibe Signature (L0-L3) =====
export interface VibeSignature {
  L0_core_affect: { valence: string; arousal: VibeLevel; control: VibeLevel };
  L1_expressive_style: {
    warmth_style: VibeLevel;
    precision: VibeLevel;
    energy: VibeLevel;
    sophistication: VibeLevel;
    novelty: VibeLevel;
    intimacy: VibeLevel;
    authenticity: VibeLevel;
  };
  L2_motivational_affordance: {
    autonomy_support: VibeLevel;
    competence_support: VibeLevel;
    relatedness_support: VibeLevel;
    promotion_frame: VibeLevel;
    prevention_frame: VibeLevel;
  };
  L3_social_appraisal: {
    warmth: VibeLevel;
    competence: VibeLevel;
    trust: VibeLevel;
    fairness: VibeLevel;
    agency: VibeLevel;
  };
  avoid_vibe: string[];
}

// ===== Vibe Scoring Result =====
export interface VibeLayerScore {
  layer: string;
  dimension: string;
  observed_evidence: string;
  interpretation: string;
  score: VibeLevel;
  confidence: number;       // 0-1
  uncertainty: string;
  suggested_validation: string;
}

export interface VibeAssessmentResult {
  layer_scores: VibeLayerScore[];
  overall_alignment: number;  // 0-1, target vs actual
  misaligned_dimensions: string[];
  avoid_vibe_violations: string[];
}

// ===== Pattern Attractor =====
export interface PatternAttractorSpec {
  id: string;
  version: string;
  status: AttractorStatus;
  type: AttractorType[];
  scope: AttractorScope;
  domain: { id: string; name: string; subdomain?: string };
  brand_id?: string;
  natural_definition: string;

  trigger_state: {
    user_question_patterns: string[];
    context_requirements: string[];
    risk_state: { level: 'low' | 'medium' | 'high' | 'uncertain' };
    intent_state: string[];
    missing_context: string[];
  };

  concept_state: {
    required_concepts: string[];
    allowed_concepts: string[];
    forbidden_concepts: string[];
  };

  evidence_anchor: {
    required_sources: string[];
    evidence_visibility_rule: string;
    claim_strength_limit: ClaimStrength;
  };

  vibe_signature: VibeSignature;
  action_policy: {
    allowed_actions: string[];
    blocked_actions: string[];
    cta_policy: { primary: string; secondary: string[]; blocked: string[] };
    safety_policy: { boundary_notes: string[]; escalation_conditions: string[] };
  };

  media_soliton_rule: {
    core_proposition: string;
    evidence_anchor: string;
    cta_vector: string;
    channel_adaptation_rules: Record<ChannelType, string>;
  };

  target_state: {
    cognitive: string[];
    affective: string[];
    motivational: string[];
    behavioral: string[];
  };

  metrics: Record<string, string>;
  failure_modes: string[];
  recomposition_rule: { if_failed_then: string[] };
}

// ===== Attractor Fit Score =====
export interface AttractorFitResult {
  attractor_id: string;
  total_score: number;
  breakdown: {
    concept_match: number;
    context_fit: number;
    intent_fit: number;
    risk_policy_fit: number;
    evidence_availability: number;
    vibe_requirement_fit: number;
    forbidden_condition_penalty: number;
  };
  gate: 'activate' | 'conditional' | 'skip';
}

// ===== Media Soliton =====
export interface MediaSolitonAsset {
  channel: ChannelType;
  content: string;
  metadata: Record<string, unknown>;
  preservation_scores: {
    proposition_preserved: number;  // 0-1
    evidence_preserved: number;
    vibe_preserved: number;
    cta_preserved: number;
    overall: number;
  };
}

// ===== Run Receipt =====
export interface RunReceipt {
  session_id: string;
  attractor_id: string;
  brand_id?: string | null;
  input_query: string;
  concept_state: Record<string, unknown>;
  context_tensor: ContextTensor;
  vibe_spec: VibeSignature;
  output_variant: string;
  channel_type: ChannelType;
  cta_shown: string[];
  cta_clicked: string[];
  user_behavior: Record<string, unknown>;
  human_feedback: Record<string, unknown>;
  detected_gaps: GapType[];
  scores: {
    attractor_fit: number;
    vibe_alignment: number;
    policy_compliance: number;
  };
}

// ===== Domain Pack (YAML) =====
export interface DomainPackYaml {
  domain_pack: {
    id: string;
    domain: string;
    subdomain: string;
    version: string;
    primary_question_space: string[];
    domain_uncertainty: string[];
    standard_attractors: PatternAttractorSpec[];
    critical_gaps_to_watch: string[];
  };
}

// ===== Gap Report =====
export interface AttractorGapReport {
  brand_id: string;
  domain_id: string;
  portfolio_score: number;
  gaps: Array<{
    gap_type: GapType;
    attractor_id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    affected_query_states: string[];
    diagnosis: string;
    recommended_fix: string;
  }>;
  recomposition_tasks: string[];
}
