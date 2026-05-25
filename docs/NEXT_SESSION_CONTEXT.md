# Next Session Context — Brand Semantic Website OS

Date: 2026-05-23  
Last Release: RC-1 (GO WITH WAIVERS)  
Product: Brand Semantic Website OS (BSW-OS)

---

## What This Project Is

Brand Semantic Website OS is a SaaS platform combining:

- **Brand MeaningOps**: Structured brand truth management with claim-evidence-boundary lineage.
- **Semantic Website Factory**: Object-first content architecture with persona-driven vibe scoring.
- **AI Answer Observatory**: Probe-panel-based AI search measurement with 14+ metrics.
- **Fix-It OS**: Closed-loop optimization with RCA, patches, retests, and factory reuse.

Tech stack: Next.js 16.2.6, Supabase PostgreSQL with RLS, Tailwind CSS 4, Zod 4, Vitest 4.1.7.

---

## What Has Been Built

The complete MVP has been implemented across 10 batches (AG-B0 through AG-B10):

- **8 database migrations** (`db/migrations/0001_core.sql` → `0008_fixit_factory.sql`)
- **8 server action modules** (`app/actions/truth.ts` → `release.ts`)
- **74 Zod schemas** (`lib/schema.ts`)
- **68 passing tests** across 10 test files
- **3 domain seeds** (K-Beauty, Convenience Retail, Wedding)
- **65+ dynamic routes** with glassmorphic dark-mode UI
- **Full release gate auditor** with Go/No-Go dashboard

All server actions use `"use server"` directive. No service role keys leak to client bundles.

---

## Current State

| Dimension | Status |
|---|---|
| Build | ✅ Next.js 16.2.6 compiles with 0 errors |
| Tests | ✅ 68/68 pass (100%) |
| RLS | ✅ Active on all workspace-owned tables |
| Demos | ✅ 3/3 domains fully seeded |
| Release Gates | ✅ All 4 gates pass |
| Decision | GO WITH WAIVERS |

---

## Non-Negotiable Rules

These invariants must be preserved in all future work:

```text
1. Workspace is tenant boundary
2. RLS mandatory for workspace-owned tables
3. AI output is candidate by default
4. Truth/evidence/boundary first
5. Question Capital → CQ → QIS separation
6. Object-first, Page-later
7. No evidence, no vibe score
8. No report export without methodology + proxy caveat
9. No patch success without retest
10. No release without release gate
11. Service role never exposed to client
12. Guardrail regression overrides positive lift
```

---

## Core Concepts Reference

| Concept | Definition |
|---|---|
| **Question Capital** | Upstream strategic asset — the questions a brand needs to own |
| **Canonical Question (CQ)** | Stable, normalized question identity |
| **QIS** | Query-Intent-Scenario scene — runtime context for search observation |
| **TCO Concept** | Operational concept entity (not a tag) |
| **Brand Truth** | Strategic / Operational / Observed claim separation |
| **Representation Object** | Factual brand object — upstream of surfaces and pages |
| **Surface Contract** | Digital/physical exposure surface specification |
| **PersonaSpec** | Versioned, measurable, governable persona behavior spec |
| **Vibe OS** | Separate runtime for brand vibe scoring |
| **OPS-MRI / B-MRI** | Operational/Brand Meaning Readiness Index |
| **Probe Panel** | Versioned, freezable set of probe questions for AI observation |
| **Fix-It** | Closed-loop RCA → Patch → Retest → Lift → Factory pipeline |

---

## MVP Domains

| Domain | Brand | Seed File |
|---|---|---|
| K-Beauty Skincare | PureBarrier | `db/seed/domains/k-beauty.ts` |
| Convenience Retail | Quick25 | `db/seed/domains/convenience-retail.ts` |
| Wedding Services | Lumiere Hall | `db/seed/domains/wedding.ts` |

Demo workspace: `demo-brand-semantic-lab` (slug)

---

## Active Waivers

| Waiver | Owner | Expiry | Description |
|---|---|---|---|
| WAIV-001 | Lead Strategist | 2026-08-01 | GS25/CU live inventory API → visual selector flags |
| WAIV-002 | AI Tech Lead | 2026-08-01 | Production Gemini Pro → mock observation crawlers |

---

## Key File Locations

| File | Purpose |
|---|---|
| `app/actions/*.ts` | All server actions (8 modules) |
| `lib/schema.ts` | 74 Zod schemas and TypeScript types |
| `lib/auth.ts` | RBAC permission checking |
| `lib/supabase.ts` | Supabase client factories |
| `lib/logging.ts` | Structured audit + error logging |
| `db/migrations/*.sql` | 8 sequential migrations |
| `db/seed/` | Idempotent demo seeder |
| `tests/*.test.ts` | 10 test files (68 tests) |
| `docs/` | Handoff and compliance docs |

---

## Quick Start Commands

```bash
# Install
npm install

# Dev server
npm run dev

# Production build
npm run build

# Run all tests
npm test

# Run specific tests
npx vitest run tests/truth.test.ts
```

---

## Recommended Next Steps

1. Replace mock observation providers with production Gemini Pro API.
2. Integrate GSC and Ahrefs signal mining APIs.
3. Connect GS25/CU live inventory catalog sync.
4. Implement real-time cosine similarity for Vibe OS.
5. Add force-directed Knowledge Graph visualization.
6. Wire audit logger to enterprise observability (Datadog/Splunk).
7. Deploy to staging and run E2E seed verification.
8. Implement Multi-language (Korean/English) i18n Toggle Support for the workspace UI console.

