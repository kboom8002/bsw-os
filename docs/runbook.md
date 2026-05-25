# BSW-OS Seed Reset & Demo Operations Runbook

## 1. Demo Operations Runbook

### Booting the local workspace
1. Ensure all node dependencies are installed:
   ```bash
   npm install
   ```
2. Launch the Next.js development server:
   ```bash
   npm run dev
   ```
3. Navigate in the browser to:
   [http://localhost:3000/demo-brand-semantic-lab/demo](http://localhost:3000/demo-brand-semantic-lab/demo)
4. Trigger the E2E seeder by clicking the "Launch Full Demo Seed" button. This immediately seeds all 3 MVP domains (K-Beauty, Convenience, Wedding).

### Switching domain views
1. From the Demo Dashboard, you can select and walk individual domain trace portals:
   - **K-Beauty Skincare**: Traces clinical evidence trials and safety disclaimers for the **PureBarrier** sensitive skin routine.
   - **Convenience Retail**: Traces stock locator coordinate schema mappings and promotional boundaries for **Quick25** combos (includes CU and GS25 feature flags).
   - **Wedding Services**: Traces vendor packages compared across all 4 categories (`wedding_hall`, `studio`, `dress`, `makeup`) under **Lumiere Hall**.

---

## 2. Seed Reset Runbook

### Purging and re-triggering idempotent seeds
Because all seeder scripts (`db/seed/demo-core.ts`, `db/seed/domains/*.ts`) utilize Supabase database `upsert` queries on stable conflict keys (such as `slug`, `unique_signature`, `unique_hash`, and `workspace_id,slug`), they can be run repeatedly without duplicating records.

To re-seed or overwrite active database entries:
1. Run the Vitest seeder verification suite, which programmatically executes and validates seeder transactions:
   ```bash
   npx vitest run tests/demo.test.ts
   ```
2. In production PostgreSQL/Supabase consoles, to completely wipe and reset all workspace resources before re-running the seeder, execute a cascade database purge:
   ```sql
   -- Purge all workspace owned data (cascade deletes will automatically clean related trace tables)
   DELETE FROM workspaces WHERE slug = 'demo-brand-semantic-lab';
   ```
3. After the purge, re-execute the seeder by visiting the dashboard portal or running the test suite again to restore a pristine full-loop trace layout!
