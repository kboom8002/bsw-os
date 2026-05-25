# 00_batch_execution_order.md

Version: v2.0-draft  
Status: Final batch execution order  
Product: Brand Semantic Website OS

---

## Recommended Execution

```text
1. AG-B0/B1 Repo Foundation + Core Schema/RLS
2. AG-B2 Brand Truth
3. AG-B3 Semantic Core
4. AG-B4 Object / Surface / Website
5. AG-B5 Persona / Vibe
6. AG-B6 Observatory / Metrics
7. AG-B7 Report Publisher
8. AG-B8 Fix-It
9. AG-B9 Domain Demo
10. AG-B10 Hardening / Release Gate
```

---

## Execution Discipline

For each batch:

```text
read batch README
apply migration
implement server actions
implement UI routes
implement deterministic engine
add AI scaffold if any
add tests
run checks
write gap report
perform acceptance review
```

---

## Do Not

```text
do not skip RLS
do not treat AI output as approved
do not create public report export before gate
do not mark patch success without retest
do not add new product scope during hardening
```
