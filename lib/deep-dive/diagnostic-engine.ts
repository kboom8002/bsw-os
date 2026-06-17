import { getSupabaseAdminClient } from '../supabase';
import { computeDMRI } from '../metrics/d-mri';
import { OpportunityAnalyzer } from '../benchmark/opportunity-analyzer';
import { DeepDiveDiagnostic } from './types';
import { getDomainConfig } from '../benchmark/domain-config';

export class DiagnosticEngine {
  /**
   * Run the full brand diagnostic mapping across all 5 dimensions.
   */
  static async runDiagnostic(workspaceId: string, brandSlug: string, domainSlug: string): Promise<DeepDiveDiagnostic> {
    const supabase = getSupabaseAdminClient();
    
    // 1. D-MRI
    const dmriResult = await computeDMRI(workspaceId);
    
    // 2. Benchmark Snapshot
    const domainConfig = getDomainConfig(domainSlug);
    const brandName = domainConfig?.brands.find(b => b.slug === brandSlug)?.name || brandSlug;
    
    let benchmarkSnapshot = {
      aas: 0, ocr: 0, bsf: 0, bair: 0,
      bdr: 0, cwr: 0, iri: 0, opp: 0,
      rank: 0, totalBrands: 0
    };
    
    const { data: latestSnapshot } = await supabase
      .from('industry_benchmark_snapshots')
      .select('leaderboard')
      .eq('domain_slug', domainSlug)
      .order('measured_at', { ascending: false })
      .limit(1)
      .single();
      
    if (latestSnapshot && latestSnapshot.leaderboard) {
      const lb = latestSnapshot.leaderboard as any[];
      const brandEntry = lb.find(b => b.brand_slug === brandSlug);
      if (brandEntry) {
        benchmarkSnapshot = {
          aas: brandEntry.aas, ocr: brandEntry.ocr, bsf: brandEntry.bsf, bair: brandEntry.bair,
          bdr: brandEntry.bdr || 0, cwr: brandEntry.cwr || 0, iri: brandEntry.iri || 0, opp: brandEntry.opp || 0,
          rank: brandEntry.rank, totalBrands: lb.length
        };
      }
    }
    
    // 3. E-E-A-T Gap Analysis (Mocked call from latest questions data)
    // In reality, this would fetch from probe_runs or judgments.
    // We'll construct an empty OpportunityReport since we don't have the currentDetails available synchronously here.
    // The real implementation would query `metrics/lightweight` or `judgments` for currentDetails.
    const opportunityReport = {
      brand_slug: brandSlug,
      brand_name: brandName,
      total_opportunities: 0,
      high_priority_count: 0,
      opportunities: [],
      eeat_summary: { expertise_gaps: 0, experience_gaps: 0, authority_gaps: 0, trust_gaps: 0 },
      top_action_items: []
    };
    
    // 4. Truth Readiness
    const { data: opTruths } = await supabase.from('brand_operational_truths').select('id, review_status').eq('workspace_id', workspaceId);
    const { data: strTruths } = await supabase.from('brand_strategic_truths').select('id').eq('workspace_id', workspaceId);
    const { data: lineages } = await supabase.from('lineage_records').select('id, is_publishable').eq('workspace_id', workspaceId);
    const { data: lockEvals } = await supabase.from('truth_lock_evaluations').select('gate_level, is_passed').eq('workspace_id', workspaceId).order('evaluated_at', { ascending: false }).limit(1);

    const totalClaims = opTruths?.length || 0;
    const approvedClaims = opTruths?.filter(t => t.review_status === 'approved').length || 0;
    const restrictedClaims = opTruths?.filter(t => t.review_status === 'restricted').length || 0;
    
    // 5. Semantic Audit
    const { count: capCount } = await supabase.from('question_capital_nodes').select('id', { count: 'exact' }).eq('workspace_id', workspaceId);
    const { count: cqCount } = await supabase.from('canonical_questions').select('id', { count: 'exact' }).eq('workspace_id', workspaceId);
    const { count: qisCount } = await supabase.from('qis_scenes').select('id', { count: 'exact' }).eq('workspace_id', workspaceId);
    const { count: conceptCount } = await supabase.from('tco_concepts').select('id', { count: 'exact' });
    const { count: ontologyCount } = await supabase.from('brand_ontology_nodes').select('id', { count: 'exact' }).eq('workspace_id', workspaceId);
    
    const { data: linkedCqs } = await supabase.from('canonical_questions').select('id').eq('workspace_id', workspaceId).not('question_capital_node_id', 'is', null);
    const linkageRate = cqCount && cqCount > 0 ? (linkedCqs?.length || 0) / cqCount * 100 : 0;
    
    return {
      dmri: { value: dmriResult.value, components: dmriResult.components as any },
      benchmarkSnapshot,
      opportunityReport,
      truthAudit: {
        strategicTruthExists: !!(strTruths && strTruths.length > 0),
        operationalClaims: { total: totalClaims, approved: approvedClaims, restricted: restrictedClaims },
        evidenceCoverage: 50, // mock calculation
        boundaryCoverage: 50, // mock calculation
        lineageSealed: lineages?.filter(l => l.is_publishable).length || 0,
        gateLevel: (lockEvals && lockEvals[0]?.is_passed) ? lockEvals[0].gate_level as any : 'L0'
      },
      semanticAudit: {
        questionCapitalNodes: capCount || 0,
        canonicalQuestions: cqCount || 0,
        qisScenes: qisCount || 0,
        linkageRate,
        conceptsCount: conceptCount || 0,
        ontologyNodeCount: ontologyCount || 0
      }
    };
  }
}
