# Known Limitations — Brand Semantic Website OS

Date: 2026-05-23  
Release Candidate: RC-1

This document records all known limitations, deferred features, and technical gaps in the MVP release. All items are Low severity and non-blocking.

---

## 1. AI & External API Integrations

### 1.1 Mock Observation Providers (B06-GAP-001, B08-GAP-001)

**Current**: Observatory crawlers and retest observation runs execute against sandboxed mock providers that return deterministic response data.

**Limitation**: No live AI model queries (Gemini, GPT, Perplexity) or residential proxy crawlers are executed in the MVP.

**Impact**: Metric scores (ARS, AAS, OCR, BSF) are statistically reproducible but reflect mock distributions rather than live AI answer engine behavior.

**Waiver**: WAIV-002 (AI Tech Lead, expires 2026-08-01).

**Recommended Fix**: Integrate production Gemini Pro API with provider abstraction layer. Implement residential proxy crawler pool for real observation runs.

---

### 1.2 Mock Signal Mining (B03-GAP-001)

**Current**: Signal source mining uses deterministic mock mappings for keyword signals and search intent data.

**Limitation**: No live integration with Google Search Console, Ahrefs, SEMrush, or LLM-based mining pipelines.

**Impact**: Question Capital and signal hierarchies are manually seeded rather than auto-discovered.

**Recommended Fix**: Integrate GSC Data API and Ahrefs API for automated signal mining.

---

### 1.3 Mock Report AI Drafting (B07-GAP-001)

**Current**: AI report executive summary sections are drafted using template-based mock logic rather than production Gemini API calls.

**Limitation**: Generated report prose is template-derived, not dynamically authored by LLM.

**Impact**: Report quality is consistent but lacks the nuance of LLM-generated analysis.

**Recommended Fix**: Wire `generateReportDraft` to Gemini Pro API with structured prompt templates.

---

## 2. Third-Party Data Integrations

### 2.1 GS25/CU Live Catalog Sync (B09-GAP-002)

**Current**: GS25 and CU convenience retail brands are integrated as visual selector flags with mock product data.

**Limitation**: No live franchise inventory API syndication. Product catalogs and stock availability are seeded statically.

**Impact**: Convenience Retail demos show the full trace loop but with static inventory data.

**Waiver**: WAIV-001 (Lead Strategist, expires 2026-08-01).

**Recommended Fix**: Integrate GS25/CU franchise API endpoints for real-time product catalog and stock locator data.

---

## 3. UI & Visualization

### 3.1 Knowledge Graph Visualization (B03-GAP-002)

**Current**: The Ontology Knowledge Graph displays nodes and edges in dark-mode grid/table views.

**Limitation**: No interactive force-directed graph canvas (e.g., D3.js or Cytoscape.js).

**Impact**: KG exploration is functional but lacks the interactive spatial navigation expected in graph tools.

**Recommended Fix**: Implement a force-directed graph renderer using D3.js or react-force-graph.

---

## 4. Vibe OS Mathematics

### 4.1 Cosine Similarity (B05-GAP-001)

**Current**: Vibe alignment tuner operates on ratio thresholds (e.g., warmth/authority balance ratios).

**Limitation**: No real-time vector embedding cosine similarity distance calculations.

**Impact**: Vibe alignment is mathematically valid via ratios but lacks the precision of embedding-space measurements.

**Recommended Fix**: Integrate text embedding model (e.g., text-embedding-004) for real-time cosine similarity computation.

---

## 5. Security & Observability

### 5.1 Runtime Bundle Scrubbing (B10-GAP-001)

**Current**: Service role key exposure is detected via build-time scanning in `hardening.test.ts` which recursively checks all `"use client"` files for `getSupabaseAdminClient` imports.

**Limitation**: No custom Turbopack/Webpack plugin automatically strips sensitive environment strings during bundle compilation.

**Impact**: Protection operates at build audit time rather than bundle compilation time. Build-time scanning provides equivalent detection confidence.

**Recommended Fix**: Implement a custom Turbopack compile plugin with regex-based environment string scrubbing.

---

### 5.2 Enterprise Audit Logging (B10-GAP-002)

**Current**: Audit mutations and exception errors are logged as structured JSON to `console.log` / `console.error` via `lib/logging.ts`.

**Limitation**: No direct webhook integration with enterprise logging platforms (Datadog, Splunk, AWS CloudWatch, Sentry).

**Impact**: Audit logs are fully structured and queryable in standard output but require manual collection from server logs.

**Recommended Fix**: Wire `logAuditMutation` and `logExceptionError` to a secure serverless webhook dispatcher targeting the chosen observability platform.

---

## 6. Cryptographic Integrity

### 6.1 Blockchain-Anchored Lineage Seals (B03-GAP-003)

**Current**: Claim lineage hashes are computed and persisted in the workspace database ledger.

**Limitation**: Hashes are not anchored to a public blockchain or distributed ledger.

**Impact**: Lineage integrity is verifiable within the database but lacks external tamper-proof anchoring.

**Recommended Fix**: Implement periodic hash anchoring to a public blockchain (e.g., Ethereum, Polygon) or timestamping authority.

---

## 7. UI Localization & Internationalization (i18n)

### 7.1 Multi-language (Korean/English) UI Toggle

**Current**: The workspace UI console displays all panels, headings, buttons, and descriptions purely in English.

**Limitation**: No dynamic translation system (i18n) or Language Selector Toggle is implemented in the MVP interface.

**Impact**: Non-English users (especially Korean brand managers) must navigate the system in English, which may slightly reduce initial onboarding speed.

**Recommended Fix**: Implement a global translation provider (e.g., using `next-intl` or a client-side React Context-based translation hook) with unified dictionaries for English and Korean, and place a language toggle button in the main console layout header.

---

## Summary

| # | Limitation | Severity | Blocking? | Waiver |
|---|---|---|---|---|
| 1.1 | Mock observation providers | Low | No | WAIV-002 |
| 1.2 | Mock signal mining | Low | No | — |
| 1.3 | Mock report AI drafting | Low | No | — |
| 2.1 | GS25/CU catalog sync | Low | No | WAIV-001 |
| 3.1 | KG force-directed graph | Low | No | — |
| 4.1 | Vibe cosine similarity | Low | No | — |
| 5.1 | Runtime bundle scrubbing | Low | No | — |
| 5.2 | Enterprise audit logging | Low | No | — |
| 6.1 | Blockchain lineage seals | Low | No | — |
| 7.1 | UI Korean/English Toggle | Low | No | — |

**Zero critical or high-severity limitations.** All items are approved for deferral to post-MVP iterations.
