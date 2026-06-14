import { getSupabaseAdminClient } from '../../lib/supabase';
import { seedCore } from './demo-core';
import { seedKBeauty } from './domains/k-beauty';
import { seedSkincare } from './domains/skincare';
import { seedConvenience } from './domains/convenience-retail';
import { seedWedding } from './domains/wedding';

/**
 * Orchestrator seeder that sets up the full demo database
 */
export async function seedFullDemo() {
  console.log('--- STARTING FULL DEMO SEED ORCHESTRATION ---');
  
  // 1. Ensure core workspace and domain skeletons are populated
  await seedCore();

  const supabase = getSupabaseAdminClient();

  // 2. Fetch the newly upserted workspace and domain ids
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', 'demo-brand-semantic-lab')
    .single();

  if (!workspace) throw new Error('Seeding Failed: Workspace not found.');

  const { data: domains } = await supabase
    .from('domains')
    .select('id, slug')
    .eq('workspace_id', workspace.id);

  if (!domains || domains.length < 4) {
    throw new Error('Seeding Failed: Initial Domain skeletons are incomplete.');
  }

  const kBeautyDomain = domains.find(d => d.slug === 'k-beauty-skincare');
  const skincareDomain = domains.find(d => d.slug === 'skincare-dro');
  const convenienceDomain = domains.find(d => d.slug === 'convenience-retail');
  const weddingDomain = domains.find(d => d.slug === 'wedding-services');

  // 3. Execute domain specific seeding loops
  if (kBeautyDomain) {
    await seedKBeauty(workspace.id, kBeautyDomain.id);
  }
  if (skincareDomain) {
    await seedSkincare(workspace.id, skincareDomain.id);
  }
  if (convenienceDomain) {
    await seedConvenience(workspace.id, convenienceDomain.id);
  }
  if (weddingDomain) {
    await seedWedding(workspace.id, weddingDomain.id);
  }

  console.log('--- FULL DEMO SEED ORCHESTRATION COMPLETED SUCCESSFULLY ---');
}
