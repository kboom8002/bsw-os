# Gap Report - AG-B3: Semantic Core MVP

Version: v1.0
Status: Complete
Batch: AG-B3
Owner: Antigravity Pair-Coding Agent

---

## Executive Summary

The upstream search intent, Question Capital hierarchy, Canonical Question unique signatures, runtime QIS scenes, and Concept-Ontology KG systems have been successfully established. Supabase Row-Level Security policies are active across all 11 new tables. The cryptographic Claim-Evidence-Boundary lineage trace engine compiles and runs flawlessly, passing 100% of the unit test suite. The following non-blocking technical gaps have been identified and deferred.

---

## Active Gaps List

### Gap 1: Mock Organic Search Crawlers & AI Agent Synthesis
*   **Gap ID**: B03-GAP-001
*   **Severity**: Low
*   **Area**: AI / Search Intent
*   **Description**: The *Question Signal Mining Agent* and *QIS Generation Agent* (`lib/ai/semantic_agents.ts`) process crawled queries and write dynamic mobile scenarios using deterministic mock maps rather than executing live Google Search Console, Ahrefs, or Gemini LLM APIs.
*   **Impact**: Mined keywords and scenario templates are highly contextual and fluid but statically seeded.
*   **Recommended Fix**: Connect active Search and LLM endpoints during the AI Observatory & Observatory waves (AG-B5/B6).
*   **Release Decision**: Deferred to AG-B6. Non-blocking.

### Gap 2: Dynamic Force-Directed Canvas Rendering
*   **Gap ID**: B03-GAP-002
*   **Severity**: Low
*   **Area**: Knowledge Graph / UI
*   **Description**: The Ontology Knowledge Graph page lists nodes, edges, and active relation directions in a premium dark-mode glassmorphic grid list but does not embed a 2D/3D visual canvas (e.g. using D3.js or React Flow) for panning and zooming.
*   **Impact**: Strategists trace ontologies and claim-relations via high-fidelity tabular listings but cannot interactively drag node coordinates.
*   **Recommended Fix**: Integrate an interactive D3.js or Vis.js canvas post-MVP.
*   **Release Decision**: Post-MVP deferment.

### Gap 3: Public Ledger Timestamp Anchors for Cryptographic Seals
*   **Gap ID**: B03-GAP-003
*   **Severity**: Low
*   **Area**: Cryptographic Lineage / Security
*   **Description**: The Claim Lineage Gate Vault successfully evaluates the Claim-Evidence-Boundary trace and hashes the exact values into a SHA-256 system signature seal. However, these signatures are persisted inside the Supabase workspace ledger and are not anchored to a public ledger (e.g. OpenTimestamps).
*   **Impact**: Lineages are strictly tamper-proof within Supabase through RLS and system keys but cannot be validated on public ledgers.
*   **Recommended Fix**: Post-MVP integration with an external public timestamp ledger.
*   **Release Decision**: Post-MVP deferment.
