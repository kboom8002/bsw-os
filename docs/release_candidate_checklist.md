# Release Candidate Checklist

Release Candidate: RC-1  
Status: Passed  
Audit Timestamp: 2026-05-23  

---

## Programmatic Verification Checklist

### 1. Security & RLSHardening
- [x] **No service role in client**: Scanned all client directories (`app/`, `components/`) and verified that Supabase admin client instances are isolated server-side.
- [x] **RLS Enabled**: Enabled Row-Level Security across all 61+ tables in migrations `0001_core.sql` through `0008_fixit_factory.sql`.
- [x] **Workspace Isolation**: Verified that SELECT and WRITE queries are securely partitioned by `workspace_id` via `is_workspace_member` policy triggers.
- [x] **RBAC Mutation Rules**: Blocked non-elevated members (`executive_viewer`) and anonymous requests from executing mutations.

### 2. Upstream AI Safety & Observatory
- [x] **AI Candidate Defaults**: Proved that all AI-generated brand extractions, persona specifications, reports copies, and RCA suggestions default strictly to `'candidate'` status until manual strategist approved signoffs are recorded.
- [x] **Mandatory Proxy Caveats**: Confirmed that all benchmark reports and indices dashboards dynamically append the standard proxy caveats notice, satisfying K-Beauty and event venue regulatory disclosures.
- [x] **Freezable Probe Panels**: Verified that probe panels configurations lock securely (`is_locked` = TRUE), blocking observations and lift computations if target versions vary.
- [x] **Raw response persistence**: Proved that observatory providers store physical copies of crawlers' raw responses text inside the `probe_runs` table for statistical audits.

### 3. Closed-Loop Optimization (Fix-It)
- [x] **Structured Hypotheses**: Confirmed that RCA cases require cause hypotheses and patch tickets require patch hypotheses.
- [x] **No patch success without retest**: Proved that `evaluatePatchPassGate` blocks patch tickets from clearing until they link to a completed retest run.
- [x] **Guardrail Regression Alarms**: Verified that drops in Brand Semantic Fidelity (BSF > 5%) or new dark patterns override ARS lift scores, locking the gate.

### 4. Domain Seeds E2E Blueprints
- [x] **K-Beauty (PureBarrier)**: Seeded trust-focused skincare routines, Global Derm trials evidence, and YMYL safety boundaries.
- [x] **Convenience Retail (Quick25)**: Seeded menus, stock locators, AEO local action maps, and GS25/CU feature flags.
- [x] **Wedding Services (Lumiere Hall)**: Seeded packages compare matrices and contracts across halls, studios, dresses, and makeup categories.
