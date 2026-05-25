import { getSupabaseAdminClient } from '../supabase';

export interface DMriResult {
  value: number;
  components: {
    truthReadiness: number;
    evidenceReadiness: number;
    boundaryReadiness: number;
    questionSystemReadiness: number;
    conceptKgReadiness: number;
    claimLineageReadiness: number;
    objectReadiness: number;
    surfacePageReadiness: number;
    exportReadiness: number;
    personaVibeReadiness: number;
    observatoryCoverage: number;
    fixItTraceability: number;
  };
}

export async function computeDMRI(workspaceId: string): Promise<DMriResult> {
  const supabase = getSupabaseAdminClient();

  // 1. Truth Readiness
  let truthReadiness = 0.0;
  const { data: opTruths } = await supabase
    .from('brand_operational_truths')
    .select('review_status')
    .eq('workspace_id', workspaceId);

  const { data: strTruths } = await supabase
    .from('brand_strategic_truths')
    .select('id')
    .eq('workspace_id', workspaceId)
    .limit(1);

  if (opTruths && opTruths.length > 0) {
    const approved = opTruths.filter(t => t.review_status === 'approved').length;
    const drafts = opTruths.filter(t => t.review_status === 'draft' || t.review_status === 'in_review').length;
    const score = (approved * 1.0 + drafts * 0.7 + (opTruths.length - approved - drafts) * 0.4) / opTruths.length;
    truthReadiness = strTruths && strTruths.length > 0 ? score : score * 0.8;
  }

  // 2. Evidence Readiness
  let evidenceReadiness = 0.0;
  if (opTruths && opTruths.length > 0) {
    const { data: truthEvidence } = await supabase
      .from('brand_operational_truth_evidence')
      .select('operational_truth_id');

    if (truthEvidence) {
      const hasEvIds = new Set(truthEvidence.map(te => te.operational_truth_id));
      evidenceReadiness = hasEvIds.size / opTruths.length;
    }
  }

  // 3. Boundary Readiness
  let boundaryReadiness = 0.0;
  const { data: boundaries } = await supabase
    .from('boundary_rules')
    .select('id')
    .eq('workspace_id', workspaceId);

  if (boundaries && boundaries.length > 0) {
    boundaryReadiness = 0.4;
    const { data: optBoundaries } = await supabase
      .from('brand_operational_truth_boundaries')
      .select('operational_truth_id');

    if (optBoundaries && opTruths && opTruths.length > 0) {
      const hasBoundIds = new Set(optBoundaries.map(ob => ob.operational_truth_id));
      boundaryReadiness = Math.min(1.0, 0.4 + 0.6 * (hasBoundIds.size / opTruths.length));
    }
  }

  // 4. Question System Readiness
  let questionSystemReadiness = 0.0;
  const { data: cqs } = await supabase
    .from('canonical_questions')
    .select('question_capital_node_id')
    .eq('workspace_id', workspaceId);

  const { data: qis } = await supabase
    .from('qis_scenes')
    .select('canonical_question_id')
    .eq('workspace_id', workspaceId);

  if (cqs && cqs.length > 0) {
    const cqLinked = cqs.filter(cq => cq.question_capital_node_id !== null).length / cqs.length;
    const qisLinked = qis && qis.length > 0
      ? qis.filter(q => q.canonical_question_id !== null).length / qis.length
      : 0.0;
    questionSystemReadiness = (cqLinked + qisLinked) / 2;
  }

  // 5. Concept KG Readiness
  let conceptKgReadiness = 0.0;
  const { data: kgNodes } = await supabase
    .from('brand_ontology_nodes')
    .select('id')
    .eq('workspace_id', workspaceId);

  const { data: kgEdges } = await supabase
    .from('brand_ontology_edges')
    .select('id')
    .eq('workspace_id', workspaceId);

  if (kgNodes && kgNodes.length > 0) {
    conceptKgReadiness = 0.4;
    if (kgEdges && kgEdges.length > 0) {
      conceptKgReadiness = Math.min(1.0, 0.4 + 0.6 * (kgEdges.length / kgNodes.length));
    }
  }

  // 6. Claim Lineage Readiness
  let claimLineageReadiness = 0.0;
  const { data: claimNodes } = await supabase
    .from('claim_nodes')
    .select('id')
    .eq('workspace_id', workspaceId);

  if (claimNodes && claimNodes.length > 0) {
    const { data: lineages } = await supabase
      .from('lineage_records')
      .select('claim_node_id')
      .eq('workspace_id', workspaceId);

    if (lineages) {
      const hasLinIds = new Set(lineages.map(l => l.claim_node_id));
      claimLineageReadiness = hasLinIds.size / claimNodes.length;
    }
  }

  // 7. Object Readiness
  let objectReadiness = 0.0;
  const { data: repObjects } = await supabase
    .from('representation_objects')
    .select('readiness_status')
    .eq('workspace_id', workspaceId);

  if (repObjects && repObjects.length > 0) {
    const ready = repObjects.filter(o => o.readiness_status === 'ready').length;
    const drafts = repObjects.filter(o => o.readiness_status === 'draft').length;
    objectReadiness = (ready * 1.0 + drafts * 0.7 + (repObjects.length - ready - drafts) * 0.4) / repObjects.length;
  }

  // 8. Surface/Page Readiness
  let surfacePageReadiness = 0.0;
  const { data: contracts } = await supabase
    .from('surface_contracts')
    .select('is_valid')
    .eq('workspace_id', workspaceId);

  const { data: mappings } = await supabase
    .from('schema_mappings')
    .select('is_valid')
    .eq('workspace_id', workspaceId);

  if (contracts && contracts.length > 0) {
    const validContracts = contracts.filter(c => c.is_valid).length / contracts.length;
    const validMappings = mappings && mappings.length > 0
      ? mappings.filter(m => m.is_valid).length / mappings.length
      : 1.0;
    surfacePageReadiness = (validContracts + validMappings) / 2;
  }

  // 9. Export Readiness
  let exportReadiness = 0.0;
  const { data: pages } = await supabase
    .from('semantic_pages')
    .select('id')
    .eq('workspace_id', workspaceId);

  if (pages && pages.length > 0) {
    const { data: exports } = await supabase
      .from('seo_aeo_geo_exports')
      .select('semantic_page_id')
      .eq('workspace_id', workspaceId);

    if (exports) {
      const hasExportIds = new Set(exports.map(e => e.semantic_page_id));
      exportReadiness = hasExportIds.size / pages.length;
    }
  }

  // 10. Persona/Vibe Readiness
  let personaVibeReadiness = 0.5;
  const { data: vibeSnaps } = await supabase
    .from('vibe_alignment_snapshots')
    .select('vpa')
    .eq('workspace_id', workspaceId);

  const { data: evalRuns } = await supabase
    .from('persona_eval_runs')
    .select('evaluation_metrics')
    .eq('workspace_id', workspaceId);

  let avgVpa = 0.5;
  if (vibeSnaps && vibeSnaps.length > 0) {
    avgVpa = vibeSnaps.reduce((acc, v) => acc + Number(v.vpa), 0) / vibeSnaps.length / 100;
  }

  let avgPmri = 0.5;
  if (evalRuns && evalRuns.length > 0) {
    const sum = evalRuns.reduce((acc, r) => {
      const pmriVal = (r.evaluation_metrics as any)?.pmri || 50.0;
      return acc + pmriVal;
    }, 0);
    avgPmri = sum / evalRuns.length / 100;
  }
  personaVibeReadiness = (avgVpa + avgPmri) / 2;

  // 11. Observatory Coverage
  let observatoryCoverage = 0.0;
  const { data: panels } = await supabase
    .from('probe_panels')
    .select('id, is_locked')
    .eq('workspace_id', workspaceId);

  if (panels && panels.length > 0) {
    observatoryCoverage = 0.4;
    const lockedPanels = panels.filter(p => p.is_locked);
    if (lockedPanels.length > 0) {
      const lockedIds = lockedPanels.map(lp => lp.id);
      const { count } = await supabase
        .from('probe_questions')
        .select('*', { count: 'exact', head: true })
        .in('probe_panel_id', lockedIds);

      observatoryCoverage = Math.min(1.0, 0.7 + 0.3 * ((count || 0) / 10));
    }
  }

  // 12. Fix-It Traceability
  let fixItTraceability = 0.0;
  const { data: rcas } = await supabase
    .from('rca_cases')
    .select('id')
    .eq('workspace_id', workspaceId)
    .limit(1);

  if (rcas && rcas.length > 0) {
    fixItTraceability = 0.4;
    const { data: patches } = await supabase
      .from('patch_tickets')
      .select('id')
      .eq('workspace_id', workspaceId)
      .limit(1);

    if (patches && patches.length > 0) {
      fixItTraceability = 0.7;
      const { data: retests } = await supabase
        .from('retest_runs')
        .select('id')
        .eq('workspace_id', workspaceId)
        .limit(1);

      if (retests && retests.length > 0) {
        fixItTraceability = 1.0;
      }
    }
  }

  const dMriValue =
    0.10 * truthReadiness +
    0.10 * evidenceReadiness +
    0.10 * boundaryReadiness +
    0.10 * questionSystemReadiness +
    0.10 * conceptKgReadiness +
    0.10 * claimLineageReadiness +
    0.10 * objectReadiness +
    0.10 * surfacePageReadiness +
    0.05 * exportReadiness +
    0.05 * personaVibeReadiness +
    0.05 * observatoryCoverage +
    0.05 * fixItTraceability;

  // Clamp to 0..1 then convert to 0..100 percentage scale for representation
  const value = Number((Math.max(0.0, Math.min(1.0, dMriValue)) * 100).toFixed(2));

  return {
    value,
    components: {
      truthReadiness: Number(truthReadiness.toFixed(4)),
      evidenceReadiness: Number(evidenceReadiness.toFixed(4)),
      boundaryReadiness: Number(boundaryReadiness.toFixed(4)),
      questionSystemReadiness: Number(questionSystemReadiness.toFixed(4)),
      conceptKgReadiness: Number(conceptKgReadiness.toFixed(4)),
      claimLineageReadiness: Number(claimLineageReadiness.toFixed(4)),
      objectReadiness: Number(objectReadiness.toFixed(4)),
      surfacePageReadiness: Number(surfacePageReadiness.toFixed(4)),
      exportReadiness: Number(exportReadiness.toFixed(4)),
      personaVibeReadiness: Number(personaVibeReadiness.toFixed(4)),
      observatoryCoverage: Number(observatoryCoverage.toFixed(4)),
      fixItTraceability: Number(fixItTraceability.toFixed(4))
    }
  };
}
