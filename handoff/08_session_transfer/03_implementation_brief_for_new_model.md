# 03_implementation_brief_for_new_model.md

Version: v2.0-draft  
Status: Implementation brief  
Product: Brand Semantic Website OS

---

## Brief

This project builds a SaaS that helps brands create SEO/AEO/GEO-optimized semantic websites and measure/improve AI-answer performance.

The implementation should start with a strict foundation:

```text
Next.js App Router
Supabase Auth/Postgres/RLS
workspace tenant model
server actions
Zod validation
audit_events
agent_runs
release gates
```

Then add modules sequentially.

Do not skip safety:

```text
RLS
candidate AI output
evidence/boundary
methodology/proxy caveat
patch/retest
release gate
```
