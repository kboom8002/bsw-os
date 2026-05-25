# 03_rls_rbac_summary.md

Version: v2.0-draft  
Status: RLS/RBAC summary  
Product: Brand Semantic Website OS

---

## RLS Helper Functions

```text
is_workspace_member(target_workspace_id uuid)
has_workspace_role(target_workspace_id uuid, allowed_roles text[])
```

---

## RLS Rule

Every workspace-owned table must have:

```text
workspace_id
RLS enabled
workspace member read policy
role-based mutation policy
```

---

## Critical Tests

```text
workspace isolation
anonymous blocked
executive_viewer read-only
role-specific mutation
```
