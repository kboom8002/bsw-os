# 04_module_dependency_map.md

Version: v2.0-draft  
Status: Module dependency map  
Product: Brand Semantic Website OS

---

## Dependency Graph

```text
Core Foundation
  ├─ Brand Truth
  │   ├─ Semantic Core
  │   │   ├─ Object / Surface / Website
  │   │   │   ├─ Persona / Vibe
  │   │   │   └─ Observatory / Metrics
  │   │   │       ├─ Report Publisher
  │   │   │       └─ Fix-It
  │   │   └─ Persona / Vibe
  │   └─ Report Publisher
  └─ Domain Demo / Release Gate
```

---

## Hard Dependencies

```text
Brand Truth depends on Core.
Semantic Core depends on Brand Truth.
Objects/Surfaces/Pages depend on Semantic Core.
Observatory depends on QIS and generated pages/objects.
Reports depend on metric snapshots and methodology.
Fix-It depends on metrics/reports and target artifacts.
Demo depends on all modules.
Hardening depends on all modules.
```

---

## Soft Dependencies

```text
Persona/Vibe can attach to QIS/Object/Surface/Page.
P-MRI/V-MRI depend on Persona/Vibe data.
SWEL depends on baseline/retest observations.
Factory reuse depends on Fix-It positive lift.
```
