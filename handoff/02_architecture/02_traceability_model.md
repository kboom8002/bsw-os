# 02_traceability_model.md

Version: v2.0-draft  
Status: Traceability model  
Product: Brand Semantic Website OS

---

## Traceability Chain

```text
Truth
→ Question Capital
→ CQ
→ QIS
→ Concept/KG
→ Claim
→ Object
→ Surface
→ Page
→ Export
→ Probe
→ Judgment
→ Metric
→ Report
→ RCA
→ Patch
→ Retest
→ Lift
→ Factory Candidate
```

---

## Traceability Carriers

```text
*_refs arrays
JSONB source_artifacts
source_observation_run_ids
source_metric_snapshot_ids
audit_events
agent_runs
release_gate_results
```

---

## Principle

No downstream artifact should be untraceable if it informs publication, metrics, report, or patch success.
