# Gap Report - AG-B2: Brand Truth MVP

Version: v1.0
Status: Complete
Batch: AG-B2
Owner: Antigravity Pair-Coding Agent

---

## Executive Summary

The core Strategic, Operational, and Observed claim separations have been strictly established. PostgreSQL Row-Level Security policies are active for all tables. The L0–L4 Truth Lock Gate evaluation engine compiles successfully, and all security unit tests have passed. The following non-blocking technical gaps have been identified and deferred.

---

## Active Gaps List

### Gap 1: Mock AI Extraction Agent Pipeline
*   **Gap ID**: B02-GAP-001
*   **Severity**: Low
*   **Area**: AI / Observatory
*   **Description**: The Brand Truth Extraction Agent scaffold (`lib/ai/truth_extractor.ts`) parses crawled source text using deterministic mock keyword maps rather than executing a live LLM API endpoint (e.g. Gemini API).
*   **Impact**: Crawling outputs are simulated and deterministic.
*   **Recommended Fix**: Connect an active LLM provider API endpoint inside the Observatory & Metrics wave (AG-B6).
*   **Release Decision**: Deferred to AG-B6. Non-blocking.

### Gap 2: Manual OCR Document Uploading
*   **Gap ID**: B02-GAP-002
*   **Severity**: Low
*   **Area**: Document Ingestion / Evidence
*   **Description**: The Evidence Library uploader page accepts metadata titles, URL links, and manual copy-pasted text summaries, but does not perform active OCR (Optical Character Recognition) file scanning on raw PDF uploads.
*   **Impact**: Strategists must manually paste relevant clinical summaries rather than uploading raw scans directly.
*   **Recommended Fix**: Integrate PDF-extract or OCR APIs post-MVP.
*   **Release Decision**: Post-MVP deferment.

### Gap 3: Automated Discrepancy Reconciliation
*   **Gap ID**: B02-GAP-003
*   **Severity**: Medium
*   **Area**: Fix-It Studio
*   **Description**: Discrepancies between operational claims and scraped third-party results (Truth Deltas) are logged successfully, but the system relies on manual strategist reviews and does not auto-generate patch ticket proposals.
*   **Impact**: Strategists must manually write alignment patches.
*   **Recommended Fix**: Build automated multi-agent patch proposal pipelines (aligned with OQ-P2-003).
*   **Release Decision**: Deferred to Fix-It Studio MVP (AG-B8).
