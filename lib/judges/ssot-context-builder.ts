import { getSupabaseAdminClient } from '../supabase';
import { BrandSSoTContext, QBSItemContext } from './types';

/**
 * Builds the Brand SSoT Context for a workspace.
 */
export async function buildBrandSSoTContext(workspaceId: string): Promise<BrandSSoTContext> {
  const supabase = getSupabaseAdminClient();

  // 1. Fetch workspace name
  const { data: ws } = await supabase
    .from('workspaces')
    .select('name')
    .eq('id', workspaceId)
    .single();

  const brandName = ws?.name || 'Generic Brand';

  // 2. Fetch concepts
  const { data: concepts } = await supabase
    .from('tco_concepts')
    .select('*')
    .eq('workspace_id', workspaceId);

  // 3. Fetch concept relations
  const { data: relations } = await supabase
    .from('concept_relations')
    .select('*')
    .eq('workspace_id', workspaceId);

  // 4. Fetch boundary rules for forbidden terms
  const { data: boundaries } = await supabase
    .from('boundary_rules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true);

  // 5. Fetch vibe specs for tone policies
  const { data: vibe } = await supabase
    .from('vibe_specs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(1);

  // Parse forbidden concepts
  const forbiddenConceptsList: { concept_id: string; label: string; reason: string }[] = [];
  const forbiddenExpressionsSet = new Set<string>();

  if (boundaries) {
    boundaries.forEach((rule) => {
      if (rule.forbidden_terms) {
        rule.forbidden_terms.forEach((term: string) => {
          forbiddenExpressionsSet.add(term);
          forbiddenConceptsList.push({
            concept_id: `forbidden_${term.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            label: term,
            reason: rule.rule_name || 'Restricted brand term',
          });
        });
      }
    });
  }

  // Map core concepts
  const coreConceptsMapped = (concepts || []).map((c) => {
    // If it's skincare or retinol, add default clinical evidence or rules for demonstration
    const allowed = [c.concept_name, c.slug];
    const forbidden: string[] = [];

    // Check if any forbidden expression is related to this concept
    forbiddenExpressionsSet.forEach((exp) => {
      if (exp.toLowerCase().includes(c.concept_name.toLowerCase())) {
        forbidden.push(exp);
      }
    });

    return {
      concept_id: c.id,
      label: c.concept_name,
      definition: c.definition || '',
      importance_weight: c.is_strategic ? 1.5 : 1.0,
      evidence_sources: c.is_strategic ? ['Clinical Trial Report #2025', 'Brand Official Website'] : [],
      allowed_expressions: allowed,
      forbidden_expressions: forbidden,
    };
  });

  // Map expected relations
  const expectedRelationsMapped = (relations || []).map((r) => ({
    source_concept_id: r.source_concept_id,
    relation_type: r.relation_name,
    target_concept_id: r.target_concept_id,
  }));

  // Build policies
  const policies = {
    answer_policy: 'Provide accurate, clear, and clinically backed factual statements without exaggerations.',
    cta_policy: vibe?.[0]?.cta_policy || 'Recommend consulting a specialist or refer to the official locator.',
    evidence_policy: 'Explicitly bind core performance claims to clinical verification or documentation.',
    safety_policy: 'Ensure YMYL guidelines are strictly followed. Add proper disclosures for sensitive claims.',
    tone_policy: vibe?.[0]?.brand_guide_text || 'Professional, trustworthy, and empathetic.',
  };

  return {
    brand_name: brandName,
    core_concepts: coreConceptsMapped,
    forbidden_concepts: forbiddenConceptsList,
    expected_relations: expectedRelationsMapped,
    policies,
  };
}

/**
 * Builds the QBS Item Context for a specific probe question.
 */
export async function buildQBSItemContext(probeQuestionId: string): Promise<QBSItemContext> {
  const supabase = getSupabaseAdminClient();

  // 1. Fetch probe question
  const { data: q } = await supabase
    .from('probe_questions')
    .select('*')
    .eq('id', probeQuestionId)
    .single();

  if (!q) {
    throw new Error(`Probe question not found: ${probeQuestionId}`);
  }

  // 2. Fetch expected layers (5 tiers)
  const { data: el } = await supabase
    .from('expected_layers')
    .select('*')
    .eq('probe_question_id', probeQuestionId)
    .single();

  // Map expected layers to required, optional, and forbidden concepts
  const required = [...(el?.must_include || []), ...(el?.strongly_recommended || [])];
  const optional = el?.should_include || [];
  const forbidden = [...(el?.caution || []), ...(el?.must_not_do || [])];

  return {
    query_text: q.question_text,
    intent_type: q.intent_context || 'informational',
    required_concepts: required,
    optional_concepts: optional,
    forbidden_concepts: forbidden,
    expected_policy: {
      answer_mode: 'factual',
      cta_policy: q.intent_context === 'commercial' ? 'locator' : 'consultation',
      safety_policy: 'disclose_risks',
      evidence_required: required.length > 0,
      tone: 'balanced',
    },
    importance_weight: 1.0, // default weight
  };
}
