# Repository Handoff Summary

Release Candidate: RC-1  
Product: Brand Semantic Website OS MVP  

---

## 1. Directory Structure Mappings

*   **`db/migrations/`**: Governed migration hierarchy.
    *   `0001_core.sql`: Workspaces, members, and domain skeletons.
    *   `0002_brand_truth.sql`: Strategic, operational, and observed claims + evidence.
    *   `0003_semantic_core.sql`: Question signal hierarchies, canonical questions, and claim lineages.
    *   `0004_representation_surface.sql`: Factual objects, surface contracts, and page generation runs.
    *   `0005_persona_vibe.sql`: Persona specs, vibe specs, rating events, and dark pattern rules.
    *   `0006_observatory_metrics.sql`: Probe panels, observatory crawls, raw response audits, and 14+ math metrics.
    *   `0007_report_publisher_patch.sql`: Benchmark reports publisher, methodology disclaimers, and wording scanners.
    *   `0008_fixit_factory.sql`: RCA cases, patch tickets, retest runs, lift snapshots, and playbook triggers.
*   **`db/seed/`**: Idempotent seeder packages.
    *   `demo-core.ts`: Initial workspace and domain skeletons setup.
    *   `demo-full.ts`: Master orchestrator seeding K-Beauty, Convenience, and Wedding trace loops.
    *   `domains/`: Specific domain seed scripts (`k-beauty.ts`, `convenience-retail.ts`, `wedding.ts`).
    *   `utils.ts`: Shared seeder upsert helpers and caveats warnings.
*   **`app/actions/`**: Secure server-side business logic and DB connectors.
    *   `truth.ts`: Strategic operational vaults and evidence verifications.
    *   `semantic.ts`: Intent signal miners and lineages checkers.
    *   `objects.ts`: Surface contracts validators and page generator runs.
    *   `persona.ts`: PersonaSpec layer checkers and Vibe OS ratio tuners.
    *   `observatory.ts`: Frozen panel versioning, raw response audits, and 14+ metrics equations.
    *   `reports.ts`: Wording scanning compliance and export gates.
    *   `fixit.ts`: RCA hypotheses, retest executions, guardrails overrides, and factory promos.
    *   `release.ts`: Release gate evaluation auditor.
*   **`lib/`**:
    *   `schema.ts`: Complete 74 Zod schemas and TypeScript interface models.
    *   `logging.ts`: Mutation audits and exception errors structured logging contracts.
*   **`tests/`**: Comprehensive Vitest suite (`truth.test.ts`, `semantic.test.ts`, `objects.test.ts`, `persona.test.ts`, `observatory.test.ts`, `reports.test.ts`, `fixit.test.ts`, `demo.test.ts`, `hardening.test.ts`, `rls.test.ts`).

---

## 2. Core Server Actions Index

1.  **Brand Truth & Lineage**: `createStrategicClaim`, `verifyEvidence`, `evaluateLineageTraceGate`.
2.  **Presentation Surface**: `evaluateObjectReadiness`, `createSurfaceContract`, `evaluateSurfaceValidationGate`.
3.  **Vibe OS**: `createPersonaSpec`, `tunersVibeSpecs`, `checkDarkPatternGuardrail`.
4.  **Observatory & Math Metrics**: `freezeProbePanel`, `computeMetricSnapshot`, `createSemanticWebsiteLiftSnapshot`.
5.  **Benchmark Report**: `runUnsafeWordingCheck`, `evaluateReportExportGate`, `createReportExport`.
6.  **Fix-It & Factory**: `suggestRcaFromMetric`, `evaluatePatchPassGate`, `promoteFactoryReuseCandidate`.
