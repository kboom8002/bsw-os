import { getSupabaseAdminClient } from '../supabase';
import { CulturalSSoTContext } from './cultural-judge-provider';

/**
 * Assembles the complete Cultural SSoT context for a specific workspace, domain pack, and probe question.
 */
export async function buildCulturalSSoTContext(
  workspaceId: string,
  domainPackId: string,
  probeQuestionId?: string
): Promise<CulturalSSoTContext> {
  const supabase = getSupabaseAdminClient();

  // 1. Fetch domain pack
  const { data: domainPack, error: packError } = await supabase
    .from('domain_packs')
    .select('*')
    .eq('id', domainPackId)
    .single();

  if (packError || !domainPack) {
    throw new Error(`Failed to load domain pack ${domainPackId}: ${packError?.message || 'Not found'}`);
  }

  // 2. Fetch cultural concepts in this pack
  const { data: concepts, error: conceptsError } = await supabase
    .from('cultural_concepts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('domain_pack_id', domainPackId);

  if (conceptsError) {
    throw new Error(`Failed to load cultural concepts: ${conceptsError.message}`);
  }

  // 3. Optionally fetch probe question
  let qbsItem: any = undefined;
  let targetMarket = 'Global';
  let targetMicrogroup = 'All';

  if (probeQuestionId) {
    const { data: question, error: questionError } = await supabase
      .from('probe_questions')
      .select('*')
      .eq('id', probeQuestionId)
      .single();

    if (questionError) {
      console.warn(`Failed to load probe question ${probeQuestionId}: ${questionError.message}`);
    } else {
      qbsItem = question;
      targetMarket = question.target_market || 'Global';
      targetMicrogroup = question.target_microgroup || 'All';
    }
  }

  return {
    workspace_id: workspaceId,
    domain_pack: {
      id: domainPack.id,
      slug: domainPack.slug,
      name: domainPack.name,
      supported_languages: domainPack.supported_languages || [],
      concept_types: domainPack.concept_types || [],
      rating_axes: domainPack.rating_axes || [],
      forbidden_patterns: domainPack.forbidden_patterns || [],
      risk_policies: domainPack.risk_policies || {},
    },
    concepts: concepts || [],
    qbs_item: qbsItem,
    target_market: targetMarket,
    target_microgroup: targetMicrogroup,
  };
}
