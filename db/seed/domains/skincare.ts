import { getSupabaseAdminClient } from '../../../lib/supabase';
import { upsertRecord, logSeeded, MOCK_PROXY_CAVEAT, SIMULATED_USER_ID } from '../utils';
import { DR_O_SSOT } from './dr-o-ssot';
import { INDUSTRY_PANELS_DATA } from '../industry-panels/questions-data';

/**
 * Idempotent seeder for the Skincare domain (specifically DR.O)
 * Following the reference 26-table Full Loop pattern from k-beauty.ts
 */
export async function seedSkincare(workspaceId: string, domainId: string) {
  console.log('Seeding Skincare Domain (DR.O) Full-Loop Artifacts...');
  const supabase = getSupabaseAdminClient();

  // 1. Brand Truth
  const truth = await upsertRecord('brand_truths', {
    workspace_id: workspaceId,
    brand_name: DR_O_SSOT.brand_name_ko,
    strategic_intent: DR_O_SSOT.strategic_intent,
    claims: { strategic: DR_O_SSOT.claims[0].text },
    status: 'locked'
  }, 'workspace_id,brand_name');
  logSeeded('brand_truths', truth.id, DR_O_SSOT.brand_name_ko);

  // 2. Evidence
  const evidence = await upsertRecord('truth_evidence', {
    workspace_id: workspaceId,
    evidence_name: 'DR.O Medical Research Clinical Trials 2026',
    evidence_type: 'certificate',
    raw_payload: { author: 'DR.O Medical Science Lab', parameters: 'Clinical trial with 98% barrier recovery rate' },
    is_verified: true
  }, 'workspace_id,evidence_name');
  logSeeded('truth_evidence', evidence.id, 'DR.O Clinical Trials');

  // 3. Boundary
  const boundary = await upsertRecord('claim_boundaries', {
    workspace_id: workspaceId,
    boundary_name: 'DR.O YMYL Safety & Regulatory Boundaries',
    restricted_claims: DR_O_SSOT.forbidden_claims,
    safety_disclaimers: ['Use strictly as part of a daily post-procedure skincare routine. Consult dermatologist if irritation occurs.']
  }, 'workspace_id,boundary_name');
  logSeeded('claim_boundaries', boundary.id, 'DR.O Safety Limits');

  // 4. Question Capital
  const capital = await upsertRecord('question_capitals', {
    workspace_id: workspaceId,
    capital_name: 'Skincare post-procedure recovery intents capital',
    target_demographics: ['post_procedure_patients', 'sensitive_skin_cohort'],
    market_sizing: { cohort_size: 150000 }
  }, 'workspace_id,capital_name');
  logSeeded('question_capitals', capital.id, 'Skincare recovery intents');

  // 5. Canonical Question (CQ)
  const cq = await upsertRecord('canonical_questions', {
    workspace_id: workspaceId,
    question_capital_id: capital.id,
    unique_signature: 'cq-skincare-dro-post-procedure-recovery',
    question_text: '피부과 레이저 시술 후 예민해진 피부 장벽 회복 케어 루틴은 어떻게 짜야 하나요?'
  }, 'unique_signature');
  logSeeded('canonical_questions', cq.id, '피부과 시술 후 회복 루틴');

  // 6. QIS
  const qis = await upsertRecord('qis_scenes', {
    workspace_id: workspaceId,
    canonical_question_id: cq.id,
    scene_name: 'DR.O post-procedure recovery routine QIS',
    query_template: 'What is the best recovery routine for skin barrier after laser treatments?',
    intent_model: 'informational'
  }, 'workspace_id,scene_name');
  logSeeded('qis_scenes', qis.id, 'DR.O recovery routine QIS');

  // 7. TCO Concepts & 8. KG Nodes (We loop through all 8 concepts from SSoT)
  const conceptIds: string[] = [];
  for (const conceptSpec of DR_O_SSOT.concepts) {
    const concept = await upsertRecord('tco_concepts', {
      workspace_id: workspaceId,
      concept_name: conceptSpec.label,
      slug: conceptSpec.id,
      classification: 'clinical_routine'
    }, 'workspace_id,slug');
    conceptIds.push(concept.id);
    logSeeded('tco_concepts', concept.id, `Concept: ${conceptSpec.label}`);

    const node = await upsertRecord('kg_nodes', {
      workspace_id: workspaceId,
      concept_id: concept.id,
      node_label: `${conceptSpec.label} Node`,
      attributes: { definition: conceptSpec.definition }
    }, 'workspace_id,concept_id');
    logSeeded('kg_nodes', node.id, `KG Node: ${conceptSpec.label}`);
  }

  // 9. Claim Lineage
  const lineage = await upsertRecord('claim_lineages', {
    workspace_id: workspaceId,
    truth_id: truth.id,
    unique_hash: 'lineage-hash-skincare-droanswer-001',
    status: 'valid'
  }, 'workspace_id,unique_hash');
  logSeeded('claim_lineages', lineage.id, 'DR.O Claim Lineage');

  // 10. Representation Objects (Loop through products)
  const roIds: string[] = [];
  for (const product of DR_O_SSOT.products) {
    const slug = product.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const repObject = await upsertRecord('representation_objects', {
      workspace_id: workspaceId,
      domain_id: domainId,
      object_name: product.name,
      slug: slug,
      object_type: 'product',
      payload: { ingredients: product.ingredients, features: product.features, type: product.type },
      is_ready: true
    }, 'workspace_id,slug');
    roIds.push(repObject.id);
    logSeeded('representation_objects', repObject.id, `Product Object: ${product.name}`);

    // 11. Surface Contract
    const contract = await upsertRecord('surface_contracts', {
      workspace_id: workspaceId,
      representation_object_id: repObject.id,
      contract_name: `${product.name} Surface Contract`,
      slug: `${slug}-surface-contract`,
      structured_schema: { jsonld: 'ProductCredential', brand: 'DR.O' }
    }, 'workspace_id,slug');
    logSeeded('surface_contracts', contract.id, `Surface Contract for ${product.name}`);

    // 12. Semantic Page
    const page = await upsertRecord('semantic_pages', {
      workspace_id: workspaceId,
      surface_contract_id: contract.id,
      page_title: `${product.name} Official Product Guide`,
      slug: `${slug}-guide`,
      page_body: `Official guide for ${product.name} (${product.type}). Formulated with active ${product.ingredients.join(', ')} to provide ${product.features.join('. ')}.`
    }, 'workspace_id,slug');
    logSeeded('semantic_pages', page.id, `Semantic Page for ${product.name}`);
  }

  // 13. PersonaSpec
  const persona = await upsertRecord('persona_specs', {
    workspace_id: workspaceId,
    persona_name: 'DR.O Clinical Advisor',
    slug: 'dr-o-clinical-advisor',
    tone_weights: { formal: 0.7, helpful: 0.3 },
    instructions: ['State clinical ceramideNP and cooling ingredients', 'Enforce the concept of Derma Reset', 'Never assert medical disease cure']
  }, 'workspace_id,slug');
  logSeeded('persona_specs', persona.id, 'DR.O Clinical Advisor Persona');

  // 14. VibeSpec
  const vibe = await upsertRecord('vibe_specs', {
    workspace_id: workspaceId,
    vibe_name: 'Clinical & Scientific Care Vibe',
    slug: 'clinical-scientific-care-vibe',
    vibe_ratios: { trustworthiness: 0.60, clarity: 0.25, warmth: 0.15 },
    evidence_links_count: 8
  }, 'workspace_id,slug');
  logSeeded('vibe_specs', vibe.id, 'DR.O Vibe Spec');

  // 15. Probe Panel
  const panel = await upsertRecord('probe_panels', {
    workspace_id: workspaceId,
    panel_name: 'SBS-AIPR-Skincare-v1',
    slug: 'sbs-aipr-skincare-v1',
    is_locked: true
  }, 'workspace_id,slug');
  logSeeded('probe_panels', panel.id, 'Skincare Panel');

  // 16 & 16.5 Seed Probe Questions and Expected Layers from INDUSTRY_PANELS_DATA
  const skincarePanelData = INDUSTRY_PANELS_DATA['skincare'];
  if (skincarePanelData && skincarePanelData.questions) {
    console.log(`[Seeder] Inserting ${skincarePanelData.questions.length} questions into database...`);
    let qCount = 0;
    
    for (const qSpec of skincarePanelData.questions) {
      // 16. Probe Questions (Frozen in panel)
      const question = await upsertRecord('probe_questions', {
        workspace_id: workspaceId,
        probe_panel_id: panel.id,
        question_text: qSpec.question_text,
        intent_context: qSpec.intent_context,
        target_keyword: qSpec.target_keyword.replace('{brand}', DR_O_SSOT.brand_name_ko)
      }, 'workspace_id,probe_panel_id,question_text');

      // 16.5 Seed Expected Layers
      // Dynamically replace template tokens with DR.O
      const must_include = qSpec.must_include.map(x => x.replace('{brand}', DR_O_SSOT.brand_name_ko).replace('{competitor}', '닥터자르트'));
      const should_include = qSpec.should_include.map(x => x.replace('{brand}', DR_O_SSOT.brand_name_ko).replace('{competitor}', '닥터자르트'));
      const must_not_do = qSpec.must_not_do.map(x => x.replace('{brand}', DR_O_SSOT.brand_name_ko).replace('{competitor}', '닥터자르트'));

      await upsertRecord('expected_layers', {
        workspace_id: workspaceId,
        probe_question_id: question.id,
        must_include,
        should_include,
        must_not_do,
        expected_layer_version: 1
      }, 'workspace_id,probe_question_id');

      qCount++;
      if (qCount % 30 === 0) {
        console.log(`[Seeder] ...seeded ${qCount} / ${skincarePanelData.questions.length} questions.`);
      }
    }
    console.log(`[Seeder] Completed seeding all ${qCount} questions and expected layers.`);
  }

  // 17. Mock Observation Run
  const run = await upsertRecord('ai_observation_runs', {
    workspace_id: workspaceId,
    probe_panel_id: panel.id,
    observation_model: 'Google Gemini Pro (Observed Proxy)',
    status: 'completed'
  }, 'workspace_id,probe_panel_id');
  logSeeded('ai_observation_runs', run.id, 'Skincare Observation Run');

  // 18. Probe Run (Stored Raw copy of the first question just as placeholder)
  const firstDbQuestion = await supabase.from('probe_questions')
    .select('id')
    .eq('probe_panel_id', panel.id)
    .limit(1)
    .single();

  if (firstDbQuestion.data) {
    const probeRun = await upsertRecord('probe_runs', {
      workspace_id: workspaceId,
      ai_observation_run_id: run.id,
      probe_question_id: firstDbQuestion.data.id,
      raw_response_text: 'Mentions 닥터오 더마 리셋 recovery routine that completely matches expected layers.',
      status: 'success'
    }, 'workspace_id,ai_observation_run_id,probe_question_id');
    logSeeded('probe_runs', probeRun.id, 'Skincare Stored Raw Response Copy');

    // 19. Response Judgment
    const judgment = await upsertRecord('response_judgments', {
      workspace_id: workspaceId,
      probe_run_id: probeRun.id,
      reviewer_id: SIMULATED_USER_ID,
      is_citation_found: true,
      brand_semantic_fidelity_score: 98.00,
      geo_concept_transferred: true,
      question_territory_covered: true
    }, 'workspace_id,probe_run_id');
    logSeeded('response_judgments', judgment.id, 'Skincare Judgment Score');
  }

  // 20. Metric Snapshots
  const snapshot = await upsertRecord('metric_snapshots', {
    workspace_id: workspaceId,
    ai_observation_run_id: run.id,
    metric_name: 'ARS',
    metric_value: 98.00
  }, 'workspace_id,ai_observation_run_id,metric_name');
  logSeeded('metric_snapshots', snapshot.id, 'Skincare Readiness Metric Snapshot');

  // 21. Methodology Disclosure (Appendix)
  const disclosure = await upsertRecord('methodology_disclosures', {
    workspace_id: workspaceId,
    disclosure_name: 'Skincare Standard Crawl disclosure v1',
    slug: 'skincare-standard-crawl-disclosure',
    methodology_description: 'Aggregates 155 standard Goldilocks questions across all 7 layers.',
    proxy_caveat_text: MOCK_PROXY_CAVEAT
  }, 'workspace_id,slug');
  logSeeded('methodology_disclosures', disclosure.id, 'Skincare Methodology Disclosure');

  // 22. Benchmark Report
  const report = await upsertRecord('benchmark_reports', {
    workspace_id: workspaceId,
    report_name: 'DR.O Skincare Brand Reset Trust Report',
    panel_version: 1,
    scores: { ARS: 98.00, OCR: 100.00, AAS: 100.00, BSF: 98.00 },
    methodology_disclosure_id: disclosure.id,
    is_published: true
  }, 'workspace_id,report_name');
  logSeeded('benchmark_reports', report.id, 'DR.O Skincare Trust Report');

  console.log('SUCCESS: Skincare (DR.O) Domain Full-Loop Seeding completed.');
}
