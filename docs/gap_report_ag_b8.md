# Gap Report - AG-B8: Fix-It & Retest MVP

Version: v1.0
Status: Complete
Batch: AG-B8
Owner: Antigravity Pair-Coding Agent

---

## Executive Summary

The complete Fix-It Studio and Factory Candidate MVP has been successfully established. Row-Level Security (RLS) policies are active across all 8 new tables (`rca_cases`, `patch_tickets`, `patch_artifact_changes`, `retest_plans`, `retest_runs`, `post_patch_lift_snapshots`, `factory_reuse_candidates`, `fixit_playbook_rules`). 

The non-negotiable compliance rules are programmatically locked: every patch is a hypothesis, RCA cases represent structured hypotheses, patch success requires a completed retest run, guardrail regressions (like Brand Semantic Fidelity drops >5%) automatically override positive lifts, and factory promotion requires positive lifts, zero critical regressions, and strategist signoffs. The Vitest suite verifies 100% of these compliance gate conditions. The following non-blocking technical gaps have been identified and deferred.

---

## Active Gaps List

### Gap 1: Simulated Crawler Retest Runs
*   **Gap ID**: B08-GAP-001
*   **Severity**: Low
*   **Area**: Observational Retesting
*   **Description**: Post-patch retest runs execute observation crawls using mock residential crawler scores mapped against baselines, rather than launching live, distributed selenium nodes across actual generative search assistants in real-time.
*   **Impact**: Crawls are lightning fast and statistically reproducible but rely on sandboxed score approximations.
*   **Recommended Fix**: Connect active crawler clusters during production integration phases.
*   **Release Decision**: Non-blocking. Aligned with AG-B8 MVP scope boundaries.

### Gap 2: JSON Payload Comparison Over active Git Diffs
*   **Gap ID**: B08-GAP-002
*   **Severity**: Low
*   **Area**: UI / Artifact Changes
*   **Description**: The artifact changes page highlights original vs modified payloads as raw JSON structures side-by-side rather than integrating an interactive monaco-editor Git diff canvas highlighting line-by-line additions and deletions.
*   **Impact**: Functional and highly accurate for state audits, but provides a raw payload audit experience rather than visual code lines.
*   **Recommended Fix**: Embed a dynamic Monaco Diff Editor package in subsequent workspace enhancements.
*   **Release Decision**: Post-MVP deferment. Non-blocking.

### Gap 3: Advanced Causal DAG Inference
*   **Gap ID**: B08-GAP-003
*   **Severity**: Low
*   **Area**: AI / Cause Hypothesis
*   **Description**: Root Cause Analysis is logged in text-based cause hypotheses by strategists or suggested by AI agents, rather than employing automated directed acyclic graph (DAG) structural causal engines or Do-calculus models to mathematically deduce metric correlations.
*   **Impact**: Completely compliant with the structured hypothesis principle, but relies on human strategist review to confirm physical causality.
*   **Recommended Fix**: Integrate a Bayesian Causal Inference engine post-MVP to automatically propose causal paths on metric snapshots graphs.
*   **Release Decision**: Post-MVP deferment.
