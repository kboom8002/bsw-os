# Brand Semantic Website OS — Final Repository Handoff

Date: 2026-05-23  
Release Candidate: RC-1  
Verdict: **GO WITH WAIVERS**  
Product: Brand Semantic Website OS (BSW-OS)

---

## 1. Product Summary

Brand Semantic Website OS is a SaaS platform that helps brands create SEO/AEO/GEO-optimized semantic websites and measure and improve AI-answer performance.

The system integrates four operational pillars:

1. **Brand MeaningOps** — Structured brand truth management with strategic, operational, and observed claim separation, evidence verification, and claim-boundary lineage tracking.
2. **Semantic Website Factory** — Object-first content architecture with factual representation objects, surface contracts, semantic pages, schema JSON-LD, and persona-driven vibe scoring.
3. **AI Answer Observatory** — Probe-panel-based AI search observation with 14+ mathematical metrics (ARS, AAS, OCR, BSF, SWEL), versioned panels, and raw response auditing.
4. **Fix-It OS** — Closed-loop optimization with structured RCA hypotheses, patch tickets, independent retests, guardrail regression detection, and factory pattern reuse.

### Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Database | Supabase PostgreSQL with Row-Level Security |
| Styling | Tailwind CSS 4 |
| Validation | Zod 4 |
| Testing | Vitest 4.1.7 |
| UI Icons | Lucide React |
| Language | TypeScript 5 |

### Tenant Model

All data is partitioned by `workspace_id`. RLS policies enforce tenant isolation at the database level. No cross-workspace data access is possible.

---

## 2. Implemented Modules

| Batch | Module | Migration | Server Actions | Tests |
|---|---|---|---|---|
| AG-B0/B1 | Core Schema & RLS | `0001_core.sql` | — | `rls.test.ts` (4) |
| AG-B2 | Brand Truth | `0002_brand_truth.sql` | `truth.ts` | `truth.test.ts` (5) |
| AG-B3 | Semantic Core | `0003_semantic_core.sql` | `semantic.ts` | `semantic.test.ts` (8) |
| AG-B4 | Objects / Surfaces / Website | `0004_representation_surface.sql` | `objects.ts` | `objects.test.ts` (7) |
| AG-B5 | Persona & Vibe OS | `0005_persona_vibe.sql` | `persona.ts` | `persona.test.ts` (12) |
| AG-B6 | Observatory & Metrics | `0006_observatory_metrics.sql` | `observatory.ts` | `observatory.test.ts` (8) |
| AG-B7 | Report Publisher | `0007_report_publisher_patch.sql` | `reports.ts` | `reports.test.ts` (8) |
| AG-B8 | Fix-It & Factory | `0008_fixit_factory.sql` | `fixit.ts` | `fixit.test.ts` (8) |
| AG-B9 | Domain Seeds & Demos | — | — | `demo.test.ts` (5) |
| AG-B10 | Hardening & Release Gates | — | `release.ts` | `hardening.test.ts` (3) |
| **Total** | | **8 migrations** | **8 action files** | **68 tests** |

---

## 3. Directory Structure

```text
c:/Users/User/bsw/
├── app/
│   ├── actions/                          # Secure server actions ("use server")
│   │   ├── truth.ts                      # Brand Truth claims & evidence
│   │   ├── semantic.ts                   # Semantic Core & lineage
│   │   ├── objects.ts                    # Objects, surfaces, pages
│   │   ├── persona.ts                    # Persona specs & vibe OS
│   │   ├── observatory.ts               # Observatory & metrics engine
│   │   ├── reports.ts                    # Report publisher & export gates
│   │   ├── fixit.ts                      # Fix-It, RCA, patches, retests
│   │   └── release.ts                    # Release gate auditor
│   └── (workspace)/[workspace_slug]/     # Dynamic workspace routes
│       ├── truth/                        # Brand Truth Studio pages
│       ├── semantic-core/                # Semantic Core Studio pages
│       ├── objects/                       # Objects Studio pages
│       ├── surfaces/                      # Surface Contracts pages
│       ├── website/                       # Semantic Website Hub pages
│       ├── persona/                       # Persona Specs pages
│       ├── vibe/                          # Vibe OS Studio pages
│       ├── observatory/                   # Observatory & Metrics pages
│       ├── reports/                       # Benchmark Reports pages
│       ├── fixit/                         # Fix-It Studio pages
│       ├── demo/                          # Domain Demo Flow pages
│       └── release/                       # Release Gate Dashboard
├── db/
│   ├── migrations/                       # 8 sequential SQL migrations
│   │   ├── 0001_core.sql
│   │   ├── 0002_brand_truth.sql
│   │   ├── 0003_semantic_core.sql
│   │   ├── 0004_representation_surface.sql
│   │   ├── 0005_persona_vibe.sql
│   │   ├── 0006_observatory_metrics.sql
│   │   ├── 0007_report_publisher_patch.sql
│   │   └── 0008_fixit_factory.sql
│   └── seed/                             # Idempotent seeder engine
│       ├── demo-core.ts                  # Workspace & domain skeletons
│       ├── demo-full.ts                  # Master orchestrator
│       ├── utils.ts                      # Shared upsert helpers
│       └── domains/
│           ├── k-beauty.ts               # PureBarrier skincare trace
│           ├── convenience-retail.ts     # Quick25 convenience trace
│           └── wedding.ts               # Lumiere Hall wedding trace
├── lib/
│   ├── schema.ts                         # 74 Zod schemas & TS interfaces
│   ├── logging.ts                        # Audit mutations & error logging
│   ├── auth.ts                           # RBAC permission helpers
│   ├── supabase.ts                       # Supabase client factories
│   └── ai/                               # AI agent scaffolds
├── tests/                                # 10 test files, 68 tests total
├── docs/                                 # Handoff & compliance documents
└── handoff/                              # Source specifications
```

---

## 4. How to Run Locally

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (local or cloud)

### Install Dependencies

```bash
cd c:/Users/User/bsw
npm install
```

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Security**: `SUPABASE_SERVICE_ROLE_KEY` is server-only. It is never exposed to client bundles. This is verified by `hardening.test.ts`.

### Start Development Server

```bash
npm run dev
```

Navigate to: [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run start
```

---

## 5. How to Apply Migrations

Migrations must be applied in strict sequential order using the Supabase SQL editor or CLI:

```bash
# Via Supabase CLI (if configured):
supabase db push

# Or manually, apply each file in order:
# 1. db/migrations/0001_core.sql
# 2. db/migrations/0002_brand_truth.sql
# 3. db/migrations/0003_semantic_core.sql
# 4. db/migrations/0004_representation_surface.sql
# 5. db/migrations/0005_persona_vibe.sql
# 6. db/migrations/0006_observatory_metrics.sql
# 7. db/migrations/0007_report_publisher_patch.sql
# 8. db/migrations/0008_fixit_factory.sql
```

All migrations enable RLS and create workspace-scoped policies automatically.

---

## 6. How to Run Seeds

The seeder engine is idempotent — it uses `upsert` with stable conflict keys (`slug`, `workspace_id,slug`, `unique_hash`) so it can be run repeatedly without duplicating records.

### Seed via Test Runner

```bash
npx vitest run tests/demo.test.ts
```

This validates seeder transactions against mocked Supabase.

### Seed via Demo Dashboard

1. Start the dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/demo-brand-semantic-lab/demo`
3. Click **"Launch Full Demo Seed"**

### Reset and Re-seed

To completely purge and re-seed:

```sql
-- In Supabase SQL editor:
DELETE FROM workspaces WHERE slug = 'demo-brand-semantic-lab';
-- Cascade deletes will clean all related tables.
```

Then re-run the seeder.

---

## 7. How to Run Tests

```bash
# Run all 68 tests:
npm test

# Run a specific test file:
npx vitest run tests/truth.test.ts
npx vitest run tests/hardening.test.ts
```

### Test Files

| File | Module | Tests |
|---|---|---|
| `rls.test.ts` | Core RLS & RBAC | 4 |
| `truth.test.ts` | Brand Truth | 5 |
| `semantic.test.ts` | Semantic Core | 8 |
| `objects.test.ts` | Objects / Surfaces | 7 |
| `persona.test.ts` | Persona & Vibe OS | 12 |
| `observatory.test.ts` | Observatory & Metrics | 8 |
| `reports.test.ts` | Report Publisher | 8 |
| `fixit.test.ts` | Fix-It & Factory | 8 |
| `demo.test.ts` | Domain Seeds | 5 |
| `hardening.test.ts` | Security Hardening | 3 |
| **Total** | | **68** |

---

## 8. How to Demo Each Domain

All demos launch from: `http://localhost:3000/demo-brand-semantic-lab/demo`

### 8.1 K-Beauty Skincare (PureBarrier)

**URL**: `http://localhost:3000/demo-brand-semantic-lab/demo/k-beauty`

**Trace Loop**:
1. **Brand Truth**: Trust-focused skincare claims ("Clinically tested for sensitive skin") with Global Derm clinical trial evidence and YMYL safety boundaries.
2. **Semantic Core**: Question Capital → Canonical Question ("민감성 피부에 좋은 레티놀 사용법") → QIS scene with retinol routine intent.
3. **Objects & Surfaces**: PureBarrier Retinol Routine representation object → surface contract → semantic page with schema JSON-LD.
4. **Persona & Vibe**: Dermatology Advisor persona with trust-first vibe spec.
5. **Observatory**: Frozen probe panel with skincare-specific probe questions, mock observation runs, and ARS/OCR metric snapshots.
6. **Reports**: Benchmark report with methodology disclosure, proxy caveats, and unsafe wording scan.
7. **Fix-It**: RCA case for low ARS → patch hypothesis → retest → post-patch lift snapshot.

### 8.2 Convenience Retail (Quick25)

**URL**: `http://localhost:3000/demo-brand-semantic-lab/demo/convenience-retail`

**Trace Loop**:
1. **Brand Truth**: Menu combo and stock locator claims with operational franchise boundaries.
2. **Semantic Core**: Local action questions ("근처 편의점 도시락 추천") → QIS scenes with AEO local intent.
3. **Objects & Surfaces**: Quick25 menu combo objects → store locator surface contracts → semantic pages with LocalBusiness schema.
4. **Observatory**: Stock availability probes with franchise-scoped metrics.
5. **Fix-It**: Post-patch lift snapshots from stock locator correction patches.

**Note**: GS25 and CU are integrated as visual selector flags (Waiver WAIV-001). Live catalog sync is deferred.

### 8.3 Wedding Services (Lumiere Hall)

**URL**: `http://localhost:3000/demo-brand-semantic-lab/demo/wedding`

**Trace Loop**:
1. **Brand Truth**: Package contract claims across 4 vendor categories (wedding_hall, studio, dress, makeup).
2. **Semantic Core**: Contract-checking intents ("웨딩홀 패키지 계약 전 확인 조건") → vendor comparison QIS scenes.
3. **Objects & Surfaces**: Venue and vendor representation objects → comparison matrix surface contracts.
4. **Persona & Vibe**: Wedding Curator persona with comparison-fair vibe spec.
5. **Observatory**: Contract trust probes with vendor-scoped panel versioning.
6. **Fix-It**: Factory reuse candidates from successful vendor comparison patches.

---

## 9. Release Gate Status

| Gate | Status |
|---|---|
| Code Release Gate | ✅ PASS — 68/68 tests, zero build errors |
| Demo Release Gate | ✅ PASS — 3/3 MVP domains fully seeded |
| Report Export Gate | ✅ PASS — Methodology, caveats, wording gates enforced |
| Security Release Gate | ✅ PASS — RLS active, service role isolated, RBAC enforced |
| Final Acceptance Gate | ✅ PASS — All handoff documents compiled |

---

## 10. Final Gap Summary

All gaps are **Low severity** and **non-blocking**:

| Gap ID | Area | Description |
|---|---|---|
| B03-GAP-001 | AI Signals | Mock mappings instead of live GSC/Ahrefs APIs |
| B03-GAP-002 | Graph UI | Grid lists instead of force-directed canvas |
| B03-GAP-003 | Cryptography | DB ledger instead of blockchain anchoring |
| B05-GAP-001 | Vibe OS | Ratio thresholds instead of cosine similarity |
| B06-GAP-001 | Observatory | Mock crawlers instead of residential proxies |
| B07-GAP-001 | Report AI | Mock templates instead of production Gemini API |
| B08-GAP-001 | Retests | Mock scores instead of live crawler observations |
| B09-GAP-002 | Convenience | Visual flags instead of live GS25/CU catalog sync |
| B10-GAP-001 | Security | Build-time scanner instead of runtime bundle plugin |
| B10-GAP-002 | Logging | Console logger instead of enterprise webhook |

---

## 11. Go / No-Go Decision

```text
GO WITH WAIVERS
```

### Active Waivers

| Waiver | Owner | Expiration | Description |
|---|---|---|---|
| WAIV-001 | Lead Strategist | 2026-08-01 | GS25/CU live franchise inventory API deferred; visual selector flags serve as substitute. |
| WAIV-002 | AI Tech Lead | 2026-08-01 | Production Gemini Pro API deferred; mock crawlers provide reproducible sandboxed metrics. |

---

## 12. Next Recommended Work

### Priority 1: Production API Integration

1. Replace mock observation providers with production Gemini Pro API and residential proxy crawler infrastructure.
2. Integrate Google Search Console and Ahrefs signal mining APIs.
3. Connect GS25/CU live inventory catalog syndication for Convenience Retail.

### Priority 2: Platform Maturity

4. Implement real-time vector cosine similarity for Vibe OS alignment tuner.
5. Add force-directed graph visualization for the Knowledge Graph.
6. Wire structured audit logger to enterprise observability platform (Datadog/Splunk/CloudWatch).
7. Implement custom Turbopack plugin for build-time service role key scrubbing.

### Priority 3: Scale & Monetization

8. Implement billing and subscription management.
9. Add multi-workspace switching and organization hierarchy.
10. Implement blockchain-anchored lineage seals for enterprise compliance.
11. Build public API for third-party integrations.

---

## 13. Key Documents

| Document | Path |
|---|---|
| Final Gap Report | `docs/final_gap_report.md` |
| Release Candidate Checklist | `docs/release_candidate_checklist.md` |
| Repository Handoff Summary | `docs/repo_handoff_summary.md` |
| Go / No-Go Decision | `docs/go_no_go_decision.md` |
| Operator Runbook | `docs/runbook.md` |
| Implementation Status | `docs/IMPLEMENTATION_STATUS.md` |
| Known Limitations | `docs/KNOWN_LIMITATIONS.md` |
| Next Session Context | `docs/NEXT_SESSION_CONTEXT.md` |
| Per-Batch Gap Reports | `docs/gap_report_ag_b*.md` |

---

## 14. Non-Negotiable Rules

Any future development must preserve these invariants:

1. **Workspace is tenant boundary** — All data scoped by `workspace_id`.
2. **RLS is mandatory** — Every workspace-owned table requires RLS policies.
3. **AI output is candidate by default** — No auto-promotion of AI-generated artifacts.
4. **Object-first, Page-later** — Pages derive from objects, not the reverse.
5. **No evidence, no vibe score** — Vibe ratings require evidence.
6. **No report export without methodology + proxy caveat** — Publication gate is non-negotiable.
7. **No patch success without retest** — Retests must complete before patch clearance.
8. **No release without release gate** — Programmatic gates must pass.
9. **Service role never in client** — Private keys isolated server-side.
10. **Guardrail regression overrides positive lift** — Safety trumps performance gains.
