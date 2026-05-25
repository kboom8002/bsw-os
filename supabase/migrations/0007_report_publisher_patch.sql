-- Migration 0007_report_publisher_patch.sql
-- Module: Benchmark Report Publisher MVP

-- 1. report_sections
CREATE TABLE report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  benchmark_report_id UUID REFERENCES benchmark_reports(id) ON DELETE CASCADE NOT NULL,
  section_title VARCHAR(255) NOT NULL,
  section_body TEXT NOT NULL,
  section_type VARCHAR(50) DEFAULT 'executive_summary' NOT NULL, -- executive_summary, metrics_analysis, competitive_landscape, methodology_appendix
  status VARCHAR(50) DEFAULT 'candidate' NOT NULL, -- candidate, draft, completed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. report_exports
CREATE TABLE report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  benchmark_report_id UUID REFERENCES benchmark_reports(id) ON DELETE CASCADE NOT NULL,
  export_format VARCHAR(50) DEFAULT 'markdown' NOT NULL, -- markdown, html
  exported_payload TEXT NOT NULL,
  is_published BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. report_reviews
CREATE TABLE report_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  benchmark_report_id UUID REFERENCES benchmark_reports(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID NOT NULL,
  decision VARCHAR(50) NOT NULL, -- approved, rejected
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. report_gate_results
CREATE TABLE report_gate_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  benchmark_report_id UUID REFERENCES benchmark_reports(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) NOT NULL, -- pass, fail
  blocking_reasons VARCHAR[] DEFAULT '{}'::varchar[] NOT NULL,
  warnings VARCHAR[] DEFAULT '{}'::varchar[] NOT NULL,
  required_fixes VARCHAR[] DEFAULT '{}'::varchar[] NOT NULL,
  evaluated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. unsafe_wording_findings
CREATE TABLE unsafe_wording_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  benchmark_report_id UUID REFERENCES benchmark_reports(id) ON DELETE CASCADE NOT NULL,
  finding_type VARCHAR(100) NOT NULL, -- e.g. market_share, preference, hidden_preference, ranking
  offending_text TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE NOT NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_gate_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsafe_wording_findings ENABLE ROW LEVEL SECURITY;

-- Establish RLS Policies
-- 1. report_sections
CREATE POLICY section_read ON report_sections
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY section_write ON report_sections
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 2. report_exports
CREATE POLICY export_read ON report_exports
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY export_write ON report_exports
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 3. report_reviews
CREATE POLICY review_read ON report_reviews
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY review_write ON report_reviews
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 4. report_gate_results
CREATE POLICY rgate_read ON report_gate_results
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY rgate_write ON report_gate_results
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 5. unsafe_wording_findings
CREATE POLICY uwf_read ON unsafe_wording_findings
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY uwf_write ON unsafe_wording_findings
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- Relational indexes
CREATE INDEX idx_section_report ON report_sections(benchmark_report_id);
CREATE INDEX idx_export_report ON report_exports(benchmark_report_id);
CREATE INDEX idx_review_report ON report_reviews(benchmark_report_id);
CREATE INDEX idx_rgate_report ON report_gate_results(benchmark_report_id);
CREATE INDEX idx_uwf_report ON unsafe_wording_findings(benchmark_report_id);
