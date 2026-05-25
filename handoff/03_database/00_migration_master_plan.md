# 00_migration_master_plan.md

Version: v2.0-draft  
Status: Migration master plan  
Product: Brand Semantic Website OS

---

## Migration Order

```text
0001_core.sql
0002_brand_truth.sql
0003_semantic_core.sql
0004_representation_surface.sql
0005_persona_vibe.sql
0006_observatory_metrics.sql
0007_report_publisher_patch.sql
0008_fixit_factory.sql
```

---

## Rule

Do not merge all future schema into one migration.

Each migration should match one conceptual module and be reviewable.
