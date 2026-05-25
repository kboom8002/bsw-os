# Brand Semantic Website OS — Test Architecture Hardening Specification (TDD-01)

Date: 2026-05-23  
Status: **HARDENED & PASSING**

---

## 1. Architectural Overview & Folder Conventions

To ensure absolute test isolation, statistical reproducibility, and security compliance, BSW-OS enforces a strict, multi-tier directory layout under the `tests/` directory:

```text
tests/
├── unit/             # Direct Server Action logic, Zod validation, i18n & Env variables tests
├── integration/      # Multi-module pipeline runs, Release Gate evaluation & Trace Loops
├── rls/              # Security-critical tenant workspace membership & RBAC assertions
├── e2e/              # Domain-specific seeder execution & full transactional loops
├── regression/       # Critical security scanners, leak prevention & mutation protections
├── helpers/          # Standardized, workspace-scoped test object initializers
└── fixtures/         # Curated K-Beauty, Retail, Wedding, and RCA test datasets
```

Each tier executes in strict isolation, prohibiting direct production DB mutations and instead routing DB interactions through deterministic, promise-supporting Supabase mock builders.

---

## 2. Standardized Test Helpers (`tests/helpers/index.ts`)

BSW-OS provides 9 core helpers isolated from the production runtime to ensure consistent mock entity instantiation:

1. **`createTestWorkspace`**: Resolves a mock workspace entity scoped with a stable RFC4122 v4 UUID.
2. **`createTestUser`**: Spawns an authenticated user structure with configurable RBAC scopes.
3. **`createWorkspaceMember`**: Binds a user to a workspace with a specific role.
4. **`createTestDomain`**: Instantiates a Brand/Industry Domain configuration.
5. **`createTestBrand`**: Creates a workspace-owned Brand skeleton.
6. **`assertRlsDenied`**: Asserts that a server action or query promise correctly rejects due to RLS policies.
7. **`assertRlsAllowed`**: Confirms a database query or mutation promise completes successfully under authorized sessions.
8. **`mockAgentRun`**: Generates a standard AI Agent execution log container.
9. **`mockObservationRun`**: Mocks a crawler audit session over frozen probe panels.

---

## 3. High-Fidelity Domain Fixtures (`tests/fixtures/index.ts`)

To avoid ad-hoc objects and raw strings cluttering test logic, BSW-OS provides 6 curated, production-grade domain datasets:

1. **K-Beauty Fixture (`kBeautyFixture`)**:
   - Skincare Brand claims ("restore 99% skin hydration").
   - Verified clinical trial evidence & YMYL medical eczema boundary rules.
2. **Convenience Fixture (`convenienceFixture`)**:
   - Quick25 franchise catalog data & combo menu objects.
3. **Wedding Fixture (`weddingFixture`)**:
   - Premium vendor services comparisons across 4 categories (hall, studio, dress, makeup).
4. **High-Risk QIS Fixture (`highRiskQisFixture`)**:
   - Query-Intent-Scenario context involving eczema and retinol.
5. **Report Export Fixture (`reportExportFixture`)**:
   - AI Answer Benchmark Trust Report with methodology disclosures & proxy caveats.
6. **Patch/Retest Fixture (`patchRetestFixture`)**:
   - Root-Cause-Analysis hypotheses, patch change plans, and retest performance lift results.

---

## 4. Multi-Tenant RLS & Security Mocking

No test is permitted to access a production Supabase instance directly. Supabase client calls are intercepted via a robust, chainable Supabase Query Builder mock defined as follows:

```typescript
const createMockQueryBuilder = (data: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    upsert: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    delete: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};
```

This guarantees that:
- Tests behave as **thenables**, allowing native `await` resolution.
- RLS boundaries are explicitly checked against workspace membership role schemas.
- Server roles or elevated administrator privileges are never leaked to client bundles.

---

## 5. CI Release Gates Validation

Every branch merging into main must pass the following programmatic gates:
- **`npm run test:unit`**: Validates 115 structural assertions.
- **`npm run test:rls`**: Validates multi-tenant isolation and tenant scoping.
- **`npm run test:e2e`**: Validates seeder integrity and full database seeding transactions.
- **`npm run test:regression`**: Scans codebase for `SUPABASE_SERVICE_ROLE_KEY` client-side leaks and verifies mutation blocking on read-only roles.
- **`npm run test:integration`**: Evaluates active semantic lineage chains, release gate auditors, and trace loops.
