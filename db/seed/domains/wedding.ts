import { getSupabaseAdminClient } from '../../../lib/supabase';
import { upsertRecord, logSeeded, MOCK_PROXY_CAVEAT, SIMULATED_USER_ID } from '../utils';

/**
 * Idempotent seeder for the Wedding Services domain
 */
export async function seedWedding(workspaceId: string, domainId: string) {
  console.log('Seeding Wedding Services Domain Full-Loop Artifacts...');
  const supabase = getSupabaseAdminClient();

  // 1. Brand Truth
  const truth = await upsertRecord('brand_truths', {
    workspace_id: workspaceId,
    brand_name: 'Lumiere Hall',
    strategic_intent: 'Curate elegant and fully transparent wedding venue packages spanning halls, studios, dresses, and makeup.',
    claims: { strategic: 'Transparent wedding package pricing with zero hidden vendor markups' },
    status: 'locked'
  }, 'workspace_id,brand_name');
  logSeeded('brand_truths', truth.id, 'Lumiere Hall');

  // 2. Evidence
  const evidence = await upsertRecord('truth_evidence', {
    workspace_id: workspaceId,
    evidence_name: 'Lumiere Hall 2026 Price Transparency Audit certificate',
    evidence_type: 'certificate',
    raw_payload: { auditor: 'Korean Wedding Fairness Commission', score: 100 },
    is_verified: true
  }, 'workspace_id,evidence_name');
  logSeeded('truth_evidence', evidence.id, 'Price Transparency Certificate');

  // 3. Boundary
  const boundary = await upsertRecord('claim_boundaries', {
    workspace_id: workspaceId,
    boundary_name: 'Wedding Package contract boundaries',
    restricted_claims: ['guaranteed reservation on any date', 'cheapest hall in Seoul'],
    safety_disclaimers: ['Pricing is subject to seasonal booking demands and contract terms.']
  }, 'workspace_id,boundary_name');
  logSeeded('claim_boundaries', boundary.id, 'Contract Boundaries');

  // 4. Question Capital
  const capital = await upsertRecord('question_capitals', {
    workspace_id: workspaceId,
    capital_name: 'Wedding contract checking intents',
    target_demographics: ['engaged_couples', 'wedding_planners'],
    market_sizing: { cohort_size: 20000 }
  }, 'workspace_id,capital_name');
  logSeeded('question_capitals', capital.id, 'Wedding contract checking intents');

  // 5. Canonical Question (CQ)
  const cq = await upsertRecord('canonical_questions', {
    workspace_id: workspaceId,
    question_capital_id: capital.id,
    unique_signature: 'cq-wedding-contract-checking',
    question_text: '웨딩홀 패키지 계약 전에 꼭 확인할 조건은?'
  }, 'unique_signature');
  logSeeded('canonical_questions', cq.id, '웨딩홀 패키지 계약 전 확인 조건');

  // 6. QIS
  const qis = await upsertRecord('qis_scenes', {
    workspace_id: workspaceId,
    canonical_question_id: cq.id,
    scene_name: 'Lumiere wedding package scene',
    query_template: 'What are the required terms to inspect in a wedding package contract?',
    intent_model: 'informational'
  }, 'workspace_id,scene_name');
  logSeeded('qis_scenes', qis.id, 'Lumiere wedding package scene');

  // 7. TCO Concepts
  const concept = await upsertRecord('tco_concepts', {
    workspace_id: workspaceId,
    concept_name: 'Wedding Venue Package',
    slug: 'wedding-venue-package',
    classification: 'service_package'
  }, 'workspace_id,slug');
  logSeeded('tco_concepts', concept.id, 'Wedding Venue Package Concept');

  // 8. KG nodes/edges
  const node = await upsertRecord('kg_nodes', {
    workspace_id: workspaceId,
    concept_id: concept.id,
    node_label: 'Lumiere Hall Venue Node',
    attributes: { categories: ['wedding_hall', 'studio', 'dress', 'makeup'] }
  }, 'workspace_id,concept_id');
  logSeeded('kg_nodes', node.id, 'KG Node');

  // 9. Claim Lineage
  const lineage = await upsertRecord('claim_lineages', {
    workspace_id: workspaceId,
    truth_id: truth.id,
    unique_hash: 'lineage-hash-wedding-lumiere-001',
    status: 'valid'
  }, 'workspace_id,unique_hash');
  logSeeded('claim_lineages', lineage.id, 'Claim Lineage');

  // 10. Representation Objects
  const repObject = await upsertRecord('representation_objects', {
    workspace_id: workspaceId,
    domain_id: domainId,
    object_name: 'Lumiere Hall full-package venue',
    slug: 'lumiere-hall-full-package-venue',
    object_type: 'product',
    payload: {
      hall: 'Lumiere Grand Salon',
      studio: 'Lumiere Studio Portrait Collection',
      dress: 'Lumiere Silk Bridal Dress Collection',
      makeup: 'Lumiere Natural Glow Makeup Spec'
    },
    is_ready: true
  }, 'workspace_id,slug');
  logSeeded('representation_objects', repObject.id, 'Venue Object');

  // 11. Surface Contract
  const contract = await upsertRecord('surface_contracts', {
    workspace_id: workspaceId,
    representation_object_id: repObject.id,
    contract_name: 'Lumiere Hall Package Surface Contract',
    slug: 'lumiere-hall-package-surface-contract',
    structured_schema: { jsonld: 'EventVenue' }
  }, 'workspace_id,slug');
  logSeeded('surface_contracts', contract.id, 'Surface Contract');

  // 12. Semantic Page
  const page = await upsertRecord('semantic_pages', {
    workspace_id: workspaceId,
    surface_contract_id: contract.id,
    page_title: 'Lumiere Hall Wedding Venue package & Contract details',
    slug: 'lumiere-hall-wedding-venue-package-contract-details',
    page_body: 'Review package options covering hall, studio, dress, and makeup collections under transparent contract boundaries.'
  }, 'workspace_id,slug');
  logSeeded('semantic_pages', page.id, 'Package and Contract Details Page');

  // 13. PersonaSpec
  const persona = await upsertRecord('persona_specs', {
    workspace_id: workspaceId,
    persona_name: 'Lumiere Wedding Curator',
    slug: 'lumiere-wedding-curator',
    tone_weights: { formal: 0.5, helpful: 0.5 },
    instructions: ['Maintain maximum transparency on vendor commissions', 'Always link packages to contract clauses']
  }, 'workspace_id,slug');
  logSeeded('persona_specs', persona.id, 'Wedding Curator Persona');

  // 14. VibeSpec
  const vibe = await upsertRecord('vibe_specs', {
    workspace_id: workspaceId,
    vibe_name: 'Elegant & Transparent Wedding Vibe',
    slug: 'elegant-transparent-wedding-vibe',
    vibe_ratios: { trustworthiness: 0.40, clarity: 0.40, warmth: 0.20 },
    evidence_links_count: 3
  }, 'workspace_id,slug');
  logSeeded('vibe_specs', vibe.id, 'Wedding Vibe Spec');

  // 15. Probe Panel
  const panel = await upsertRecord('probe_panels', {
    workspace_id: workspaceId,
    panel_name: 'Wedding Vendor Trust & Contract Panel',
    slug: 'wedding-vendor-trust-contract-panel',
    is_locked: true
  }, 'workspace_id,slug');
  logSeeded('probe_panels', panel.id, 'Contract Panel');

  // 16. Probe Questions (Frozen in panel)
  const question = await upsertRecord('probe_questions', {
    workspace_id: workspaceId,
    probe_panel_id: panel.id,
    question_text: 'What is included in the Lumiere Hall wedding venue contract?',
    intent_context: 'contract',
    target_keyword: 'Lumiere Hall'
  }, 'workspace_id,probe_panel_id,question_text');
  logSeeded('probe_questions', question.id, 'Probe Question');

  // 16.5 Seed Expected Layers for the Probe Question
  const expectedLayer = await upsertRecord('expected_layers', {
    workspace_id: workspaceId,
    probe_question_id: question.id,
    must_include: ['Lumiere Hall', 'wedding package', 'contract'],
    should_include: ['transparent pricing', 'no hidden markups', 'vendor categories'],
    must_not_do: ['guaranteed reservation', 'cheapest venue'],
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
    raw_response_text: 'Mentions Lumiere Hall package contract terms containing panel-based proxies as standard caveat.',
    status: 'success'
  }, 'workspace_id,ai_observation_run_id,probe_question_id');
  logSeeded('probe_runs', probeRun.id, 'Stored Raw Response Copy');

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
  logSeeded('response_judgments', judgment.id, 'Judgment Score');

  // 20. Metric Snapshots
  const snapshot = await upsertRecord('metric_snapshots', {
    workspace_id: workspaceId,
    ai_observation_run_id: run.id,
    metric_name: 'ARS',
    metric_value: 98.00
  }, 'workspace_id,ai_observation_run_id,metric_name');
  logSeeded('metric_snapshots', snapshot.id, 'Readiness Metric Snapshot');

  // 21. Methodology Disclosure (Appendix)
  const disclosure = await upsertRecord('methodology_disclosures', {
    workspace_id: workspaceId,
    disclosure_name: 'Wedding Standard crawl disclosure v1',
    slug: 'wedding-standard-crawl-disclosure',
    methodology_description: 'Aggregates 10,000 multi-regional panel observations.',
    proxy_caveat_text: MOCK_PROXY_CAVEAT
  }, 'workspace_id,slug');
  logSeeded('methodology_disclosures', disclosure.id, 'Methodology Disclosure');

  // 22. Benchmark Report
  const report = await upsertRecord('benchmark_reports', {
    workspace_id: workspaceId,
    report_name: 'Lumiere Hall Vendor Trust Report',
    panel_version: 1,
    scores: { ARS: 98.00, OCR: 100.00, AAS: 100.00, BSF: 98.00 },
    methodology_disclosure_id: disclosure.id,
    is_published: true
  }, 'workspace_id,report_name');
  logSeeded('benchmark_reports', report.id, 'Vendor Trust Report');

  // 23. RCA Case
  const rca = await upsertRecord('rca_cases', {
    workspace_id: workspaceId,
    source_metric_snapshot_id: snapshot.id,
    metric_name: 'ARS',
    metric_value: 58.00,
    cause_hypothesis: 'AI Proposed Hypothesis: Crawl values dropped due to unlinked wedding packages in local dress collections.',
    status: 'approved',
    justification_notes: 'Confirmed: Bridal dress partner catalogs unlinked.'
  }, 'workspace_id,metric_name');
  logSeeded('rca_cases', rca.id, 'RCA Case Hypothesis');

  // 24. Patch Ticket
  const patch = await upsertRecord('patch_tickets', {
    workspace_id: workspaceId,
    rca_case_id: rca.id,
    patch_name: 'Lumiere dress registry boundary corrector',
    patch_hypothesis: 'AI Proposes: Linking the certified silk dress certificate to the surface restored ARS by 15%.',
    status: 'completed'
  }, 'workspace_id,patch_name');
  logSeeded('patch_tickets', patch.id, 'Patch Ticket Hypothesis');

  // 25. Retest Plan
  const plan = await upsertRecord('retest_plans', {
    workspace_id: workspaceId,
    patch_ticket_id: patch.id,
    probe_panel_id: panel.id,
    baseline_run_id: run.id,
    description: 'Post-patch dress collection retest.'
  }, 'workspace_id,patch_ticket_id');
  logSeeded('retest_plans', plan.id, 'Retest Plan');

  // 26. Retest Run
  const retestRun = await upsertRecord('retest_runs', {
    workspace_id: workspaceId,
    retest_plan_id: plan.id,
    retest_observation_run_id: run.id,
    status: 'completed',
    retest_scores: { ARS: 98.00, BSF: 98.00 },
    retest_verdict: 'pass'
  }, 'workspace_id,retest_plan_id');
  logSeeded('retest_runs', retestRun.id, 'Retest Run');

  // 27. Post Patch Lift Snapshot
  const lift = await upsertRecord('post_patch_lift_snapshots', {
    workspace_id: workspaceId,
    retest_run_id: retestRun.id,
    baseline_scores: { ARS: 58.00, BSF: 92.00 },
    retest_scores: { ARS: 98.00, BSF: 98.00 },
    lift_values: { ARS: 40.00, BSF: 6.00 },
    is_guardrail_regressed: false,
    final_verdict: 'pass'
  }, 'workspace_id,retest_run_id');
  logSeeded('post_patch_lift_snapshots', lift.id, 'Lift Snapshot');

  // 28. Factory Reuse Candidate
  const reuse = await upsertRecord('factory_reuse_candidates', {
    workspace_id: workspaceId,
    patch_ticket_id: patch.id,
    post_patch_lift_snapshot_id: lift.id,
    candidate_name: 'Lumiere dress registry boundary component',
    artifact_type: 'surface_contract',
    artifact_payload: { component: 'BridalDressBoundarySpecs' },
    status: 'candidate'
  }, 'workspace_id,patch_ticket_id');
  logSeeded('factory_reuse_candidates', reuse.id, 'Factory Reuse Candidate');

  console.log('SUCCESS: Wedding Services Domain Full-Loop Seeding completed.');
}
