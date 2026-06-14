import { getSupabaseAdminClient } from '../../lib/supabase';

/**
 * Idempotent seeder function to establish the core multitenant workspace
 * and initial domain skeletons in the database.
 */
export async function seedCore() {
  const supabase = getSupabaseAdminClient();
  console.log('STARTING SEED: Seeding Core database structures...');

  // 1. Seed the default laboratory Workspace
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .upsert({
      name: 'Demo Brand Semantic Lab',
      slug: 'demo-brand-semantic-lab',
    }, { onConflict: 'slug' })
    .select()
    .single();

  if (wsError || !workspace) {
    throw new Error(`Core Seeding Failed: Could not seed default workspace - ${wsError?.message}`);
  }
  console.log(`SEEDED: Workspace "${workspace.name}" [ID: ${workspace.id}]`);

  // 2. Seed default owner membership for the core test user
  const demoOwnerId = '00000000-0000-0000-0000-000000000001';
  const { error: memberError } = await supabase
    .from('workspace_memberships')
    .upsert({
      workspace_id: workspace.id,
      user_id: demoOwnerId,
      role: 'owner',
    }, { onConflict: 'workspace_id,user_id' });

  if (memberError) {
    console.error(`SEED WARNING: Failed to write default workspace membership: ${memberError.message}`);
  } else {
    console.log(`SEEDED: Owner Membership linked to user ID: ${demoOwnerId}`);
  }

  // 3. Seed domain skeletons for K-Beauty, Convenience Retail, and Wedding
  const domainsToSeed = [
    {
      name: 'K-Beauty Skincare',
      slug: 'k-beauty-skincare',
      description: 'Ingredient trust, scientific evidence sheets, routines, and clinical claims.'
    },
    {
      name: 'Skincare DR.O',
      slug: 'skincare-dro',
      description: 'Skincare industry post-procedure clinical trust, routines, and brand truths.'
    },
    {
      name: 'Convenience Retail',
      slug: 'convenience-retail',
      description: 'Local store menus, stock promotions, and direct geo-location answers.'
    },
    {
      name: 'Wedding Services',
      slug: 'wedding-services',
      description: 'Wedding halls, studio collections, makeup specs, and consultant booking.'
    },
  ];

  for (const dom of domainsToSeed) {
    const { data: domainObj, error: domainError } = await supabase
      .from('domains')
      .upsert({
        workspace_id: workspace.id,
        name: dom.name,
        slug: dom.slug,
        description: dom.description,
      }, { onConflict: 'workspace_id,slug' })
      .select()
      .single();

    if (domainError || !domainObj) {
      console.error(`SEED WARNING: Failed to write domain ${dom.name} - ${domainError?.message}`);
    } else {
      console.log(`SEEDED: Domain "${domainObj.name}" [ID: ${domainObj.id}]`);
    }
  }

  console.log('SUCCESS: Core database seeder run finished.');
}
