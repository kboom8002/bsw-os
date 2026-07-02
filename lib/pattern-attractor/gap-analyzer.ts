import { getSupabaseAdminClient } from '../supabase';
import { PatternAttractorSpec, AttractorGapReport, GapType } from './types';

export class GapAnalyzer {
  // Analyze gaps between standard domain attractors and brand portfolios
  async analyzeBrandGaps(
    workspaceId: string,
    brandId: string,
    domainId: string,
    domainStandardAttractors: PatternAttractorSpec[]
  ): Promise<AttractorGapReport> {
    const supabase = getSupabaseAdminClient();

    // 1. Fetch brand's portfolio entries
    const { data: portfolioEntries, error: portfolioError } = await supabase
      .from('brand_attractor_portfolios')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('brand_id', brandId)
      .eq('domain_id', domainId);

    if (portfolioError) {
      console.error('[GapAnalyzer] DB query failed:', portfolioError);
      throw new Error(`포트폴리오 데이터 조회 실패: ${portfolioError.message}`);
    }

    const activeEntries = portfolioEntries || [];
    const gaps: any[] = [];
    const tasks: string[] = [];

    // 2. Identify missing attractors
    for (const standard of domainStandardAttractors) {
      const entry = activeEntries.find((e) => e.attractor_id === standard.id);
      
      if (!entry) {
        // Missing!
        gaps.push({
          gap_type: 'missing_attractor' as GapType,
          attractor_id: standard.id,
          severity: 'critical',
          affected_query_states: standard.trigger_state?.user_question_patterns || [],
          diagnosis: `브랜드 자산 내에 '${standard.natural_definition}' 패턴을 처리할 수 있는 콘텐츠/챗봇 가이드가 전혀 존재하지 않습니다.`,
          recommended_fix: `'${standard.natural_definition}'용 Pattern Attractor를 활성화하고 7개 채널의 Media Soliton 자산을 생성하여 배치하세요.`
        });
        tasks.push(`[NEW] Create Brand Attractor for ${standard.id}`);
        continue;
      }

      // Check for weak attractor (low readiness score)
      const readiness = Number(entry.readiness_score || 0);
      const gapTypes = entry.gap_types || [];

      if (entry.status === 'weak' || readiness < 60) {
        gaps.push({
          gap_type: 'weak_attractor' as GapType,
          attractor_id: standard.id,
          severity: 'high',
          affected_query_states: standard.trigger_state?.user_question_patterns || [],
          diagnosis: `패턴이 등록되어 있으나 완성도(Readiness: ${readiness}%)가 낮습니다. 필수 개념 결여 혹은 Evidence 연결이 누락되었습니다.`,
          recommended_fix: `필수 TCO 개념을 보강하고, Claim 원본 원격 검증 서명을 바인딩하세요.`
        });
        tasks.push(`[WEAK] Upgrade Concept/Evidence Binding for ${standard.id}`);
      }

      // Check for misalignment (vibe or cta mismatch)
      if (gapTypes.includes('misaligned_attractor') || entry.status === 'misaligned') {
        gaps.push({
          gap_type: 'misaligned_attractor' as GapType,
          attractor_id: standard.id,
          severity: 'medium',
          affected_query_states: standard.trigger_state?.user_question_patterns || [],
          diagnosis: `목표 Vibe Signature와 실제 콘텐츠의 감성 정서 정렬도(alignment)가 어긋납니다.`,
          recommended_fix: `L0-L3 Vibe spec에 맞게 카피와 CTA 톤을 수정하여 재생성하세요.`
        });
        tasks.push(`[ALIGN] Recalibrate Vibe Signature for ${standard.id}`);
      }

      // Check for safety / unsafe attractor
      if (gapTypes.includes('unsafe_attractor') || entry.status === 'unsafe') {
        gaps.push({
          gap_type: 'unsafe_attractor' as GapType,
          attractor_id: standard.id,
          severity: 'critical',
          affected_query_states: standard.trigger_state?.user_question_patterns || [],
          diagnosis: `안전 경계(safety policy) 위반 또는 금지된 카피 구문(must_not_do)이 포함되어 있습니다.`,
          recommended_fix: `Action Policy를 강제 가드로 재설정하고, 위반 키워드를 제거하세요.`
        });
        tasks.push(`[SAFE] Enforce Boundary Action Guard for ${standard.id}`);
      }
    }

    // Calculate portfolio score
    const totalPossible = domainStandardAttractors.length;
    const missingCount = gaps.filter((g) => g.gap_type === 'missing_attractor').length;
    const portfolio_score = totalPossible > 0 ? parseFloat(((1 - missingCount / totalPossible) * 100).toFixed(2)) : 0;

    return {
      brand_id: brandId,
      domain_id: domainId,
      portfolio_score,
      gaps,
      recomposition_tasks: tasks
    };
  }
}
