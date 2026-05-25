# 00_system_architecture_summary.md

Version: v2.0-draft  
Status: System architecture summary  
Product: Brand Semantic Website OS

---

## Stack

```text
Next.js App Router
TypeScript strict
Tailwind CSS
shadcn/ui
Supabase Auth/Postgres/RLS
Zod
AI provider abstraction
Mock AI/Observation provider first
Vitest / Playwright scaffold
```

---

## App Architecture

```text
app routes by workspace/domain/brand
server actions for mutations
Supabase RLS for tenant isolation
deterministic engines for gates/metrics/validation
AI agents for candidate generation only
audit_events and agent_runs for traceability
```

---

## Major Folders

```text
app/
components/
lib/
db/migrations/
db/seed/
tests/
docs/
```
