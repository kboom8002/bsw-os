export interface DeepDiveSession {
  id: string;
  workspace_id: string;
  brand_slug: string;
  brand_name: string;
  status: 'pending' | 'diagnosing' | 'discovered' | 'blueprinted' | 'simulated' | 'completed';
  diagnostic_snapshot?: DeepDiveDiagnostic;
  subscription_tier: string;
  created_at: string;
  completed_at?: string;
}

export interface DeepDiveDiagnostic {
  dmri: {
    value: number;
    components: Record<string, number>;
  };
  benchmarkSnapshot: {
    aas: number; ocr: number; bsf: number; bair: number;
    bdr: number; cwr: number; iri: number; opp: number;
    rank: number; totalBrands: number;
    mentionQuality?: {
      strongRate: number;
      neutralRate: number;
      negativeRate: number;
    };
  };
  opportunityReport: {
    brand_slug: string;
    brand_name: string;
    total_opportunities: number;
    high_priority_count: number;
    opportunities: Array<{
      type: 'gap' | 'volatile' | 'weak_mention' | 'dominance' | 'blind_spot';
      severity: 'high' | 'medium' | 'low';
      question_text: string;
      eeat_dimension: 'expertise' | 'experience' | 'authority' | 'trust';
      recommendation_ko: string;
      priority_score: number;
    }>;
    eeat_summary: { expertise_gaps: number; experience_gaps: number; authority_gaps: number; trust_gaps: number };
    top_action_items: string[];
  };
  truthAudit: {
    strategicTruthExists: boolean;
    operationalClaims: { total: number; approved: number; restricted: number };
    evidenceCoverage: number;
    boundaryCoverage: number;
    lineageSealed: number;
    gateLevel: 'L0' | 'L1' | 'L2' | 'L3' | 'L4';
  };
  semanticAudit: {
    questionCapitalNodes: number;
    canonicalQuestions: number;
    qisScenes: number;
    linkageRate: number;
    conceptsCount: number;
    ontologyNodeCount: number;
  };
  questionDetails?: any[];
}

export interface TargetQuestionCandidate {
  id?: string;
  question_text: string;
  sources: Array<{
    type: 'opportunity_gap' | 'cross_map_red' | 'blind_spot' | 'volatile_loss' | 'weak_mention' | 'signal_mined' | 'niche_discovery';
    source_detail: string;
    priority_score: number;
  }>;
  composite_priority: number;
  eeat_dimension: 'expertise' | 'experience' | 'authority' | 'trust';
  current_ai_coverage: 'none' | 'sparse' | 'moderate' | 'saturated';
  competitors_owning: string[];
  estimated_aepi_impact: number;
  estimated_bdr_delta: number;
  first_mover_window_days: number;
  
  /** 니치 질문인 경우, 연관된 정규(Canonical) 질문 */
  niche_parent_question?: string;
  /** 니치 질문의 공략 난이도 (0~100, 낮을수록 쉬움) */
  niche_difficulty?: number;
  /** 니치 질문의 정규 질문 대비 관련도 (0~100) */
  niche_relevance?: number;
  
  registered_cq_id?: string;
  admin_approval_status?: 'pending' | 'approved' | 'rejected';
  user_decision?: 'pending' | 'accepted' | 'rejected' | 'deferred';
}

export interface ContentBlueprint {
  id?: string;
  target_question_id: string;
  target_cq_id?: string;
  content_type: string;
  title_suggestion_ko: string;
  heading_structure: Array<{
    level: 'h2' | 'h3';
    text: string;
    target_keyword: string;
    is_question_heading: boolean;
  }>;
  expected_layer: {
    must_include: string[];
    strongly_recommended: string[];
    should_include: string[];
    caution: string[];
    must_not_do: string[];
  };
  schema_suggestions: Array<{
    type: string;
    properties: Record<string, string>;
  }>;
  linked_evidence_ids: string[];
  linked_claim_ids: string[];
  linked_boundary_ids: string[];
  prescription_source: {
    quadrant: 'red' | 'yellow' | 'white';
    prescription_type: string;
    gap_detail: string;
  };
  estimated_aepi_impact: number;
  estimated_bdr_delta: number;
  priority_rank: number;
  structured_links?: Array<{ type: string; url: string; anchor_text: string }>;
}
