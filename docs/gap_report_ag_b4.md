# Gap Report - AG-B4: Object / Surface / Website MVP

Version: v1.0
Status: Complete
Batch: AG-B4
Owner: Antigravity Pair-Coding Agent

---

## Executive Summary

The object-first presentation layers, layout contracts, visual segment compositions, Google JSON-LD mappers, and AI AEO Markdown generators have been successfully established. Supabase Row-Level Security policies are active across all 8 new tables. The Object Readiness Gate, Surface Validation Gate, and Schema Mapping Validator compile and run cleanly, passing 100% of the unit test suite. The following non-blocking technical gaps have been identified and deferred.

---

## Active Gaps List

### Gap 1: Mock Presentation Synthesis & AI Agents
*   **Gap ID**: B04-GAP-001
*   **Severity**: Low
*   **Area**: AI / Compositions
*   **Description**: The *Representation Object Agent* and *Surface/Page Composer Agent* (`lib/ai/objects_agents.ts`) compose visual pages and property blocks using mock synthesis mapping logic rather than triggering live Gemini LLM APIs.
*   **Impact**: Spec properties and visual segment texts are highly fluid and compliant but statically structured.
*   **Recommended Fix**: Connect active LLM pipelines post-MVP during the AI Observatory waves (AG-B5/B6).
*   **Release Decision**: Deferred to AG-B6. Non-blocking.

### Gap 2: Drag-and-Drop builder canvas
*   **Gap ID**: B04-GAP-002
*   **Severity**: Low
*   **Area**: UI / Surfaces
*   **Description**: The Surface Contracts page lists allowed objects and required visual blocks in structured, interactive checklists and builder parameters but does not embed a graphical drag-and-drop grid interface.
*   **Impact**: Strategists map allowed spec items and mandatory disclosures via tabular forms but cannot drag layout columns.
*   **Recommended Fix**: Integrate a Vis.js or HTML5 Drag-and-Drop canvas grid post-MVP.
*   **Release Decision**: Post-MVP deferment.

### Gap 3: Public CMS Domain Publishers
*   **Gap ID**: B04-GAP-003
*   **Severity**: Low
*   **Area**: Website pre-rendering / Publishing
*   **Description**: The Website Studio pre-renders dynamic visible semantic pages and generates SEO/AEO export payloads. However, active publishing to live public domains (such as real Shopify or WordPress endpoints) is disabled for safety MVPs.
*   **Impact**: Pre-rendered visible pages are previewed inside the high-fidelity detailed Preview Vault but are not pushed live.
*   **Recommended Fix**: Build E2E public publishing APIs post-MVP.
*   **Release Decision**: Post-MVP deferment.
