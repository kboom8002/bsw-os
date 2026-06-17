import { ContentBlueprint, TargetQuestionCandidate } from './types';
import { getSupabaseAdminClient } from '../supabase';

export class ContentBlueprintGenerator {
  /**
   * Translates Target QIS candidates into actionable Content Blueprints
   */
  static async generate(
    workspaceId: string,
    candidates: TargetQuestionCandidate[]
  ): Promise<ContentBlueprint[]> {
    const supabase = getSupabaseAdminClient();
    const blueprints: ContentBlueprint[] = [];
    
    // Fetch some mock verified claims/evidence just to populate the blueprint
    // In real life, we would query semantic lineage that matches the keyword
    const { data: claims } = await supabase.from('brand_operational_truths').select('id').eq('workspace_id', workspaceId).eq('review_status', 'approved').limit(2);
    const { data: boundaries } = await supabase.from('boundary_rules').select('id, rule_name').eq('workspace_id', workspaceId).limit(1);

    const claimIds = claims?.map(c => c.id) || [];
    const boundaryIds = boundaries?.map(b => b.id) || [];
    const boundaryCaution = boundaries && boundaries.length > 0 ? boundaries[0].rule_name : '의학적 효능/효과 과장 금지';

    for (let i = 0; i < candidates.length; i++) {
      const cand = candidates[i];
      let contentType = 'authority_article';
      
      // Basic heuristic for content type
      if (cand.eeat_dimension === 'experience') contentType = 'review_hub';
      else if (cand.eeat_dimension === 'authority') contentType = 'comparison_guide';
      else if (cand.eeat_dimension === 'trust') contentType = 'faq_page';
      
      // Determine schema type based on content type
      let schemaType = 'Article';
      if (contentType === 'faq_page') schemaType = 'FAQPage';
      if (contentType === 'review_hub') schemaType = 'Review';
      
      blueprints.push({
        target_question_id: cand.id || `mock-cand-${i}`,
        target_cq_id: cand.registered_cq_id,
        content_type: contentType,
        title_suggestion_ko: `[제안] ${cand.question_text.replace(/\?$/, '')} 완벽 가이드`,
        heading_structure: [
          { level: 'h2', text: cand.question_text, target_keyword: 'core_intent', is_question_heading: true },
          { level: 'h2', text: `전문가들이 추천하는 해결책`, target_keyword: 'solution', is_question_heading: false },
          { level: 'h3', text: `핵심 체크리스트 3가지`, target_keyword: 'checklist', is_question_heading: false }
        ],
        expected_layer: {
          must_include: ['핵심성분', '인증마크', '안전성'],
          strongly_recommended: ['임상데이터', '사용후기'],
          should_include: ['사용방법', '추천대상'],
          caution: [boundaryCaution],
          must_not_do: ['타사 비하', '단정적 표현']
        },
        schema_suggestions: [
          { type: schemaType, properties: { 'about': cand.question_text } },
          { type: 'MedicalWebPage', properties: { 'audience': 'patients' } }
        ],
        linked_evidence_ids: [], // Mock
        linked_claim_ids: claimIds,
        linked_boundary_ids: boundaryIds,
        prescription_source: {
          quadrant: cand.sources.some(s => s.type === 'cross_map_red') ? 'red' : 'white',
          prescription_type: 'create_content',
          gap_detail: cand.sources[0]?.source_detail || ''
        },
        estimated_aepi_impact: cand.estimated_aepi_impact,
        estimated_bdr_delta: cand.estimated_bdr_delta,
        priority_rank: i + 1
      });
    }

    return blueprints;
  }
}
