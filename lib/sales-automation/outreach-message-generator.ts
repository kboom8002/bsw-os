/**
 * lib/sales-automation/outreach-message-generator.ts
 *
 * 매칭 갭과 업체 정보를 기반으로 맞춤형 영업 설득 메시지를 생성하는 생성기
 * v2: 지역 맥락 강화, 트렌딩 질문 실 데이터 반영, 업종별 메시지 개인화
 */

import { getAIProvider } from '../ai/ai-provider';
import type { BusinessAttributes, BusinessMatchResult } from './types';

/** 업종별 특화 메시지 맥락 */
const INDUSTRY_CONTEXT: Record<string, string> = {
  restaurant_cafe:
    '현지 주민과 여행객 모두가 "상황에 맞는 카페/식당"을 AI에게 물어보고 있습니다. 단순한 "제주 맛집"이 아니라, "비 오는 날 부모님과 갈 수 있는 주차 편한 한식당" 같은 정밀한 조건 검색이 폭발적으로 늘고 있습니다.',
  accommodation:
    '숙박 검색도 달라졌습니다. "제주 펜션" 대신 "장애인 화장실 있는 오션뷰 풀빌라", "공항 30분 이내 아기 침대 있는 게스트하우스" 같은 조건 중심 질문이 AI 플랫폼에서 급증하고 있습니다.',
  experience:
    '체험·레저 분야는 AI 검색 전환이 가장 빠른 카테고리입니다. "당일 예약 가능한 해녀 체험", "비 와도 가능한 실내 감귤 클래스" 등 실시간 조건 검색이 핵심입니다.',
  wellness_kbeauty:
    'K-뷰티/웰니스 서비스는 외국인 관광객의 AI 검색 비중이 가장 높습니다. "English-speaking aesthetician", "sensitive skin certified skincare" 같은 영문 조건 질문 커버리지가 경쟁 우위를 결정합니다.',
  tourism_activity:
    '관광 명소와 액티비티는 AI 추천이 구매 전환의 첫 관문이 됐습니다. 정형화된 정보 카드가 없으면 AI가 경쟁 업체를 먼저 추천하는 구조입니다.',
};

export class OutreachMessageGenerator {
  /**
   * AI를 활용해 갭 패턴과 매칭 스코어를 융합한 세일즈 제안 메시지를 한글로 빌드합니다.
   *
   * @param businessName  업체명
   * @param businessType  업종
   * @param attributes    시설 속성
   * @param matchResult   갭 매칭 결과
   * @param trendingQuestions 실 트렌딩 질문 시그널
   * @param regionName    지역명 (기본: 제주 애월읍)
   */
  public static async generate(
    businessName: string,
    businessType: string,
    attributes: BusinessAttributes,
    matchResult: BusinessMatchResult,
    trendingQuestions: any[],
    regionName = '제주 애월읍'
  ): Promise<string> {
    const ai = getAIProvider();

    // 상위 트렌딩 질문 최대 3개 추출 (실 시그널 우선)
    const topQuestions = trendingQuestions
      .slice(0, 3)
      .map((q) => q.query || q.question_text)
      .filter(Boolean);
    const targetQuestion = topQuestions[0] || '비 오는 날 갈 만한 카페';

    const industryCtx = INDUSTRY_CONTEXT[businessType] || INDUSTRY_CONTEXT.restaurant_cafe;

    // 갭 유형 → 인간적 언어 변환
    const gapDescriptions = matchResult.matched_gap_types.map((g) => {
      if (g.includes('weather.rain')) return '비 오는 날 방문 가능 여부 (주차+실내)';
      if (g.includes('companion.foreigner')) return '외국인 고객 응대 (영문 메뉴/영어 안내)';
      if (g.includes('companion.child')) return '아이 동반 가능 여부 (키즈 메뉴/하이체어)';
      if (g.includes('access.parking')) return '주차 편의성 (무료 주차/대형 주차장)';
      if (g.includes('companion.elderly')) return '어르신 동반 (경사로/엘리베이터)';
      return g.replace('missing_attractor.', '');
    });

    const prompt = `당신은 지역 소상공인 전문 B2B 제안서 작가입니다.
아래 정보를 바탕으로 ${businessName} 대표님께 드릴 고품질 영업 제안 메시지를 작성하세요.

## 지역 현황
- 지역: ${regionName}
- ${industryCtx}

## 업체 정보
- 상호명: ${businessName}
- 업종: ${businessType}
- 시설 조건: ${JSON.stringify(attributes)}

## AI 검색 갭 분석 (실 데이터)
- 지역 포털에서 급증 중인 조건 검색 질문:
${topQuestions.map((q, i) => `  ${i + 1}. "${q}"`).join('\n')}
- 위 질문들에 대한 답변 업체 부족률: 현재 커버리지 매우 낮음 (갭 존재)
- 해당 업체의 갭 매칭 항목: ${gapDescriptions.join(', ')}
- 매칭 스코어: ${matchResult.match_score}점/100점

## 제안 상품
- 상품명: ${matchResult.recommended_product}
- 티어: ${matchResult.recommended_tier?.toUpperCase() || 'PRO'}

## 작성 지침
1. "광고 구매하세요" 식의 영업 멘트로 시작하지 마세요.
2. 첫 문장은 반드시 실제 검색 질문 데이터를 인용하여 시작하세요.
   예: "최근 제주 애월 상권에서 '${targetQuestion}' 검색이 지난달 대비 급증하고 있습니다."
3. 해당 업체가 이미 조건을 갖추고 있다는 점을 강조 (업체 특성을 정확히 언급)
4. 상품 도입의 구체적 효과를 1-2문장으로 명확히 제시
5. 부드럽고 따뜻한 어조, 압박 없이, 다음 단계는 "무료 분석 리포트" 제안으로 마무리
6. 단락 구분 명확히, 총 4~5개 단락
7. JSON 형식으로 반환: { "outreach_message": "전체 메시지 텍스트" }`;

    try {
      const response = await ai.generateStructuredOutput<any>(
        `System:\n${prompt}\n\nUser:\n맞춤 제안 메시지를 작성해주세요.`,
        {
          type: 'object',
          properties: {
            outreach_message: { type: 'string' },
          },
          required: ['outreach_message'],
        },
        { temperature: 0.3 }
      );

      return response.outreach_message || this.generateFallback(businessName, targetQuestion, matchResult, regionName);
    } catch (err) {
      console.warn('[OutreachMessageGenerator] AI 생성 실패, fallback 사용:', err);
      return this.generateFallback(businessName, targetQuestion, matchResult, regionName);
    }
  }

  private static generateFallback(
    businessName: string,
    targetQuestion: string,
    matchResult: BusinessMatchResult,
    regionName: string
  ): string {
    return `안녕하세요, ${businessName} 대표님.

최근 ${regionName} 일대에서 "${targetQuestion}" 관련 AI 조건 검색이 눈에 띄게 급증하고 있습니다. 안타깝게도 이 조건을 충족하는 정량화된 정보를 갖춘 업체가 현재 매우 부족한 상황입니다.

저희 분석에 따르면 대표님의 매장은 해당 조건에 이미 부합하는 시설을 갖추고 계십니다. 이는 AI가 고객 질문에 가장 정확하게 응답할 수 있는 '완벽한 답변 후보'라는 의미입니다.

저희가 제공하는 [${matchResult.recommended_product}]를 도입하시면, 위 질문에 대응되는 상황형 AI 홈피 카드와 llm.txt 색인 텍스트가 자동 조립되어 AI 추천 엔진에 우선 매칭됩니다.

부담 없이 연락 주시면 무료 분석 리포트와 맞춤 미리보기를 먼저 보내드리겠습니다. 감사합니다.`;
  }
}
