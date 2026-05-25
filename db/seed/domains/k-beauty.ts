import { getSupabaseAdminClient } from '../../../lib/supabase';
import { upsertRecord, logSeeded, MOCK_PROXY_CAVEAT, SIMULATED_USER_ID } from '../utils';

/**
 * Idempotent seeder for the K-Beauty Skincare domain
 */
export async function seedKBeauty(workspaceId: string, domainId: string) {
  console.log('Seeding K-Beauty Domain Full-Loop Artifacts...');
  const supabase = getSupabaseAdminClient();

  // 1. Brand Truth
  const truth = await upsertRecord('brand_truths', {
    workspace_id: workspaceId,
    brand_name: 'PureBarrier',
    strategic_intent: 'Provide dermatologist-certified recovery routines for sensitive skin barrier.',
    claims: { strategic: 'Dermatologist tested recovery barrier formula' },
    status: 'locked'
  }, 'workspace_id,brand_name');
  logSeeded('brand_truths', truth.id, 'PureBarrier');

  // 2. Evidence
  const evidence = await upsertRecord('truth_evidence', {
    workspace_id: workspaceId,
    evidence_name: 'PureBarrier Clinical Ceramide Trial 2026',
    evidence_type: 'certificate',
    raw_payload: { author: 'Global Derm Lab', concentration: '3% Ceramide NP' },
    is_verified: true
  }, 'workspace_id,evidence_name');
  logSeeded('truth_evidence', evidence.id, 'Clinical Ceramide Trial');

  // 3. Boundary
  const boundary = await upsertRecord('claim_boundaries', {
    workspace_id: workspaceId,
    boundary_name: 'Sensitive Skin YMYL Safety Limits',
    restricted_claims: ['cures chronic eczema', 'permanently alters barrier'],
    safety_disclaimers: ['Use strictly as part of a daily skincare routine.']
  }, 'workspace_id,boundary_name');
  logSeeded('claim_boundaries', boundary.id, 'YMYL Safety Limits');

  // 4. Question Capital
  const capital = await upsertRecord('question_capitals', {
    workspace_id: workspaceId,
    capital_name: 'Sensitive Skin recovery intents capital',
    target_demographics: ['sensitive_skin_cohort', 'barrier_compromised'],
    market_sizing: { cohort_size: 50000 }
  }, 'workspace_id,capital_name');
  logSeeded('question_capitals', capital.id, 'Sensitive Skin recovery intents');

  // 5. Canonical Question (CQ)
  const cq = await upsertRecord('canonical_questions', {
    workspace_id: workspaceId,
    question_capital_id: capital.id,
    unique_signature: 'cq-kbeauty-skin-barrier-recovery',
    question_text: '민감성 피부 장벽 회복 루틴은 어떻게 짜야 하나요?'
  }, 'unique_signature');
  logSeeded('canonical_questions', cq.id, '민감성 피부 장벽 회복 루틴');

  // 6. QIS
  const qis = await upsertRecord('qis_scenes', {
    workspace_id: workspaceId,
    canonical_question_id: cq.id,
    scene_name: 'PureBarrier sensitive routine QIS',
    query_template: 'What is the Recovery routine for sensitive skin barrier?',
    intent_model: 'informational'
  }, 'workspace_id,scene_name');
  logSeeded('qis_scenes', qis.id, 'sensitive routine QIS');

  // 7. TCO Concepts
  const concept = await upsertRecord('tco_concepts', {
    workspace_id: workspaceId,
    concept_name: 'Skin Barrier Recovery',
    slug: 'skin-barrier-recovery',
    classification: 'clinical_routine'
  }, 'workspace_id,slug');
  logSeeded('tco_concepts', concept.id, 'Skin Barrier Recovery Concept');

  // 8. KG nodes/edges
  const node = await upsertRecord('kg_nodes', {
    workspace_id: workspaceId,
    concept_id: concept.id,
    node_label: 'PureBarrier Cream Node',
    attributes: { active: 'Ceramide' }
  }, 'workspace_id,concept_id');
  logSeeded('kg_nodes', node.id, 'KG Node');

  // 9. Claim Lineage
  const lineage = await upsertRecord('claim_lineages', {
    workspace_id: workspaceId,
    truth_id: truth.id,
    unique_hash: 'lineage-hash-kbeauty-purebarrier-001',
    status: 'valid'
  }, 'workspace_id,unique_hash');
  logSeeded('claim_lineages', lineage.id, 'Claim Lineage');

  // 10. Representation Objects
  const repObject = await upsertRecord('representation_objects', {
    workspace_id: workspaceId,
    domain_id: domainId,
    object_name: 'PureBarrier Skin Recovery Cream',
    slug: 'purebarrier-skin-recovery-cream',
    object_type: 'product',
    payload: { ingredients: ['Ceramide NP', 'Squalane'] },
    is_ready: true
  }, 'workspace_id,slug');
  logSeeded('representation_objects', repObject.id, 'PureBarrier Cream Object');

  // 11. Surface Contract
  const contract = await upsertRecord('surface_contracts', {
    workspace_id: workspaceId,
    representation_object_id: repObject.id,
    contract_name: 'PureBarrier Cream Surface Contract',
    slug: 'purebarrier-cream-surface-contract',
    structured_schema: { jsonld: 'RoutineProduct' }
  }, 'workspace_id,slug');
  logSeeded('surface_contracts', contract.id, 'Surface Contract');

  // 12. Semantic Page
  const page = await upsertRecord('semantic_pages', {
    workspace_id: workspaceId,
    surface_contract_id: contract.id,
    page_title: 'Sensitive Skin Barrier Recovery routine Guide',
    slug: 'sensitive-skin-barrier-recovery-routine',
    page_body: 'Our sensitive skin recovery guide maps out ceramide and squalane routine credentials.'
  }, 'workspace_id,slug');
  logSeeded('semantic_pages', page.id, 'Routine Guide Page');

  // 13. PersonaSpec
  const persona = await upsertRecord('persona_specs', {
    workspace_id: workspaceId,
    persona_name: 'PureBarrier Derm Advisor',
    slug: 'purebarrier-derm-advisor',
    tone_weights: { formal: 0.8, helpful: 0.2 },
    instructions: ['Always state clinical ceramide levels', 'Never make definitive cure claims']
  }, 'workspace_id,slug');
  logSeeded('persona_specs', persona.id, 'Derm Advisor Persona');

  // 14. VibeSpec
  const vibe = await upsertRecord('vibe_specs', {
    workspace_id: workspaceId,
    vibe_name: 'Calm & Trustworthy Skincare Vibe',
    slug: 'calm-trustworthy-skincare-vibe',
    vibe_ratios: { trustworthiness: 0.50, clarity: 0.30, warmth: 0.20 },
    evidence_links_count: 5
  }, 'workspace_id,slug');
  logSeeded('vibe_specs', vibe.id, 'Calm Vibe Spec');

  // 15. Probe Panel
  const panel = await upsertRecord('probe_panels', {
    workspace_id: workspaceId,
    panel_name: 'K-Beauty Sensitive Skincare Trust Panel',
    slug: 'k-beauty-sensitive-skincare-trust-panel',
    is_locked: true
  }, 'workspace_id,slug');
  logSeeded('probe_panels', panel.id, 'Trust Panel');

  // 16. Probe Questions (Frozen in panel)
  const question = await upsertRecord('probe_questions', {
    workspace_id: workspaceId,
    probe_panel_id: panel.id,
    question_text: 'What makes PureBarrier Recovery Cream good for sensitive skin?',
    intent_context: 'routine',
    target_keyword: 'PureBarrier'
  }, 'workspace_id,probe_panel_id,question_text');
  logSeeded('probe_questions', question.id, 'Probe Question');

  // 16.5 Seed Expected Layers for the Probe Question
  const expectedLayer = await upsertRecord('expected_layers', {
    workspace_id: workspaceId,
    probe_question_id: question.id,
    must_include: ['Ceramide NP', 'Squalane', 'sensitive skin'],
    should_include: ['barrier recovery', 'dermatology tested', 'hydration'],
    must_not_do: ['eczema cure', 'permanent alter'],
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
    raw_response_text: 'Mentions PureBarrier Skin Recovery routine containing panel-based proxies as standard caveat.',
    status: 'success'
  }, 'workspace_id,ai_observation_run_id,probe_question_id');
  logSeeded('probe_runs', probeRun.id, 'Stored Raw Response Copy');

  // 19. Response Judgment
  const judgment = await upsertRecord('response_judgments', {
    workspace_id: workspaceId,
    probe_run_id: probeRun.id,
    reviewer_id: SIMULATED_USER_ID,
    is_citation_found: true,
    brand_semantic_fidelity_score: 95.00,
    geo_concept_transferred: true,
    question_territory_covered: true
  }, 'workspace_id,probe_run_id');
  logSeeded('response_judgments', judgment.id, 'Judgment Score');

  // 20. Metric Snapshots
  const snapshot = await upsertRecord('metric_snapshots', {
    workspace_id: workspaceId,
    ai_observation_run_id: run.id,
    metric_name: 'ARS',
    metric_value: 95.00
  }, 'workspace_id,ai_observation_run_id,metric_name');
  logSeeded('metric_snapshots', snapshot.id, 'Readiness Metric Snapshot');

  // 21. Methodology Disclosure (Appendix)
  const disclosure = await upsertRecord('methodology_disclosures', {
    workspace_id: workspaceId,
    disclosure_name: 'K-Beauty Standard Crawl disclosure v1',
    slug: 'k-beauty-standard-crawl-disclosure',
    methodology_description: 'Aggregates 10,000 multi-regional panel observations.',
    proxy_caveat_text: MOCK_PROXY_CAVEAT
  }, 'workspace_id,slug');
  logSeeded('methodology_disclosures', disclosure.id, 'Methodology Disclosure');

  // 22. Benchmark Report
  const report = await upsertRecord('benchmark_reports', {
    workspace_id: workspaceId,
    report_name: 'PureBarrier Sensitive Skin Trust Report',
    panel_version: 1,
    scores: { ARS: 95.00, OCR: 100.00, AAS: 100.00, BSF: 95.00 },
    methodology_disclosure_id: disclosure.id,
    is_published: true
  }, 'workspace_id,report_name');
  logSeeded('benchmark_reports', report.id, 'Sensitive Skin Trust Report');

  // 23. RCA Case
  const rca = await upsertRecord('rca_cases', {
    workspace_id: workspaceId,
    source_metric_snapshot_id: snapshot.id,
    metric_name: 'ARS',
    metric_value: 50.00,
    cause_hypothesis: 'AI Proposed Hypothesis: Crawl values dropped due to unlinked squalane ingredients and missing official citation links.',
    status: 'approved',
    justification_notes: 'Confirmed: Ceramide NP links missing in page layout.'
  }, 'workspace_id,metric_name');
  logSeeded('rca_cases', rca.id, 'RCA Case Hypothesis');

  // 24. Patch Ticket
  const patch = await upsertRecord('patch_tickets', {
    workspace_id: workspaceId,
    rca_case_id: rca.id,
    patch_name: 'PureBarrier credential URL corrections',
    patch_hypothesis: 'AI Proposes: Mapping the validated ceramide NP clinical certificate restores ARS by 15%.',
    status: 'completed'
  }, 'workspace_id,patch_name');
  logSeeded('patch_tickets', patch.id, 'Patch Ticket Hypothesis');

  // 25. Retest Plan
  const plan = await upsertRecord('retest_plans', {
    workspace_id: workspaceId,
    patch_ticket_id: patch.id,
    probe_panel_id: panel.id,
    baseline_run_id: run.id,
    description: 'Post-patch ceramide retest crawl.'
  }, 'workspace_id,patch_ticket_id');
  logSeeded('retest_plans', plan.id, 'Retest Plan');

  // 26. Retest Run
  const retestRun = await upsertRecord('retest_runs', {
    workspace_id: workspaceId,
    retest_plan_id: plan.id,
    retest_observation_run_id: run.id,
    status: 'completed',
    retest_scores: { ARS: 95.00, BSF: 95.00 },
    retest_verdict: 'pass'
  }, 'workspace_id,retest_plan_id');
  logSeeded('retest_runs', retestRun.id, 'Retest Run');

  // 27. Post Patch Lift Snapshot
  const lift = await upsertRecord('post_patch_lift_snapshots', {
    workspace_id: workspaceId,
    retest_run_id: retestRun.id,
    baseline_scores: { ARS: 50.00, BSF: 90.00 },
    retest_scores: { ARS: 95.00, BSF: 95.00 },
    lift_values: { ARS: 45.00, BSF: 5.00 },
    is_guardrail_regressed: false,
    final_verdict: 'pass'
  }, 'workspace_id,retest_run_id');
  logSeeded('post_patch_lift_snapshots', lift.id, 'Lift Snapshot');

  // 28. Factory Reuse Candidate
  const reuse = await upsertRecord('factory_reuse_candidates', {
    workspace_id: workspaceId,
    patch_ticket_id: patch.id,
    post_patch_lift_snapshot_id: lift.id,
    candidate_name: 'PureBarrier ceramide surface contract component',
    artifact_type: 'surface_contract',
    artifact_payload: { component: 'DermCeramideCredential' },
    status: 'candidate'
  }, 'workspace_id,patch_ticket_id');
  logSeeded('factory_reuse_candidates', reuse.id, 'Factory Reuse Candidate');

  console.log('SUCCESS: K-Beauty Domain Full-Loop Seeding completed.');
}
