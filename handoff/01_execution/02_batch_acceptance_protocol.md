# 02_batch_acceptance_protocol.md

Version: v2.0-draft  
Status: Batch acceptance protocol  
Product: Brand Semantic Website OS

---

## Accept a Batch If

```text
required routes exist
required tables/migrations exist
server actions exist or are scaffolded
RLS exists or gap is explicit
tests exist or are scaffolded
critical non-negotiables preserved
gap report is honest
```

---

## Request Patch If

```text
non-negotiable violated
RLS missing without clear gap
AI output auto-approved
high-risk boundary missing
methodology/proxy caveat missing for reports
patch success without retest
```

---

## Continue With Warning If

```text
UI polish incomplete
advanced automation deferred
non-critical tests scaffolded not implemented
post-MVP feature missing
```
