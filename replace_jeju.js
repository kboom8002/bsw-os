const fs = require('fs');
const path = require('path');
const os = require('os');

const filePath = path.resolve('c:/Users/User/bsw/db/seed/industry-panels/questions-data.ts');
const text = fs.readFileSync(filePath, 'utf-8');
const lines = text.split(/\r?\n/);

const newQuestions = `
      // ───────────────────────────────────────────────
      // L1. Category Discovery (6Q) — 카테고리 노출 탐색
      // ───────────────────────────────────────────────
      { question_text: '제주 흑돼지 맛집 추천해줘', intent_context: 'category_discovery', target_keyword: '제주 흑돼지', risk_level: 'low', decision_stage: 'awareness', question_type: 'recommendation', weight: 1.0, query_variants: ['제주 흑돼지 어디', '제주도 고기집'], must_include: ['흑돼지'], should_include: ['추천', '맛집'], must_not_do: [], layer: 'L1_universal' },
      { question_text: '제주 애월 분위기 좋은 카페 어디야?', intent_context: 'category_discovery', target_keyword: '애월 카페', risk_level: 'low', decision_stage: 'awareness', question_type: 'recommendation', weight: 1.0, query_variants: ['애월 핫플 카페', '애월 예쁜 카페'], must_include: ['애월'], should_include: ['카페', '분위기'], must_not_do: [], layer: 'L1_universal' },
      { question_text: '제주 공항 근처 해장국집', intent_context: 'category_discovery', target_keyword: '제주 공항 해장국', risk_level: 'low', decision_stage: 'awareness', question_type: 'recommendation', weight: 1.0, query_variants: ['공항 근처 국밥', '제주 공항 아침식사'], must_include: ['공항'], should_include: ['해장국', '근처'], must_not_do: [], layer: 'L1_universal' },
      { question_text: '제주도 통갈치구이 잘하는 곳', intent_context: 'category_discovery', target_keyword: '제주 통갈치구이', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.0, query_variants: ['갈치구이 맛집', '제주 갈치조림 추천'], must_include: ['갈치'], should_include: ['갈치구이', '맛집'], must_not_do: [], layer: 'L1_universal' },
      { question_text: '제주 서쪽 해안도로 드라이브 코스 카페', intent_context: 'category_discovery', target_keyword: '제주 서쪽 카페', risk_level: 'low', decision_stage: 'awareness', question_type: 'recommendation', weight: 1.0, query_variants: ['한림 해안도로 카페', '서쪽 드라이브 카페'], must_include: ['서쪽'], should_include: ['해안도로', '카페'], must_not_do: [], layer: 'L1_universal' },
      { question_text: '제주도 고기국수 맛집', intent_context: 'category_discovery', target_keyword: '제주 고기국수', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.0, query_variants: ['고기국수 찐맛집', '제주도 국수'], must_include: ['고기국수'], should_include: ['맛집', '추천'], must_not_do: [], layer: 'L1_universal' },

      // ───────────────────────────────────────────────
      // L2. Context & Persona (6Q) — 상황/페르소나 맞춤 추천
      // ───────────────────────────────────────────────
      { question_text: '부모님 모시고 가기 좋은 조용한 제주 횟집 추천', intent_context: 'persona_match', target_keyword: '부모님 횟집', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.2, query_variants: ['가족 여행 횟집', '어른들 모시고 가기 좋은 곳'], must_include: ['조용한'], should_include: ['부모님', '가족', '횟집'], must_not_do: ['시끄러운 곳 추천'], layer: 'L2_competitive' },
      { question_text: '아이랑 가기 좋은 제주 서쪽 숙소', intent_context: 'persona_match', target_keyword: '제주 아이 숙소', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.2, query_variants: ['키즈 펜션 서쪽', '아이 동반 숙소'], must_include: ['아이'], should_include: ['서쪽', '가족', '숙소'], must_not_do: ['노키즈존 추천'], layer: 'L2_competitive' },
      { question_text: '혼자 뚜벅이 여행하는 사람을 위한 제주도 맛집', intent_context: 'persona_match', target_keyword: '혼밥 맛집', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.1, query_variants: ['제주 혼밥', '뚜벅이 혼밥 식당'], must_include: ['혼자'], should_include: ['뚜벅이', '혼밥', '접근성'], must_not_do: [], layer: 'L2_competitive' },
      { question_text: '비 오는 날 연인과 실내 데이트할 만한 카페', intent_context: 'persona_match', target_keyword: '비오는날 카페', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.1, query_variants: ['비오는 제주 실내', '실내 데이트 카페'], must_include: ['비'], should_include: ['실내', '데이트', '카페'], must_not_do: [], layer: 'L2_competitive' },
      { question_text: '반려견 동반 가능한 넓은 잔디밭 있는 식당', intent_context: 'persona_match', target_keyword: '애견동반 식당', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.1, query_variants: ['강아지 동반 식당', '제주 펫프렌들리'], must_include: ['반려견'], should_include: ['동반', '식당'], must_not_do: ['반려견 출입 금지 업소 추천'], layer: 'L2_competitive' },
      { question_text: '노트북 작업하기 좋은 제주 워케이션 카페', intent_context: 'persona_match', target_keyword: '제주 워케이션', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.0, query_variants: ['제주 노트북 카페', '콘센트 많은 카페'], must_include: ['작업'], should_include: ['노트북', '워케이션', '카페'], must_not_do: [], layer: 'L2_competitive' },

      // ───────────────────────────────────────────────
      // L3. Feature & Attribute (6Q) — 속성/기능 기반 롱테일 검색
      // ───────────────────────────────────────────────
      { question_text: '주차 편하고 바다 보이는 애월 대형 카페', intent_context: 'attribute_search', target_keyword: '주차장 애월 카페', risk_level: 'low', decision_stage: 'consideration', question_type: 'informational', weight: 1.1, query_variants: ['애월 주차가능 카페', '오션뷰 주차 카페'], must_include: ['주차'], should_include: ['바다', '대형', '애월'], must_not_do: ['주차장 없는 곳'], layer: 'L3_ingredient' },
      { question_text: '웨이팅 없고 구워주는 제주 흑돼지집', intent_context: 'attribute_search', target_keyword: '구워주는 고기집', risk_level: 'low', decision_stage: 'decision', question_type: 'informational', weight: 1.2, query_variants: ['직접 구워주는 흑돼지', '대기 없는 고기집'], must_include: ['구워주는'], should_include: ['웨이팅', '흑돼지'], must_not_do: ['직접 굽는 곳'], layer: 'L3_ingredient' },
      { question_text: '룸 있는 프라이빗한 제주 횟집', intent_context: 'attribute_search', target_keyword: '제주 룸 횟집', risk_level: 'low', decision_stage: 'consideration', question_type: 'informational', weight: 1.1, query_variants: ['개별룸 횟집', '프라이빗 식당'], must_include: ['룸'], should_include: ['프라이빗', '횟집'], must_not_do: [], layer: 'L3_ingredient' },
      { question_text: '야외 테라스에서 일몰 볼 수 있는 카페', intent_context: 'attribute_search', target_keyword: '일몰 테라스 카페', risk_level: 'low', decision_stage: 'consideration', question_type: 'informational', weight: 1.0, query_variants: ['선셋 카페', '야외 좌석 카페'], must_include: ['테라스'], should_include: ['일몰', '야외'], must_not_do: [], layer: 'L3_ingredient' },
      { question_text: '브런치 세트 메뉴 가성비 좋은 제주 카페', intent_context: 'attribute_search', target_keyword: '가성비 브런치', risk_level: 'low', decision_stage: 'decision', question_type: 'informational', weight: 1.1, query_variants: ['브런치 맛집 가성비', '세트메뉴 카페'], must_include: ['브런치'], should_include: ['가성비', '세트'], must_not_do: [], layer: 'L3_ingredient' },
      { question_text: '수영장 온수풀 나오는 독채 펜션', intent_context: 'attribute_search', target_keyword: '온수풀 독채', risk_level: 'low', decision_stage: 'consideration', question_type: 'informational', weight: 1.1, query_variants: ['온수 수영장 펜션', '독채 풀빌라 온수'], must_include: ['온수풀'], should_include: ['독채', '펜션'], must_not_do: ['수영장 없는 곳'], layer: 'L3_ingredient' },

      // ───────────────────────────────────────────────
      // L4. Competitive & Comparison (6Q) — 경쟁 및 비교 우위
      // ───────────────────────────────────────────────
      { question_text: '숙성도랑 곱들락 중에 아이랑 가기엔 어디가 더 편해?', intent_context: 'competitive_comparison', target_keyword: '숙성도 곱들락 비교', risk_level: 'low', decision_stage: 'decision', question_type: 'comparison', weight: 1.2, query_variants: ['숙성도 곱들락 아이동반', '곱들락 숙성도 차이'], must_include: ['비교'], should_include: ['숙성도', '곱들락', '아이'], must_not_do: ['일방적 비하'], layer: 'L4_journey' },
      { question_text: '우진해장국이랑 올래국수 차이점이 뭐야?', intent_context: 'competitive_comparison', target_keyword: '우진해장국 올래국수', risk_level: 'low', decision_stage: 'consideration', question_type: 'comparison', weight: 1.1, query_variants: ['우진해장국 올래국수 비교', '제주 공항 맛집 차이'], must_include: ['차이'], should_include: ['우진해장국', '올래국수'], must_not_do: [], layer: 'L4_journey' },
      { question_text: '몽상드애월 카페 vs 앤트러사이트 한림 분위기 비교해줘', intent_context: 'competitive_comparison', target_keyword: '몽상드애월 앤트러사이트', risk_level: 'low', decision_stage: 'consideration', question_type: 'comparison', weight: 1.0, query_variants: ['애월 카페 분위기 비교', '몽상 앤트러사이트 차이'], must_include: ['분위기'], should_include: ['몽상드애월', '앤트러사이트'], must_not_do: [], layer: 'L4_journey' },
      { question_text: '제주 호텔 뷔페 vs 로컬 해산물 식당 어디가 나을까?', intent_context: 'competitive_comparison', target_keyword: '호텔 로컬 비교', risk_level: 'low', decision_stage: 'consideration', question_type: 'comparison', weight: 1.0, query_variants: ['제주 뷔페 해산물', '호텔식사 로컬식당'], must_include: ['비교'], should_include: ['호텔', '해산물'], must_not_do: [], layer: 'L4_journey' },
      { question_text: '춘심이네 통갈치구이랑 일반 식당 갈치구이 차이', intent_context: 'competitive_comparison', target_keyword: '춘심이네 차이', risk_level: 'low', decision_stage: 'consideration', question_type: 'comparison', weight: 1.1, query_variants: ['춘심이네 갈치 장점', '통갈치 일반 비교'], must_include: ['춘심이네'], should_include: ['차이', '통갈치구이'], must_not_do: [], layer: 'L4_journey' },
      { question_text: '오아시스80이랑 레이지펌프 디저트 메뉴 어떻게 달라?', intent_context: 'competitive_comparison', target_keyword: '오아시스80 레이지펌프', risk_level: 'low', decision_stage: 'consideration', question_type: 'comparison', weight: 1.0, query_variants: ['애월 카페 디저트 비교', '오아시스80 메뉴 차이'], must_include: ['디저트'], should_include: ['오아시스80', '레이지펌프'], must_not_do: [], layer: 'L4_journey' },

      // ───────────────────────────────────────────────
      // L5. Reputation & Sentiment (6Q) — 평판 및 후기 검증
      // ───────────────────────────────────────────────
      { question_text: '요즘 인스타에서 뜨는 몽상드애월 진짜 후기 어때? 웨이팅 할 가치 있어?', intent_context: 'reputation_verification', target_keyword: '몽상드애월 후기', risk_level: 'medium', decision_stage: 'decision', question_type: 'trust_verification', weight: 1.2, query_variants: ['몽상드애월 찐후기', '몽상 카페 호불호'], must_include: ['후기'], should_include: ['몽상드애월', '웨이팅', '가치'], must_not_do: ['근거 없는 악플 동조'], layer: 'L5_ymyl' },
      { question_text: '우진해장국 호불호 많이 갈려?', intent_context: 'reputation_verification', target_keyword: '우진해장국 평판', risk_level: 'medium', decision_stage: 'consideration', question_type: 'trust_verification', weight: 1.2, query_variants: ['우진해장국 단점', '고사리육개장 맛 평가'], must_include: ['호불호'], should_include: ['우진해장국', '평가'], must_not_do: [], layer: 'L5_ymyl' },
      { question_text: '카페 공백 카카오맵 평점 낮던데 진짜 별로야?', intent_context: 'reputation_verification', target_keyword: '카페공백 평점', risk_level: 'medium', decision_stage: 'decision', question_type: 'trust_verification', weight: 1.3, query_variants: ['공백 카페 리뷰', '공백카페 단점'], must_include: ['평점'], should_include: ['공백', '리뷰'], must_not_do: ['무비판적 비난 수용'], layer: 'L5_ymyl' },
      { question_text: '돈사돈 본점 서비스 안 좋다는 리뷰 있던데 요즘은 어때?', intent_context: 'reputation_verification', target_keyword: '돈사돈 서비스', risk_level: 'medium', decision_stage: 'decision', question_type: 'trust_verification', weight: 1.3, query_variants: ['돈사돈 불친절', '돈사돈 직원'], must_include: ['서비스'], should_include: ['돈사돈', '리뷰'], must_not_do: ['거짓 사실 생성'], layer: 'L5_ymyl' },
      { question_text: '노형슈퍼마켙 입장료 돈 아깝다는 말 있던데 가볼만해?', intent_context: 'reputation_verification', target_keyword: '노형슈퍼마켙 가성비', risk_level: 'medium', decision_stage: 'consideration', question_type: 'trust_verification', weight: 1.2, query_variants: ['노형슈퍼마켙 실망', '노형슈퍼마켙 후기'], must_include: ['가볼만'], should_include: ['노형슈퍼마켙', '입장료', '후기'], must_not_do: [], layer: 'L5_ymyl' },
      { question_text: '수우동 웨이팅 취소되는 경우 잦아? 시스템 어때?', intent_context: 'reputation_verification', target_keyword: '수우동 웨이팅', risk_level: 'medium', decision_stage: 'decision', question_type: 'informational', weight: 1.1, query_variants: ['수우동 예약 불만', '수우동 대기 팁'], must_include: ['시스템'], should_include: ['수우동', '웨이팅'], must_not_do: [], layer: 'L5_ymyl' },

      // ───────────────────────────────────────────────
      // L6. Local Journey (6Q) — 동선/위치 기반 연계 추천
      // ───────────────────────────────────────────────
      { question_text: '성산일출봉 아침 일찍 보고 나서 바로 갈만한 근처 밥집', intent_context: 'local_journey', target_keyword: '성산 아침식사', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.1, query_variants: ['성산일출봉 아침 맛집', '일출봉 근처 조식'], must_include: ['아침'], should_include: ['성산일출봉', '근처', '밥집'], must_not_do: [], layer: 'L6_trend' },
      { question_text: '오설록 구경하고 차로 10분 거리 분위기 좋은 카페', intent_context: 'local_journey', target_keyword: '오설록 근처 카페', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.1, query_variants: ['오설록 주변 카페', '오설록 근처 핫플'], must_include: ['10분'], should_include: ['오설록', '근처', '카페'], must_not_do: ['먼 거리 추천'], layer: 'L6_trend' },
      { question_text: '공항 가기 전 마지막으로 들르기 좋은 제주시내 맛집', intent_context: 'local_journey', target_keyword: '공항 가기전 맛집', risk_level: 'low', decision_stage: 'decision', question_type: 'recommendation', weight: 1.0, query_variants: ['제주 출발 전 식사', '공항 주변 맛집'], must_include: ['마지막'], should_include: ['공항', '제주시내', '맛집'], must_not_do: [], layer: 'L6_trend' },
      { question_text: '더클리프에서 노을 보고 근처에서 저녁 먹을 곳', intent_context: 'local_journey', target_keyword: '더클리프 저녁', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.1, query_variants: ['중문 저녁 식사', '더클리프 주변 식당'], must_include: ['저녁'], should_include: ['더클리프', '근처', '식당'], must_not_do: [], layer: 'L6_trend' },
      { question_text: '한담 해안산책로 걷고 갈만한 애월 디저트 카페', intent_context: 'local_journey', target_keyword: '한담산책로 카페', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.0, query_variants: ['한담 해변 카페', '애월 산책 후 카페'], must_include: ['디저트'], should_include: ['한담', '산책로', '카페'], must_not_do: [], layer: 'L6_trend' },
      { question_text: '해녀의부엌에서 밥 먹고 주변에 산책할 만한 곳', intent_context: 'local_journey', target_keyword: '해녀의부엌 주변', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.0, query_variants: ['종달리 산책로', '해녀의부엌 근처 관광'], must_include: ['산책'], should_include: ['해녀의부엌', '주변'], must_not_do: [], layer: 'L6_trend' },

      // ───────────────────────────────────────────────
      // L7. Brand Verification (6Q) — 브랜드 직접 검증/정보 정확성
      // ───────────────────────────────────────────────
      { question_text: '오아시스80 시그니처 메뉴랑 가격 알려줘', intent_context: 'brand_direct', target_keyword: '오아시스80 메뉴', risk_level: 'low', decision_stage: 'decision', question_type: 'informational', weight: 1.2, query_variants: ['오아시스80 가격표', '오아시스80 카이막'], must_include: ['시그니처'], should_include: ['오아시스80', '메뉴', '가격'], must_not_do: ['허위 메뉴 생성'], layer: 'L7_brand' },
      { question_text: '춘심이네 본점 예약하는 꿀팁 있어?', intent_context: 'brand_direct', target_keyword: '춘심이네 예약', risk_level: 'low', decision_stage: 'decision', question_type: 'informational', weight: 1.1, query_variants: ['춘심이네 예약 방법', '춘심이네 웨이팅 팁'], must_include: ['꿀팁'], should_include: ['춘심이네', '본점', '예약'], must_not_do: [], layer: 'L7_brand' },
      { question_text: '카페 오른 주차장 넉넉해? 영업시간은?', intent_context: 'brand_direct', target_keyword: '카페오른 정보', risk_level: 'low', decision_stage: 'decision', question_type: 'informational', weight: 1.0, query_variants: ['카페오른 주차', '오른 영업시간'], must_include: ['영업시간'], should_include: ['오른', '주차장'], must_not_do: [], layer: 'L7_brand' },
      { question_text: '제주맥주 양조장 투어 프로그램 구성 어떻게 돼?', intent_context: 'brand_direct', target_keyword: '제주맥주 투어', risk_level: 'low', decision_stage: 'decision', question_type: 'informational', weight: 1.0, query_variants: ['제주맥주 체험', '제주맥주 견학 코스'], must_include: ['프로그램'], should_include: ['제주맥주', '양조장', '투어'], must_not_do: [], layer: 'L7_brand' },
      { question_text: '숙성도 본점이랑 중문점 메뉴 차이 있어?', intent_context: 'brand_direct', target_keyword: '숙성도 지점 차이', risk_level: 'low', decision_stage: 'decision', question_type: 'informational', weight: 1.1, query_variants: ['숙성도 중문 노형', '숙성도 지점별 고기'], must_include: ['차이'], should_include: ['숙성도', '본점', '중문점'], must_not_do: [], layer: 'L7_brand' },
      { question_text: '레이지펌프 옥상 포토존 안전해? 노키즈존이야?', intent_context: 'brand_direct', target_keyword: '레이지펌프 노키즈존', risk_level: 'medium', decision_stage: 'decision', question_type: 'informational', weight: 1.2, query_variants: ['레이지펌프 아이 동반', '레이지펌프 포토존 위험'], must_include: ['노키즈존'], should_include: ['레이지펌프', '안전'], must_not_do: ['거짓 안전 규정 안내'], layer: 'L7_brand' }
    ]
`;

let newLines = [];
let skip = false;
for (let i = 0; i < lines.length; i++) {
  if (i === 5146) {
    newLines.push(lines[i]);
    newLines.push(newQuestions);
    skip = true;
  } else if (i === 5269) {
    skip = false;
    newLines.push(lines[i]);
  } else if (!skip) {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync(filePath, newLines.join(os.EOL), 'utf-8');
console.log('Successfully updated questions-data.ts');
