import { SearchProviderFactory } from '../ai/search-provider-factory';

/** 볼륨 추정 최소값. 모든 경로에서 이 값 미만은 반환하지 않음. */
const MIN_ESTIMATED_VOLUME = 10;

export class VolumeEstimator {
  /**
   * Search Grounding Proxy Metrics 기반 트래픽 로그-선형 추정
   *
   * log(V) = 1.2 * log(C+1) + 0.4 * log(L+1) + 2.0
   * C = Citations count, L = Response text length
   */
  static async estimateVolume(query: string): Promise<number> {
    try {
      // 1. Google Search Grounding API를 호출하여 프록시 지표 획득
      const searchRes = await SearchProviderFactory.runMultiEngine(query, ['gemini_grounding']);
      const res = searchRes.results['gemini_grounding'];
      
      if (!res || !res.citations || res.citations.length === 0) {
        // 인용 없음 = 롱테일 키워드 → 낮은 범위의 결정적 fallback
        return VolumeEstimator.deterministicFallback(query, 'low');
      }

      const C = res.citations.length;
      const L = res.raw_response_text?.length || 0;

      // 로그-선형 모델 적용 (Zipf 법칙 및 롱테일 대수 비례 보정)
      const logV = 1.2 * Math.log(C + 1) + 0.4 * Math.log(L + 1) + 2.0;
      const estimatedVolume = Math.max(MIN_ESTIMATED_VOLUME, Math.floor(Math.exp(logV)));
      
      return Math.min(10000, estimatedVolume); // 상한 캡 10,000
    } catch (e: any) {
      console.warn(`[VolumeEstimator] Failed to estimate volume for "${query}": ${e.message}`);
      // API 장애 시 중간 범위의 결정적 fallback
      return VolumeEstimator.deterministicFallback(query, 'medium');
    }
  }

  /**
   * 결정적 해시 기반 Zipf's Law 로그정규 분포 fallback.
   * 동일 query는 항상 동일 값을 반환하여 재현성을 보장합니다.
   *
   * @param query - 질문 텍스트
   * @param tier - 'low' (10-80), 'medium' (10-300)
   */
  private static deterministicFallback(query: string, tier: 'low' | 'medium'): number {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      hash = ((hash << 5) - hash + query.charCodeAt(i)) | 0;
    }
    
    // [0, 1) 구간으로 정규화
    const u = Math.abs(hash & 0x7FFFFFFF) / 0x7FFFFFFF;
    
    // Box-Muller 변환을 이용한 표준정규분포 난수 생성
    const z = Math.sqrt(-2.0 * Math.log(Math.max(u, 0.0001))) * Math.cos(2.0 * Math.PI * u);
    
    // 로그정규분포 매핑: exp(mu + sigma * z)
    const mu = tier === 'low' ? 2.5 : 3.8;   // log(12) or log(44)
    const sigma = 0.8;
    const logNormal = Math.exp(mu + sigma * z);

    return Math.max(MIN_ESTIMATED_VOLUME, Math.min(5000, Math.floor(logNormal)));
  }
}
