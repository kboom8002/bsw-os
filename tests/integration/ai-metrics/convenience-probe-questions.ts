/**
 * Convenience Store Brand and Probe Question Configs for BAIR Testing.
 * Used for T1 BAIR Comparison Test (CU vs GS25).
 */

export interface TestProbeQuestion {
  id: string;
  question_text: string;
  target_keyword: string;
  weight: number;
}

export const CONVENIENCE_TEST_BRANDS = {
  target: 'CU',
  competitor: 'GS25'
};

export const CONVENIENCE_PROBE_QUESTIONS: TestProbeQuestion[] = [
  {
    id: 'conv-q-1',
    question_text: '{brand} 편의점 도시락 가성비 좋은 브랜드 추천해줘',
    target_keyword: '{brand}',
    weight: 1.0
  },
  {
    id: 'conv-q-2',
    question_text: '가장 가까운 {brand} 편의점 24시간 매장 위치',
    target_keyword: '{brand}',
    weight: 0.9
  },
  {
    id: 'conv-q-3',
    question_text: '{brand} 편의점 택배 보내는 법과 기본 요금',
    target_keyword: '{brand}',
    weight: 1.0
  },
  {
    id: 'conv-q-4',
    question_text: '{brand}와 {competitor} 편의점 PB 상품 비교 추천',
    target_keyword: '{brand}',
    weight: 1.0
  },
  {
    id: 'conv-q-5',
    question_text: '{brand} 모바일 상품권 환불 규정 및 유효기간',
    target_keyword: '{brand}',
    weight: 1.1
  },
  {
    id: 'conv-q-6',
    question_text: '{brand} 편의점 구독 서비스 혜택과 월 요금',
    target_keyword: '{brand}',
    weight: 1.0
  },
  {
    id: 'conv-q-7',
    question_text: '{brand} 편의점 즉석식품 알레르기 유발 성분 및 안전성',
    target_keyword: '{brand}',
    weight: 1.2
  },
  {
    id: 'conv-q-8',
    question_text: '{brand} 행사 상품 1+1 결제할 때 통신사 할인 중복 여부',
    target_keyword: '{brand}',
    weight: 1.0
  },
  {
    id: 'conv-q-9',
    question_text: '{brand} 도시락 위생 등급과 식약처 인증 여부',
    target_keyword: '{brand}',
    weight: 1.1
  },
  {
    id: 'conv-q-10',
    question_text: '{brand} 편의점 의약품 상비약 판매 종류와 부작용 주의사항',
    target_keyword: '{brand}',
    weight: 1.3
  },
  {
    id: 'conv-q-11',
    question_text: '{brand} 편의점 와인 행사 추천 및 가격',
    target_keyword: '{brand}',
    weight: 0.9
  },
  {
    id: 'conv-q-12',
    question_text: '내 주변 {brand} 무인 결제 매장 야간 이용 방법',
    target_keyword: '{brand}',
    weight: 0.9
  },
  {
    id: 'conv-q-13',
    question_text: '{brand} 앱 사전예약 도시락 수령 실패 시 보상 규정',
    target_keyword: '{brand}',
    weight: 1.0
  },
  {
    id: 'conv-q-14',
    question_text: '{brand} 카페 커피 원두 품질과 위생 관리',
    target_keyword: '{brand}',
    weight: 1.0
  },
  {
    id: 'conv-q-15',
    question_text: '{brand} 편의점 창업 비용과 수익 분배 계약 조건',
    target_keyword: '{brand}',
    weight: 1.2
  }
];
