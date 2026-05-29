-- Migration 0023: Concept Fidelity Judges
-- Created at 2026-05-28

-- 1. concept_extraction_results: ConceptExtractor Judge 결과
CREATE TABLE concept_extraction_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_run_id UUID REFERENCES probe_runs(id) ON DELETE CASCADE NOT NULL,
  extracted_concepts JSONB NOT NULL,
  extracted_relations JSONB DEFAULT '[]'::jsonb,
  extracted_claims JSONB DEFAULT '[]'::jsonb,
  judge_model VARCHAR(100) DEFAULT 'gemini-2.5-flash',
  judge_temperature NUMERIC(3,2) DEFAULT 0.0,
  raw_judge_output TEXT,  -- 감사용 원시 LLM 출력 보관
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. fidelity_judgments: Brand Concept Fidelity Judge 결과
CREATE TABLE fidelity_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_run_id UUID REFERENCES probe_runs(id) ON DELETE CASCADE NOT NULL,
  concept_extraction_id UUID REFERENCES concept_extraction_results(id),
  brand_concept_fidelity NUMERIC(5,4) NOT NULL,
  concept_transfer NUMERIC(5,4),
  relation_accuracy NUMERIC(5,4),
  differentiation_preservation NUMERIC(5,4),
  evidence_binding NUMERIC(5,4),
  forbidden_suppression NUMERIC(5,4),
  policy_alignment NUMERIC(5,4),
  main_issue TEXT,
  grade CHAR(1) NOT NULL CHECK (grade IN ('A','B','C','D','F')),
  raw_judge_output TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. distortion_judgments: Concept Distortion Judge 결과
CREATE TABLE distortion_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_run_id UUID REFERENCES probe_runs(id) ON DELETE CASCADE NOT NULL,
  concept_extraction_id UUID REFERENCES concept_extraction_results(id),
  distortions JSONB NOT NULL DEFAULT '[]'::jsonb,
  concept_distortion_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  severity_weighted_rate NUMERIC(5,4) DEFAULT 0,
  raw_judge_output TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. hallucination_judgments: Hallucination Judge 결과
CREATE TABLE hallucination_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_run_id UUID REFERENCES probe_runs(id) ON DELETE CASCADE NOT NULL,
  concept_extraction_id UUID REFERENCES concept_extraction_results(id),
  claims JSONB NOT NULL DEFAULT '[]'::jsonb,
  hallucinated_concept_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  raw_judge_output TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. risk_judgments: Floor Risk Judge 결과
CREATE TABLE risk_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_run_id UUID REFERENCES probe_runs(id) ON DELETE CASCADE NOT NULL,
  risk_score NUMERIC(5,4) NOT NULL DEFAULT 0,
  hallucination_risk NUMERIC(5,4) DEFAULT 0,
  brand_distortion_risk NUMERIC(5,4) DEFAULT 0,
  critical_missing_risk NUMERIC(5,4) DEFAULT 0,
  unsafe_cta_risk NUMERIC(5,4) DEFAULT 0,
  evidence_omission_risk NUMERIC(5,4) DEFAULT 0,
  regulated_claim_risk NUMERIC(5,4) DEFAULT 0,
  trust_damage_risk NUMERIC(5,4) DEFAULT 0,
  floor_reason TEXT,
  raw_judge_output TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. policy_judgments: Policy Alignment Judge 결과
CREATE TABLE policy_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_run_id UUID REFERENCES probe_runs(id) ON DELETE CASCADE NOT NULL,
  policy_alignment NUMERIC(5,4) NOT NULL DEFAULT 0,
  answer_policy NUMERIC(5,4) DEFAULT 0,
  cta_policy NUMERIC(5,4) DEFAULT 0,
  evidence_policy NUMERIC(5,4) DEFAULT 0,
  safety_policy NUMERIC(5,4) DEFAULT 0,
  brand_tone NUMERIC(5,4) DEFAULT 0,
  violations JSONB DEFAULT '[]'::jsonb,
  raw_judge_output TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE concept_extraction_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fidelity_judgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE distortion_judgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hallucination_judgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_judgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_judgments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (workspace 격리)
CREATE POLICY cer_rls ON concept_extraction_results
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY fj_rls ON fidelity_judgments
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY dj_rls ON distortion_judgments
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY hj_rls ON hallucination_judgments
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY rj_rls ON risk_judgments
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY pj_rls ON policy_judgments
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- Indexes
CREATE INDEX idx_cer_probe_run ON concept_extraction_results(probe_run_id);
CREATE INDEX idx_cer_workspace ON concept_extraction_results(workspace_id);
CREATE INDEX idx_fj_probe_run ON fidelity_judgments(probe_run_id);
CREATE INDEX idx_dj_probe_run ON distortion_judgments(probe_run_id);
CREATE INDEX idx_hj_probe_run ON hallucination_judgments(probe_run_id);
CREATE INDEX idx_rj_probe_run ON risk_judgments(probe_run_id);
CREATE INDEX idx_pj_probe_run ON policy_judgments(probe_run_id);
