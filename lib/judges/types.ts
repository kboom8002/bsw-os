// === Concept Extractor Types ===
export interface ExtractedConcept {
  concept_id: string;
  label: string;
  present: boolean;
  accuracy: 0 | 0.5 | 1;
  matched_expression: string | null;
  rank: number;
  evidence_bound: boolean;
  distortion: boolean;
  distortion_type: string | null;
  hallucinated: boolean;
  confidence: number;  // 0~1
}

export interface ExtractedRelation {
  source_concept_id: string;
  relation_type: string;
  target_concept_id: string;
  accuracy: number;
}

export interface ExtractedClaim {
  claim_text: string;
  source_sentence: string;
}

export interface ConceptExtractionResult {
  extracted_concepts: ExtractedConcept[];
  extracted_relations: ExtractedRelation[];
  extracted_claims: ExtractedClaim[];
}

// === Fidelity Judge Types ===
export interface FidelityJudgment {
  brand_concept_fidelity: number;
  subscores: {
    concept_transfer: number;
    relation_accuracy: number;
    differentiation_preservation: number;
    evidence_binding: number;
    forbidden_suppression: number;
    policy_alignment: number;
  };
  main_issue: string;
}

// === Distortion Judge Types ===
export interface DistortionItem {
  concept_id: string;
  distortion_type: 'category_distortion' | 'function_distortion' |
    'claim_distortion' | 'policy_distortion' | 'boundary_distortion';
  severity: 1 | 2 | 3 | 4 | 5;
  response_expression: string;
  correct_definition: string;
  reason: string;
}

export interface DistortionJudgment {
  distortions: DistortionItem[];
  concept_distortion_rate: number;
}

// === Hallucination Judge Types ===
export interface HallucinationItem {
  claim: string;
  support_status: 'supported' | 'inferred' | 'unsupported';
  hallucination_type?: 'unsupported_claim' | 'unsupported_service' |
    'unsupported_comparison' | 'unsupported_policy' | 'unsupported_safety_claim';
  severity: 1 | 2 | 3 | 4 | 5;
  reason: string;
}

export interface HallucinationJudgment {
  claims: HallucinationItem[];
  hallucinated_concept_rate: number;
}

// === Risk Judge Types ===
export interface RiskJudgment {
  risk_score: number;
  risk_items: {
    hallucination: number;
    brand_distortion: number;
    critical_missing: number;
    unsafe_cta: number;
    evidence_omission: number;
    regulated_claim_risk: number;
    trust_damage_tone: number;
  };
  floor_reason: string;
}

// === Policy Judge Types ===
export interface PolicyViolation {
  policy: string;
  severity: 1 | 2 | 3 | 4 | 5;
  reason: string;
}

export interface PolicyJudgment {
  policy_alignment: number;
  subscores: {
    answer_policy: number;
    cta_policy: number;
    evidence_policy: number;
    safety_policy: number;
    brand_tone: number;
  };
  violations: PolicyViolation[];
}

// === Brand SSoT Context ===
export interface BrandSSoTContext {
  brand_name: string;
  core_concepts: {
    concept_id: string;
    label: string;
    definition: string;
    importance_weight: number;
    evidence_sources: string[];
    allowed_expressions: string[];
    forbidden_expressions: string[];
  }[];
  forbidden_concepts: {
    concept_id: string;
    label: string;
    reason: string;
  }[];
  expected_relations: {
    source_concept_id: string;
    relation_type: string;
    target_concept_id: string;
  }[];
  policies: {
    answer_policy?: string;
    cta_policy?: string;
    evidence_policy?: string;
    safety_policy?: string;
    tone_policy?: string;
  };
}

// === QBS Item Context ===
export interface QBSItemContext {
  query_text: string;
  intent_type: string;
  required_concepts: string[];   // concept_ids
  optional_concepts: string[];
  forbidden_concepts: string[];
  expected_policy: {
    answer_mode?: string;
    cta_policy?: string;
    safety_policy?: string;
    evidence_required?: boolean;
    tone?: string;
  };
  importance_weight: number;
}

// === Pipeline Results ===
export interface JudgePipelineResult {
  concept_extraction?: ConceptExtractionResult & { id?: string };
  fidelity?: FidelityJudgment & { id?: string; grade?: string };
  distortion?: DistortionJudgment & { id?: string; severity_weighted_rate?: number };
  hallucination?: HallucinationJudgment & { id?: string; critical_count?: number };
  risk?: RiskJudgment & { id?: string };
  policy?: PolicyJudgment & { id?: string };
  errors?: string[];
}
