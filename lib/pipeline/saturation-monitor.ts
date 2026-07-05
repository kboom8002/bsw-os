// lib/pipeline/saturation-monitor.ts

/**
 * CQ 포화도 모니터.
 * 현재 등록된 고유 CQ 수와 예상 검색 의도 풀의 크기를 비교하여 포화도를 백분율로 계산합니다.
 * 포화도가 70% 이상에 도달하면 신규 질문 발굴이 포화된 것으로 간주하고
 * 최신 AI 응답 트렌드(GAP/BLIND_SPOT)를 다시 감지할 수 있도록 벤치마크 재실행 권고 알림을 보냅니다.
 */

import { getSupabaseAdminClient } from '../supabase';
import { BENCHMARK_DOMAINS } from '../benchmark/domain-config';

export class SaturationMonitor {
  /**
   * CQ 포화도를 측정하고 임계(70%)를 초과했는지 확인합니다.
   */
  static async checkSaturation(
    workspaceId: string,
    domainKey: string
  ): Promise<{ coveragePercent: number; isNearSaturation: boolean; recommendation?: string }> {
    const supabase = getSupabaseAdminClient();
    const domainCfg = BENCHMARK_DOMAINS[domainKey as keyof typeof BENCHMARK_DOMAINS];
    
    // 1. 현재 구축된 총 CQ 갯수 조회
    const { count: cqCount, error } = await supabase
      .from('canonical_questions')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('domain_key', domainKey);

    if (error) {
      console.warn(`[SaturationMonitor] Failed to fetch CQ count:`, error.message);
    }

    // 2. 예상 검색 의도 풀 크기 정의 (업종 기본 질문 수 * 2 + 브랜드 수 * 10)
    const baseProbes = domainCfg ? domainCfg.sampleQuestionsForFull : 50;
    const brandCount = domainCfg ? domainCfg.brands.length : 10;
    const estimatedMaxPool = (baseProbes * 2) + (brandCount * 10);

    const coveragePercent = Math.min(100, Math.round(((cqCount ?? 0) / estimatedMaxPool) * 100));
    const isNearSaturation = coveragePercent >= 70; // 사용자 피드백에 따른 70% 임계 기준

    let recommendation: string | undefined;
    if (isNearSaturation) {
      recommendation = `CQ 포화도(${coveragePercent}%)가 임계점(70%)을 넘었습니다. 최신 시장 AI 답변의 새로운 GAP을 감지하기 위해 '업종 실측 벤치마크' 재실행을 강력 권고합니다.`;
    }

    console.log(`[SaturationMonitor] Domain: ${domainKey}, CQ Count: ${cqCount}/${estimatedMaxPool} (${coveragePercent}%), isNearSaturation: ${isNearSaturation}`);

    return {
      coveragePercent,
      isNearSaturation,
      recommendation
    };
  }
}
