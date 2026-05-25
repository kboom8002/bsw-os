# 02_cross_module_refs.md

Version: v2.0-draft  
Status: Cross-module references  
Product: Brand Semantic Website OS

---

## Common Reference Patterns

```text
workspace_id
domain_id
brand_entity_id
source_*_ids
linked_*_ids
*_refs
source_artifacts JSONB
```

---

## Important Links

```text
QIS → CQ
QIS → Question Capital
Claim → Evidence/Boundary
Object → QIS/Concept/Claim/Evidence/Boundary
Surface → Objects/QIS
Page → Surface/Objects/QIS
Probe Question → QIS
Judgment → Probe Run
Metric Snapshot → Observation Run/Panel
Report → Metric Snapshot/Methodology
Patch → RCA/Artifacts
Lift → Baseline/Retest Metrics
Factory Candidate → Patch/Lift
```
