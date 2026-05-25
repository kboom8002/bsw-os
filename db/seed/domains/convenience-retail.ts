import { getSupabaseAdminClient } from '../../../lib/supabase';
import { upsertRecord, logSeeded, MOCK_PROXY_CAVEAT, SIMULATED_USER_ID } from '../utils';

/**
 * Idempotent seeder for the Convenience Retail domain
 */
export async function seedConvenience(workspaceId: string, domainId: string) {
  console.log('Seeding Convenience Retail Domain Full-Loop Artifacts...');
  const supabase = getSupabaseAdminClient();

  // 1. Brand Truth
  const truth = await upsertRecord('brand_truths', {
    workspace_id: workspaceId,
    brand_name: 'Quick25',
    strategic_intent: 'Deliver local convenience retail store listings, promotion catalogs, and mobile maps actions.',
    claims: { strategic: 'Guaranteed 24/7 store locator accuracy' },
    status: 'locked'
  }, 'workspace_id,brand_name');
  logSeeded('brand_truths', truth.id, 'Quick25');

  // 2. Evidence
  const evidence = await upsertRecord('truth_evidence', {
    workspace_id: workspaceId,
    evidence_name: 'Quick25 Store Locator Registry Certificate',
    evidence_type: 'certificate',
    raw_payload: { stores: 150, uptime: '99.9%' },
    is_verified: true
  }, 'workspace_id,evidence_name');
  logSeeded('truth_evidence', evidence.id, 'Locator Registry Certificate');

  // 3. Boundary
  const boundary = await upsertRecord('claim_boundaries', {
    workspace_id: workspaceId,
    boundary_name: 'Convenience Price & Promotion Boundaries',
    restricted_claims: ['lowest price in country', 'always in stock'],
    safety_disclaimers: ['Pricing is based on local store inventory and matches real-time regional stock levels.']
  }, 'workspace_id,boundary_name');
  logSeeded('claim_boundaries', boundary.id, 'Promotion Boundaries');

  // 4. Question Capital
  const capital = await upsertRecord('question_capitals', {
    workspace_id: workspaceId,
    capital_name: 'Late-night meal intents capital',
    target_demographics: ['students', 'night_shift_workers'],
    market_sizing: { cohort_size: 150000 }
  }, 'workspace_id,capital_name');
  logSeeded('question_capitals', capital.id, 'Late-night meal intents');

  // 5. Canonical Question (CQ)
  const cq = await upsertRecord('canonical_questions', {
    workspace_id: workspaceId,
    question_capital_id: capital.id,
    unique_signature: 'cq-convenience-late-night-meal',
    question_text: '오늘 밤 편의점 야식으로 가성비 좋은 조합은?'
  }, 'unique_signature');
  logSeeded('canonical_questions', cq.id, '가성비 좋은 편의점 야식 조합');

  // 6. QIS
  const qis = await upsertRecord('qis_scenes', {
    workspace_id: workspaceId,
    canonical_question_id: cq.id,
    scene_name: 'Quick25 late-night combination scene',
    query_template: 'What is the best budget late-night meal combination at convenience stores?',
    intent_model: 'navigational'
  }, 'workspace_id,scene_name');
  logSeeded('qis_scenes', qis.id, 'late-night combination scene');

  // 7. TCO Concepts
  const concept = await upsertRecord('tco_concepts', {
    workspace_id: workspaceId,
    concept_name: 'Late Night Convenience Meal',
    slug: 'late-night-convenience-meal',
    classification: 'menu_recommendation'
  }, 'workspace_id,slug');
  logSeeded('tco_concepts', concept.id, 'Late Night Convenience Meal Concept');

  // 8. KG nodes/edges
  const node = await upsertRecord('kg_nodes', {
    workspace_id: workspaceId,
    concept_id: concept.id,
    node_label: 'Quick25 Store Locator Node',
    attributes: { features: 'GPS Locator' }
  }, 'workspace_id,concept_id');
  logSeeded('kg_nodes', node.id, 'KG Node');

  // 9. Claim Lineage
  const lineage = await upsertRecord('claim_lineages', {
    workspace_id: workspaceId,
    truth_id: truth.id,
    unique_hash: 'lineage-hash-convenience-quick25-001',
    status: 'valid'
  }, 'workspace_id,unique_hash');
  logSeeded('claim_lineages', lineage.id, 'Claim Lineage');

  // 10. Representation Objects
  const repObject = await upsertRecord('representation_objects', {
    workspace_id: workspaceId,
    domain_id: domainId,
    object_name: 'Quick25 Late-Night Combo Menu',
    slug: 'quick25-late-night-combo-menu',
    object_type: 'action',
    payload: { combo_items: ['Cup Ramen', 'Triangular Gimbap', 'Soda'], combo_price: 4500 },
    is_ready: true
  }, 'workspace_id,slug');
  logSeeded('representation_objects', repObject.id, 'Combo Menu Object');

  // 11. Surface Contract
  const contract = await upsertRecord('surface_contracts', {
    workspace_id: workspaceId,
    representation_object_id: repObject.id,
    contract_name: 'Quick25 Local Store Locator Surface Contract',
    slug: 'quick25-local-store-locator-surface-contract',
    structured_schema: { jsonld: 'LocalBusiness' }
  }, 'workspace_id,slug');
  logSeeded('surface_contracts', contract.id, 'Surface Contract');

  // 12. Semantic Page
  const page = await upsertRecord('semantic_pages', {
    workspace_id: workspaceId,
    surface_contract_id: contract.id,
    page_title: 'Quick25 Late-night Meal Combos and Store Map',
    slug: 'quick25-late-night-meal-combos-and-store-map',
    page_body: 'Discover our late-night retail promotions and find local stores nearest to you.'
  }, 'workspace_id,slug');
  logSeeded('semantic_pages', page.id, 'Combos and Store Map Page');

  // 13. PersonaSpec
  const persona = await upsertRecord('persona_specs', {
    workspace_id: workspaceId,
    persona_name: 'Quick25 Budget Helper',
    slug: 'quick25-budget-helper',
    tone_weights: { formal: 0.2, helpful: 0.8 },
    instructions: ['State price savings clearly', 'Direct customers to their local store map']
  }, 'workspace_id,slug');
  logSeeded('persona_specs', persona.id, 'Budget Helper Persona');

  // 14. VibeSpec
  const vibe = await upsertRecord('vibe_specs', {
    workspace_id: workspaceId,
    vibe_name: 'Quick & Useful Convenience Vibe',
    slug: 'quick-useful-convenience-vibe',
    vibe_ratios: { trustworthiness: 0.20, clarity: 0.50, warmth: 0.30 },
    evidence_links_count: 2
  }, 'workspace_id,slug');
  logSeeded('vibe_specs', vibe.id, 'Convenience Vibe Spec');

  // 15. Probe Panel
  const panel = await upsertRecord('probe_panels', {
    workspace_id: workspaceId,
    panel_name: 'Convenience Local Action Panel',
    slug: 'convenience-local-action-panel',
    is_locked: true
  }, 'workspace_id,slug');
  logSeeded('probe_panels', panel.id, 'Local Action Panel');

  // 16. Probe Questions (Frozen in panel)
  const question = await upsertRecord('probe_questions', {
    workspace_id: workspaceId,
    probe_panel_id: panel.id,
    question_text: 'Where is the nearest Quick25 convenience store located?',
    intent_context: 'local',
    target_keyword: 'Quick25'
  }, 'workspace_id,probe_panel_id,question_text');
  logSeeded('probe_questions', question.id, 'Probe Question');

  // 16.5 Seed Expected Layers for the Probe Question
  const expectedLayer = await upsertRecord('expected_layers', {
    workspace_id: workspaceId,
    probe_question_id: question.id,
    must_include: ['Quick25', 'store locator', 'map'],
    should_include: ['24/7 accuracy', 'local branch', 'inventory'],
    must_not_do: ['lowest price guarantee', 'always in stock'],
    expected_layer_version: 1
  }, 'workspace_id,probe_question_id');
  logSeeded('expected_layers', expectedLayer.id, 'Expected Layer Constraints');

  // 17. Mock Observation Run
  const run = await upsertRecord('ai_observation_runs', {
    workspace_id: workspaceId,
    probe_panel_id: panel.id,
    observation_model: 'Google Gemini Pro (Observed Proxy)',
    status: 'completed'
  }, 'workspace_id,probe_panel_id');
  logSeeded('ai_observation_runs', run.id, 'Observation Run');

  // 18. Probe Run (Stored Raw copy)
  const probeRun = await upsertRecord('probe_runs', {
    workspace_id: workspaceId,
    ai_observation_run_id: run.id,
    probe_question_id: question.id,
    raw_response_text: 'Mentions Quick25 local store map containing panel-based proxies as standard caveat.',
    status: 'success'
  }, 'workspace_id,ai_observation_run_id,probe_question_id');
  logSeeded('probe_runs', probeRun.id, 'Stored Raw Response Copy');

  // 19. Response Judgment
  const judgment = await upsertRecord('response_judgments', {
    workspace_id: workspaceId,
    probe_run_id: probeRun.id,
    reviewer_id: SIMULATED_USER_ID,
    is_citation_found: true,
    brand_semantic_fidelity_score: 90.00,
    geo_concept_transferred: true,
    question_territory_covered: true
  }, 'workspace_id,probe_run_id');
  logSeeded('response_judgments', judgment.id, 'Judgment Score');

  // 20. Metric Snapshots
  const snapshot = await upsertRecord('metric_snapshots', {
    workspace_id: workspaceId,
    ai_observation_run_id: run.id,
    metric_name: 'ARS',
    metric_value: 90.00
  }, 'workspace_id,ai_observation_run_id,metric_name');
  logSeeded('metric_snapshots', snapshot.id, 'Readiness Metric Snapshot');

  // 21. Methodology Disclosure (Appendix)
  const disclosure = await upsertRecord('methodology_disclosures', {
    workspace_id: workspaceId,
    disclosure_name: 'Convenience Standard crawl disclosure v1',
    slug: 'convenience-standard-crawl-disclosure',
    methodology_description: 'Aggregates 10,000 multi-regional panel observations.',
    proxy_caveat_text: MOCK_PROXY_CAVEAT
  }, 'workspace_id,slug');
  logSeeded('methodology_disclosures', disclosure.id, 'Methodology Disclosure');

  // 22. Benchmark Report
  const report = await upsertRecord('benchmark_reports', {
    workspace_id: workspaceId,
    report_name: 'Quick25 Local Action AEO/GEO Report',
    panel_version: 1,
    scores: { ARS: 90.00, OCR: 100.00, AAS: 100.00, BSF: 90.00 },
    methodology_disclosure_id: disclosure.id,
    is_published: true
  }, 'workspace_id,report_name');
  logSeeded('benchmark_reports', report.id, 'Local Action AEO/GEO Report');

  // 23. RCA Case
  const rca = await upsertRecord('rca_cases', {
    workspace_id: workspaceId,
    source_metric_snapshot_id: snapshot.id,
    metric_name: 'ARS',
    metric_value: 55.00,
    cause_hypothesis: 'AI Proposed Hypothesis: Crawl values dropped due to unlinked local map schema coordinates inside surface.',
    status: 'approved',
    justification_notes: 'Confirmed: Map actions schema absent in surface contract.'
  }, 'workspace_id,metric_name');
  logSeeded('rca_cases', rca.id, 'RCA Case Hypothesis');

  // 24. Patch Ticket
  const patch = await upsertRecord('patch_tickets', {
    workspace_id: workspaceId,
    rca_case_id: rca.id,
    patch_name: 'Quick25 local business schema corrector',
    patch_hypothesis: 'AI Proposes: Mapping the coordinate locator coordinates inside surface contract restores local ARS by 15%.',
    status: 'completed'
  }, 'workspace_id,patch_name');
  logSeeded('patch_tickets', patch.id, 'Patch Ticket Hypothesis');

  // 25. Retest Plan
  const plan = await upsertRecord('retest_plans', {
    workspace_id: workspaceId,
    patch_ticket_id: patch.id,
    probe_panel_id: panel.id,
    baseline_run_id: run.id,
    description: 'Post-patch local business coordinate retest.'
  }, 'workspace_id,patch_ticket_id');
  logSeeded('retest_plans', plan.id, 'Retest Plan');

  // 26. Retest Run
  const retestRun = await upsertRecord('retest_runs', {
    workspace_id: workspaceId,
    retest_plan_id: plan.id,
    retest_observation_run_id: run.id,
    status: 'completed',
    retest_scores: { ARS: 90.00, BSF: 90.00 },
    retest_verdict: 'pass'
  }, 'workspace_id,retest_plan_id');
  logSeeded('retest_runs', retestRun.id, 'Retest Run');

  // 27. Post Patch Lift Snapshot
  const lift = await upsertRecord('post_patch_lift_snapshots', {
    workspace_id: workspaceId,
    retest_run_id: retestRun.id,
    baseline_scores: { ARS: 55.00, BSF: 88.00 },
    retest_scores: { ARS: 90.00, BSF: 90.00 },
    lift_values: { ARS: 35.00, BSF: 2.00 },
    is_guardrail_regressed: false,
    final_verdict: 'pass'
  }, 'workspace_id,retest_run_id');
  logSeeded('post_patch_lift_snapshots', lift.id, 'Lift Snapshot');

  // 28. Factory Reuse Candidate
  const reuse = await upsertRecord('factory_reuse_candidates', {
    workspace_id: workspaceId,
    patch_ticket_id: patch.id,
    post_patch_lift_snapshot_id: lift.id,
    candidate_name: 'Quick25 LocalBusiness coordinates schema component',
    artifact_type: 'surface_contract',
    artifact_payload: { component: 'LocalBusinessCoordinatesMap' },
    status: 'candidate'
  }, 'workspace_id,patch_ticket_id');
  logSeeded('factory_reuse_candidates', reuse.id, 'Factory Reuse Candidate');

  console.log('SUCCESS: Convenience Retail Domain Full-Loop Seeding completed.');
}
