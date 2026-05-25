# BSW-OS Test Commands Registry & CI Execution Guide

Date: 2026-05-23  
Version: **v1.0.0**

This document describes the commands and pipeline integration paths for executing BSW-OS's hardened TDD test suites.

---

## 1. Local Development Test Execution

### 1.1 Run All Tests (Unit + Integration + RLS + E2E + Regression)

Runs the entire test suite sequentially in non-interactive run mode:
```bash
npm run test
```

### 1.2 Run Unit Tests Only

Tests core server action business logic, schemas, and environment validations:
```bash
npm run test:unit
```

### 1.3 Run Multi-Tenant RLS & RBAC Tests

Verifies tenant-scoping isolation boundaries and security role mapping permissions:
```bash
npm run test:rls
```

### 1.4 Run Full Integration Pipeline

Validates semantic lineage gates, release gate auditors, and mock observation pipelines:
```bash
npm run test:integration
```

### 1.5 Run E2E Domain Seed Verification

Ensures that K-Beauty, Retail, and Wedding seeder engines run successfully against mocked DB engines:
```bash
npm run test:e2e
```

### 1.6 Run Hardening Regression Scanners

Scans the client bundles programmatically for service role private key leaks and mutations:
```bash
npm run test:regression
```

### 1.7 Active Watch Mode

Keeps the test runner active to automatically rerun tests on file change:
```bash
npm run test:watch
```

---

## 2. CI/CD Pipeline Integration

For GitHub Actions, GitLab CI, or other continuous integration platforms, use the hardened CI script:

```bash
npm run test:ci
```

### What `test:ci` Executes:
- **`--coverage`**: Generates full LCOV coverage summaries (outputs to `coverage/` directory).
- **`--no-cache`**: Purges test cache to prevent false positives from stale environmental mock configurations.
- **Fail-Fast Enforcement**: Instantly aborts the pipeline if any single test out of the 130+ assertions fails.

---

## 3. Recommended Pre-commit Checks

Before committing or pushing changes to the repository, BSW-OS engineers should execute:

```bash
npm run typecheck && npm run test:regression && npm run test:unit
```
This ensures zero compilation errors, zero private key exposures, and 100% logic alignment with hardened TDD expectations.
