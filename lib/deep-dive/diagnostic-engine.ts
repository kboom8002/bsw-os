import { getSupabaseAdminClient } from '../supabase';
import { computeDMRI } from '../metrics/d-mri';
import { OpportunityAnalyzer } from '../benchmark/opportunity-analyzer';
import { QuestionDetail } from '../benchmark/lightweight-metric-runner';
import { DeepDiveDiagnostic } from './types';
import { getDomainConfig } from '../benchmark/domain-config';
import { runDeepDiveMeasure } from './measure-engine';

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
    
    let opportunityReport: any = null;
    let questionDetails: QuestionDetail[] = [];
    
    let benchmarkSnapshot: any = {
      aas: 0, ocr: 0, bsf: 0, bair: 0,
      bdr: 0, cwr: 0, iri: 0, opp: 0,
      rank: 0, totalBrands: 0,
      mentionQuality: { strongRate: 0, neutralRate: 0, negativeRate: 0 }
    };
    
    // 2 & 3. Real-time Deep Dive Measure (E-E-A-T Gap Analysis)
    let measureSuccess = false;
    try {
      // 직접 함수 호출을 통해 Vercel의 자기참조 fetch 실패 방지
      const measureData = await runDeepDiveMeasure(workspaceId, brandSlug, domainSlug);
      
      opportunityReport = measureData.opportunityReport;
      questionDetails = measureData.questionDetails || [];
      benchmarkSnapshot = measureData.benchmarkSnapshot;
      measureSuccess = true;
    } catch (e) {
      console.warn("[DiagnosticEngine] Failed to measure real-time deep dive metrics. Falling back to DB snapshot.", e);
    }
    
    // Fallback: If real-time measure failed, try to load from DB
    if (!measureSuccess) {
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
            aas: brandEntry.aas || 0,
            ocr: brandEntry.ocr || 0,
            bsf: brandEntry.bsf || 0,
            bair: brandEntry.bair || 0,
            bdr: brandEntry.bdr || 0,
            cwr: brandEntry.cwr || 0,
            iri: brandEntry.iri || 0,
            opp: brandEntry.opp || 0,
            rank: brandEntry.rank || 0,
            totalBrands: lb.length,
            mentionQuality: { strongRate: 0, neutralRate: 0, negativeRate: 0 }
          };
        }
      }
      
      // Provide an empty opportunity report if it couldn't be generated
      opportunityReport = {
        brand_slug: brandSlug,
        brand_name: brandName,
        total_opportunities: 0,
        high_priority_count: 0,
        opportunities: [],
        eeat_summary: { expertise_gaps: 0, experience_gaps: 0, authority_gaps: 0, trust_gaps: 0 },
        top_action_items: []
      };
    }
    
    // 4. Truth Readiness
    const { data: opTruths } = await supabase.from('brand_operational_truths').select('id, review_status').eq('workspace_id', workspaceId);
    const { data: strTruths } = await supabase.from('brand_strategic_truths').select('id').eq('workspace_id', workspaceId);
    const { data: lineages } = await supabase.from('lineage_records').select('id, is_publishable').eq('workspace_id', workspaceId);
    const { data: lockEvals } = await supabase.from('truth_lock_evaluations').select('gate_level, is_passed').eq('workspace_id', workspaceId).order('evaluated_at', { ascending: false }).limit(1);
    const { data: evCovLinks } = await supabase.from('brand_operational_truth_evidence').select('operational_truth_id').eq('workspace_id', workspaceId);
    const { data: bdCovLinks } = await supabase.from('brand_operational_truth_boundaries').select('operational_truth_id').eq('workspace_id', workspaceId);
    const { count: activeRulesCount } = await supabase.from('boundary_rules').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('is_active', true);

    const totalClaims = opTruths?.length || 0;
    const approvedClaims = opTruths?.filter(t => t.review_status === 'approved').length || 0;
    const restrictedClaims = opTruths?.filter(t => t.review_status === 'restricted').length || 0;
    // Calculate real coverage rates
    const claimsWithEvidence = new Set((evCovLinks || []).map((l: any) => l.operational_truth_id)).size;
    const claimsWithBoundary = new Set((bdCovLinks || []).map((l: any) => l.operational_truth_id)).size;
    const evidenceCoverage = totalClaims > 0 ? Math.round(claimsWithEvidence / totalClaims * 100) : 0;
    const boundaryCoverage = totalClaims > 0 ? Math.round(claimsWithBoundary / totalClaims * 100) : (activeRulesCount ? 100 : 0);
    
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
        evidenceCoverage,
        boundaryCoverage,
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
      },
      questionDetails
    };
  }
}
