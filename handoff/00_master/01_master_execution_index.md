# 01_master_execution_index.md

Version: v2.0-draft  
Status: Master execution index  
Product: Brand Semantic Website OS

---

## Batch Index

| Batch | Name | Primary Output |
|---|---|---|
| AG-B0/B1 | Repo Foundation + Supabase Schema/RLS | bootable app + core DB/RLS |
| AG-B2 | Brand Truth MVP | truth/evidence/boundary/gate |
| AG-B3 | Semantic Core MVP | question/QIS/TCO/KG/claim lineage |
| AG-B4 | Object / Surface / Website MVP | objects/surfaces/pages/export |
| AG-B5 | Persona / Vibe MVP | PersonaSpec + Vibe OS |
| AG-B6 | Observatory / Metrics MVP | panels/runs/judgments/metrics |
| AG-B7 | Report Publisher MVP | benchmark reports/export gate |
| AG-B8 | Fix-It MVP | RCA/patch/retest/lift/factory candidate |
| AG-B9 | Domain Demo Flows | 3-domain full-loop demo |
| AG-B10 | Hardening / Release Gate | security/RLS/tests/go-no-go |

---

## Minimum Build Rule

Do not jump to downstream modules before upstream contracts exist.

Correct order:

```text
Core → Truth → Questions/Semantics → Objects/Website → Persona/Vibe → Observatory → Reports → Fix-It → Demo → Hardening
```

---

## Acceptance Rule

Each batch must produce:

```text
migration or schema patch when needed
server action contract
UI route/screen scaffold
AI agent scaffold if relevant
tests or test scaffold
gap report
review checklist
```
