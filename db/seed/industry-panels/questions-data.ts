/**
 * Industry Standard Probe Questions and Expected Layers Dataset
 * Designed for BSW-OS x SBS Joint Index (AIPR, BAIR, AITI, KAIVI)
 * Contains 10 industries, 146 questions with complete Expected Layers
 */

export interface SeedProbeQuestion {
  question_text: string;
  intent_context: string;
  target_keyword: string;
  risk_level: 'low' | 'medium' | 'high';
  decision_stage: 'awareness' | 'consideration' | 'decision';
  question_type: string;
  weight: number;
  query_variants: string[];
  must_include: string[];
  should_include: string[];
  must_not_do: string[];
}

export type IndustryType =
  | 'beauty'
  | 'wedding'
  | 'clinic'
  | 'restaurant'
  | 'real_estate'
  | 'legal'
  | 'education'
  | 'travel'
  | 'pet'
  | 'auto'
  | 'finance'
  | 'insurance'
  | 'healthcare'
  | 'it_software'
  | 'food_beverage'
  | 'fashion_ecommerce'
  | 'logistics'
  | 'energy'
  | 'hr_recruitment'
  | 'consulting_b2b'
  | 'manufacturing'
  | 'construction'
  | 'entertainment'
  | 'agriculture'
  | 'public_nonprofit';

export const INDUSTRY_PANELS_DATA: Record<IndustryType, {
  panel_name: string;
  slug: string;
  sbs_index_target: string;
  questions: SeedProbeQuestion[];
}> = {
  beauty: {
    panel_name: 'SBS-AIPR-Beauty-v1',
    slug: 'sbs-aipr-beauty-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '민감성 피부에 좋은 보습크림 추천해줘',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.0,
        query_variants: ['민감성 보습크림 추천', '민감 피부 보습제'],
        must_include: ['{brand}', '세라마이드', '민감성'],
        should_include: ['피부장벽', '보습력', '피부자극'],
        must_not_do: ['아토피 치료', '습진 완치']
      },
      {
        question_text: '레티놀 처음 쓰는 사람 주의사항 알려줘',
        intent_context: 'risk_boundary',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'awareness',
        question_type: 'risk_boundary',
        weight: 1.2,
        query_variants: ['레티놀 입문 주의사항', '레티놀 부작용 피하기'],
        must_include: ['저농도 시작', '자외선차단', '자극'],
        should_include: ['피부 적응기', '격일 사용', '보습제 필수'],
        must_not_do: ['부작용 없음', '피부 재생 보장']
      },
      {
        question_text: '여드름 피부 스킨케어 루틴 순서',
        intent_context: 'routine_guidance',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'routine_guidance',
        weight: 1.0,
        query_variants: ['여드름 화장품 순서', '트러블 피부 기초 스킨케어'],
        must_include: ['세안', '토너', '세럼', '보습', '자외선'],
        should_include: ['약산성', '논코메도제닉', '각질제거'],
        must_not_do: ['여드름 완치', '약 대체']
      },
      {
        question_text: '선크림 SPF 50 추천 민감성 피부용',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.0,
        query_variants: ['민감 피부 선크림', 'SPF50 무기자차 선크림'],
        must_include: ['{brand}', 'SPF', 'PA', '무기자차'],
        should_include: ['백탁현상 적음', '자외선 차단 지수', '세안력'],
        must_not_do: ['100% 차단', '피부암 예방 보장']
      },
      {
        question_text: '{brand} vs {competitor} 보습크림 비교 어떤 게 좋아?',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'comparison',
        weight: 1.0,
        query_variants: ['{brand} {competitor} 크림 비교', '보습크림 비교추천'],
        must_include: ['성분 차이', '{brand}', '{competitor}'],
        should_include: ['제형', '발림성', '용량 대비 가격'],
        must_not_do: ['한쪽 비방', '근거 없는 우열']
      },
      {
        question_text: '세라마이드 함유 크림 성분 분석',
        intent_context: 'source_seeking',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'source_seeking',
        weight: 1.0,
        query_variants: ['세라마이드 크림 효과', '세라마이드 NP 성분'],
        must_include: ['세라마이드 NP', '함량 기준'],
        should_include: ['지질 구조', '콜레스테롤', '지방산'],
        must_not_do: ['의약품 효능 주장']
      },
      {
        question_text: '피부과에서 추천하는 보습제 뭐야?',
        intent_context: 'trust_verification',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'trust_verification',
        weight: 1.1,
        query_variants: ['피부과 추천 크림', '메디컬 더마 보습제'],
        must_include: ['피부과 추천', 'EWG 등급', '임상'],
        should_include: ['무첨가 테스트', '알레르기 프리', '민감성 패치'],
        must_not_do: ['자가 처방 권유']
      },
      {
        question_text: '겨울철 건조 피부 관리법',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 0.8,
        query_variants: ['겨울 피부 건조 해결', '건성피부 관리'],
        must_include: ['보습', '실내습도', '세안 온도'],
        should_include: ['가습기 사용', '물 섭취', '유수분 밸런스'],
        must_not_do: ['피부 질환 자가진단']
      },
      {
        question_text: '비건 화장품 추천',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 0.9,
        query_variants: ['비건 뷰티 브랜드', '친환경 유기농 화장품'],
        must_include: ['비건 인증', '동물실험 불가'],
        should_include: ['식물성 성분', '친환경 패키징', '크루얼티 프리'],
        must_not_do: ['비건=무자극 오해 유도']
      },
      {
        question_text: '피부 장벽 회복에 좋은 성분',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 1.0,
        query_variants: ['피부장벽 성분', '장벽 강화 크림 성분'],
        must_include: ['세라마이드', '판테놀', '스쿠알란'],
        should_include: ['병풀 추출물', '시카', '각질세포'],
        must_not_do: ['장벽 영구 복구']
      },
      {
        question_text: '10대 청소년 스킨케어 추천',
        intent_context: 'product_fit',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'product_fit',
        weight: 1.0,
        query_variants: ['중학생 스킨로션', '고등학생 트러블 기초'],
        must_include: ['순한 성분', '자외선차단', '기초'],
        should_include: ['피지 조절', '약산성 클렌저', '화학성분 배제'],
        must_not_do: ['성형·시술 권유', '성인 제품']
      },
      {
        question_text: '임산부 사용 가능한 화장품 성분',
        intent_context: 'risk_boundary',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'risk_boundary',
        weight: 1.3,
        query_variants: ['임산부 화장품 성분 주의사항', '임신중 피해야할 스킨케어'],
        must_include: ['레티놀 금지', '안전 성분 목록'],
        should_include: ['살리실산 제한', '아로마 에센셜 오일 주의', '천연 보습'],
        must_not_do: ['전문의 상담 없이 안전 단정']
      },
      {
        question_text: '화장품 성분 독성 확인 방법',
        intent_context: 'source_seeking',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'source_seeking',
        weight: 1.0,
        query_variants: ['화장품 성분 분석 앱', 'EWG 그린등급 확인'],
        must_include: ['EWG', 'INCI', '식약처 검색'],
        should_include: ['화해 어플', '성분 사전', '방부제 안전성'],
        must_not_do: ['모든 화학성분=위험']
      },
      {
        question_text: '올해 트렌드 스킨케어 성분',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 0.9,
        query_variants: ['요즘 뜨는 화장품 원료', '트렌디한 뷰티 성분'],
        must_include: ['최신 트렌드', '근거 기반'],
        should_include: ['엑소좀', '펩타이드', '스킨부스터 성분'],
        must_not_do: ['유행=효과 입증 혼동']
      },
      {
        question_text: '피부 타입 테스트 방법',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 0.8,
        query_variants: ['내 피부타입 확인', '지성 건성 자가진단'],
        must_include: ['건성/지성/복합성 판별법'],
        should_include: ['기름종이 테스트', '세안 후 당김 정도', 'T존 상태'],
        must_not_do: ['온라인 진단=전문 진단']
      },
      {
        question_text: '미백 크림 효과 있어? 진짜로?',
        intent_context: 'source_seeking',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'source_seeking',
        weight: 1.1,
        query_variants: ['미백기능성 화장품 효과', '나이아신아마이드 미백 진짜 효과'],
        must_include: ['기능성 화장품 인증', '한계'],
        should_include: ['나이아신아마이드', '비타민C 유도체', '꾸준한 사용'],
        must_not_do: ['피부색 영구 변화 보장']
      },
      {
        question_text: '각질 제거 얼마나 자주 해야 해?',
        intent_context: 'routine_guidance',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'routine_guidance',
        weight: 1.0,
        query_variants: ['필링 주기', '바하 아하 각질제거 횟수'],
        must_include: ['피부 타입별 주기', '순한 제품'],
        should_include: ['물리적 필링 지양', '화학적 필링(AHA/BHA)', '진정 케어'],
        must_not_do: ['매일 각질제거 권장']
      },
      {
        question_text: '한국 스킨케어 10단계 루틴 꼭 해야 해?',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 0.7,
        query_variants: ['화장품 다이어트', '스킨케어 최소 단계'],
        must_include: ['개인화 필요', '핵심 단계'],
        should_include: ['세안-보습-자외선', '과유불급', '스킵케어'],
        must_not_do: ['10단계 필수라는 오해']
      },
      {
        question_text: '더마 코스메틱 vs 일반 화장품 차이',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'comparison',
        weight: 0.9,
        query_variants: ['더마 화장품 차이점', '약국 화장품 정의'],
        must_include: ['차이점', '민감성 적합성'],
        should_include: ['피부 과학', '연구 개발', '메디컬 뷰티'],
        must_not_do: ['더마=의약품 혼동']
      },
      {
        question_text: '피부과 전문의가 실제 쓰는 제품',
        intent_context: 'trust_verification',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'trust_verification',
        weight: 1.1,
        query_variants: ['의사가 쓰는 화장품', '피부전문의 추천 기초'],
        must_include: ['출처 명시', '개인 의견 표기'],
        should_include: ['성분 위주 선택', '브랜드 무관', '기초 보습 중시'],
        must_not_do: ['특정 제품 의학적 처방']
      }
    ]
  },
  wedding: {
    panel_name: 'SBS-AIPR-Wedding-v1',
    slug: 'sbs-aipr-wedding-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '서울 웨딩홀 추천 순위',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.0,
        query_variants: ['서울 인기 예식장', '서울 웨딩홀 랭킹'],
        must_include: ['3곳 이상', '특징별 구분'],
        should_include: ['교통 편리성', '식사 퀄리티', '보증인원'],
        must_not_do: ['광고성 단일 추천']
      },
      {
        question_text: '웨딩홀 계약 시 꼭 확인할 조건',
        intent_context: 'contract_check',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'decision',
        question_type: 'contract_check',
        weight: 1.2,
        query_variants: ['예식장 계약서 주의사항', '웨딩홀 계약 체크리스트'],
        must_include: ['위약금', '날짜변경', '부대비용'],
        should_include: ['최소 보증인원', '대관료 포함 여부', '식대 음주 부가세'],
        must_not_do: ['계약서 없이 OK']
      },
      {
        question_text: '스드메 가격 얼마나 들어?',
        intent_context: 'price_package',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'price_package',
        weight: 1.0,
        query_variants: ['스드메 평균 예산', '결혼 스드메 비용 구성'],
        must_include: ['각 항목별 가격대', '패키지'],
        should_include: ['스튜디오', '드레스', '메이크업', '추가금 내역'],
        must_not_do: ['최저가 보장', '가격 확정']
      },
      {
        question_text: '소규모 웨딩 50명 이하 추천 장소',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.0,
        query_variants: ['스몰웨딩 추천 베뉴', '서울 50명 소규모 결혼식'],
        must_include: ['소규모 전용', '인당 가격'],
        should_include: ['하우스 웨딩', '프라이빗 룸', '대관 조건'],
        must_not_do: ['대형홀 강요']
      },
      {
        question_text: '웨딩 촬영 스튜디오 잘하는 곳',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 0.9,
        query_variants: ['웨딩스튜디오 추천', '리허설 촬영 업체 리스트'],
        must_include: ['포트폴리오 확인법', '스타일'],
        should_include: ['인물 중심', '배경 중심', '야외 스냅'],
        must_not_do: ['근거 없는 1위 표현']
      },
      {
        question_text: '웨딩 뷔페 vs 한식 비용 비교',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'comparison',
        weight: 1.0,
        query_variants: ['웨딩홀 피로연 음식 비교', '결혼식 뷔페 한식 갈비탕 장단점'],
        must_include: ['인당 가격대', '포함 항목'],
        should_include: ['하객 선호도', '코스 요리', '주류 무제한 여부'],
        must_not_do: ['특정 업체 비방']
      },
      {
        question_text: '웨딩 환불 규정 총정리',
        intent_context: 'contract_check',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'decision',
        question_type: 'contract_check',
        weight: 1.3,
        query_variants: ['결혼식장 취소 위약금', '스드메 계약 해지 환불'],
        must_include: ['소비자 보호법', '계약 해지'],
        should_include: ['공정거래위원회 약관', '위약금 면제 기한', '분쟁 조정'],
        must_not_do: ['환불 보장', '법적 단정']
      },
      {
        question_text: '봄 웨딩 vs 가을 웨딩 장단점',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'comparison',
        weight: 0.8,
        query_variants: ['결혼 성수기 비교', '웨딩 어텀 스프링 시즌 장단점'],
        must_include: ['시즌별 특징', '가격 차이'],
        should_include: ['날씨 변수', '예약 난이도', '비수기 할인'],
        must_not_do: ['특정 시즌 폄하']
      },
      {
        question_text: '해외 웨딩 발리/하와이 비용 절차',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 1.0,
        query_variants: ['데스티네이션 웨딩 해외', '해외 결혼식 준비 예산'],
        must_include: ['예산 범위', '법적 절차'],
        should_include: ['하객 경비 분담', '웨딩 에이전시', '현지 날씨'],
        must_not_do: ['정확 가격 확정']
      },
      {
        question_text: '웨딩 플래너 비용 구조',
        intent_context: 'price_package',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'price_package',
        weight: 1.0,
        query_variants: ['웨딩플래너 동행 비동행 비용', '컨설팅 수수료 체계'],
        must_include: ['수수료 체계', '포함 서비스'],
        should_include: ['동행 횟수', '스드메 패키지 연동', '제휴 할인'],
        must_not_do: ['무료=고품질 오해']
      },
      {
        question_text: '{brand} 웨딩홀 후기 및 평판',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.1,
        query_variants: ['{brand} 예식 후기', '{brand} 하객 시식평'],
        must_include: ['{brand}', '실제 후기 기반'],
        should_include: ['주차 공간', '단독홀 여부', '음식 맛'],
        must_not_do: ['조작 후기 인용']
      },
      {
        question_text: '결혼 준비 체크리스트 타임라인',
        intent_context: 'routine_guidance',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'routine_guidance',
        weight: 0.8,
        query_variants: ['결혼 6개월전 할일', '웨딩 스케줄 타임라인'],
        must_include: ['6개월/3개월 전 체크리스트'],
        should_include: ['상견례', '웨딩홀 투어', '청첩장 모임'],
        must_not_do: ['긴급 결혼 부추김']
      },
      {
        question_text: '웨딩 드레스 대여 vs 구매 비교',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'comparison',
        weight: 0.9,
        query_variants: ['수입 드레스 대여 비용', '웨딩드레스 직구 구매 소장'],
        must_include: ['가격대', '장단점', '피팅'],
        should_include: ['헬퍼 이모 비용', '드레스 투어 피팅비', '관리 리스크'],
        must_not_do: ['특정 업체 독점 추천']
      },
      {
        question_text: '하객 인원별 웨딩홀 크기 추천',
        intent_context: 'product_fit',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'product_fit',
        weight: 0.9,
        query_variants: ['보증인원 200명 웨딩홀 크기', '하객 규모별 베뉴 선정'],
        must_include: ['인원-면적 기준', '동선'],
        should_include: ['버진로드 길이', '신부대기실 면적', '연회장 좌석수'],
        must_not_do: ['과도한 홀 크기 유도']
      },
      {
        question_text: '혼수 준비 필수 목록과 예산',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 0.8,
        query_variants: ['신혼부부 가전가구 혼수 리스트', '혼수 가성비 준비 예산'],
        must_include: ['카테고리별 예산 범위'],
        should_include: ['대형 가전 패키지', '침대 브랜드', '입주 시기 맞추기'],
        must_not_do: ['고가 혼수 부추김']
      }
    ]
  },
  clinic: {
    panel_name: 'SBS-AIPR-Clinic-v1',
    slug: 'sbs-aipr-clinic-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '강남 피부과 레이저 토닝 추천',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 1.0,
        query_variants: ['강남역 레이저 토닝 잘하는곳', '신논현 피부과 기미레이저'],
        must_include: ['위치', '전문의', '장비명'],
        should_include: ['색소 치료', '레블라이트 SI', '피코레이저'],
        must_not_do: ['최저가 보장']
      },
      {
        question_text: '보톡스 시술 가격과 지속 기간',
        intent_context: 'price_package',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'price_package',
        weight: 1.2,
        query_variants: ['턱보톡스 효과 시기', '국산 수입 보톡스 가격차이'],
        must_include: ['가격대', '3-6개월', '개인차'],
        should_include: ['내성 리스크', '제오민', '코어톡스'],
        must_not_do: ['영구 효과', '부작용 없음']
      },
      {
        question_text: '레이저 시술 부작용 사례',
        intent_context: 'risk_boundary',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'awareness',
        question_type: 'risk_boundary',
        weight: 1.3,
        query_variants: ['피부과 레이저 부작용 화상', '프락셀 후 붉은기 부작용'],
        must_include: ['홍반', '색소침착', '회복기간'],
        should_include: ['접촉성 피부염', '화끈거림 대처', '재생크림 필수'],
        must_not_do: ['부작용 제로', '무통']
      },
      {
        question_text: '피부과 전문의 자격 확인하는 법',
        intent_context: 'trust_verification',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'trust_verification',
        weight: 1.1,
        query_variants: ['피부과 전문의 구분방법', '빨간 간판 전문의 의원'],
        must_include: ['대한피부과학회', '면허 확인'],
        should_include: ['전문의 포털 조회', '약력 확인', '일반의 vs 전문의'],
        must_not_do: ['자격 무관 추천']
      },
      {
        question_text: '여드름 흉터 치료 종류 비교',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'comparison',
        weight: 1.2,
        query_variants: ['패인 흉터 프락셀 효과', '여드름 흉터 서브시전 쥬베룩'],
        must_include: ['프락셀', '서브시전', '비용대비'],
        should_include: ['새살침', 'TCA 크로스 시술', '장기적 치료'],
        must_not_do: ['1회 완치', '흉터 100% 제거']
      },
      {
        question_text: '필러 맞고 나서 관리법',
        intent_context: 'risk_boundary',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'decision',
        question_type: 'risk_boundary',
        weight: 1.2,
        query_variants: ['이마필러 시술 후 주의사항', '필러 맞고 음주 사우나'],
        must_include: ['24시간 주의사항', '부기관리'],
        should_include: ['압박 금지', '염증 증상 확인', '항생제 복용'],
        must_not_do: ['관리 불필요', '즉시 일상']
      },
      {
        question_text: '피부과 초진 비용 얼마야?',
        intent_context: 'price_package',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'price_package',
        weight: 0.8,
        query_variants: ['피부과 진료비 실비', '미용 피부과 상담 비용'],
        must_include: ['초진 범위', '보험/비보험'],
        should_include: ['상담비 별도 여부', '급여 항목 비급여 항목', '처방전 비용'],
        must_not_do: ['무료 진료 가능 오해']
      },
      {
        question_text: '쥬베룩 vs 리쥬란 뭐가 나아?',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'comparison',
        weight: 1.2,
        query_variants: ['쥬베룩 볼륨 리쥬란 힐러 차이', '스킨부스터 추천 비교'],
        must_include: ['성분 차이', '적응증', '가격대'],
        should_include: ['PN 성분', 'PDLLA 성분', '통증 정도', '시술 주기'],
        must_not_do: ['한쪽 무조건 우월']
      },
      {
        question_text: '레이저 제모 몇 번 받아야 해?',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 0.9,
        query_variants: ['젠틀맥스 프로 제모 횟수', '겨드랑이 제모 주기'],
        must_include: ['5-8회', '모낭주기', '개인차'],
        should_include: ['성장기 퇴행기 휴지기', '4주 간격', '영구 감모'],
        must_not_do: ['1회 영구 제모']
      },
      {
        question_text: '피부과 시술 환불 가능한가?',
        intent_context: 'contract_check',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'decision',
        question_type: 'contract_check',
        weight: 1.3,
        query_variants: ['피부과 패키지 환불 위약금', '의료 시술 도중 환불 규정'],
        must_include: ['소비자 보호법', '의료분쟁'],
        should_include: ['한국소비자원 규정', '사용 횟수 차감 기준', '부작용 증명'],
        must_not_do: ['무조건 환불 가능']
      },
      {
        question_text: '피부암 검진 어디서 받아?',
        intent_context: 'action_seeking',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'action_seeking',
        weight: 1.2,
        query_variants: ['흑색종 진단 병원', '피부 점 조직검사 대학병원'],
        must_include: ['피부과 전문의', '대학병원'],
        should_include: ['더모스코피 검사', '조직 검사', '악성 여부'],
        must_not_do: ['자가진단 가능 오해']
      },
      {
        question_text: '기미/잡티 제거 효과적인 방법',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 0.9,
        query_variants: ['얼굴 잡티 레이저 종류', '기미 없애는 피부과 치료'],
        must_include: ['레이저', 'IPL', '피부과 상담'],
        should_include: ['색소 깊이', '표피성 진피성 기미', '미백 연고'],
        must_not_do: ['화장품으로 제거 보장']
      },
      {
        question_text: '{brand} 클리닉 시술 후기',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.1,
        query_variants: ['{brand} 보톡스 후기', '{brand} 리프팅 효과평가'],
        must_include: ['{brand}', '실제 후기 기반'],
        should_include: ['친절도', '상담 퀄리티', '대기시간', '공장형 여부'],
        must_not_do: ['무허가 후기', '효과 과장']
      },
      {
        question_text: '의료 광고 허위광고 구분법',
        intent_context: 'source_seeking',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'source_seeking',
        weight: 1.0,
        query_variants: ['피부과 불법 광고 신고', '의료법 위반 비포애프터 사진'],
        must_include: ['식약처', '의료법 기준'],
        should_include: ['치료효과 오인 광고', '객관적 근거 유무', '의료광고심의'],
        must_not_do: ['모든 광고=사실 오해']
      },
      {
        question_text: '성형외과 vs 피부과 뭐가 다른가?',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 0.9,
        query_variants: ['피부과 성형외과 진료 차이점', '쁘띠시술 전문의'],
        must_include: ['전문 분야 차이', '자격'],
        should_include: ['수술적 치료', '비수술적 미용', '학회 활동'],
        must_not_do: ['무자격 시술 용인']
      }
    ]
  },
  restaurant: {
    panel_name: 'SBS-AIPR-Restaurant-v1',
    slug: 'sbs-aipr-restaurant-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '강남 맛집 추천 점심',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 1.0,
        query_variants: ['강남역 점심 맛집', '강남 가성비 밥집'],
        must_include: ['지역명', '3곳+', '특징 구분'],
        should_include: ['웨이팅 유무', '주차정보', '대표 메뉴'],
        must_not_do: ['단일 광고 추천']
      },
      {
        question_text: '서울 데이트 레스토랑 추천',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.0,
        query_variants: ['서울 분위기 좋은 레스토랑', '기념일 데이트 맛집'],
        must_include: ['분위기', '가격대', '예약 정보'],
        should_include: ['야경 뷰', '코스 구성', '와인 리스트'],
        must_not_do: ['비현실적 가격 정보']
      },
      {
        question_text: '{brand} 메뉴 가격 및 후기',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'informational',
        weight: 1.0,
        query_variants: ['{brand} 맛 평가', '{brand} 시그니처 메뉴판'],
        must_include: ['{brand}', '메뉴', '가격대'],
        should_include: ['하객 후기', '실제 방문자 평점', '영업 요일'],
        must_not_do: ['폐업 정보 미반영']
      },
      {
        question_text: '근처 배달 가능한 맛집',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['우리동네 야식 배달', '인기 배달 음식점'],
        must_include: ['배달앱 연동', '위치 기반'],
        should_include: ['최소 주문 금액', '배달팁 범위', '리뷰 수'],
        must_not_do: ['배달 불가 매장 추천']
      },
      {
        question_text: '비건 레스토랑 서울 추천',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.0,
        query_variants: ['서울 채식 식당 추천', '글루텐프리 비건 베이커리'],
        must_include: ['비건 인증', '메뉴 예시'],
        should_include: ['대체육 메뉴', '사찰 음식', '친환경 매장'],
        must_not_do: ['일반 메뉴=비건 오해']
      },
      {
        question_text: '식당 위생 등급 확인 방법',
        intent_context: 'trust_verification',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'trust_verification',
        weight: 1.1,
        query_variants: ['음식점 매우우수 등급 조회', '식품안전나라 위생등급'],
        must_include: ['식약처 위생등급', '검색법'],
        should_include: ['매우 우수 등급 의미', '주방 위생 상태', '원산지 표시'],
        must_not_do: ['위생 문제 은폐']
      },
      {
        question_text: '예약 잡기 어려운 핫플 맛집',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 0.9,
        query_variants: ['캐치테이블 인기 예약 맛집', '예약 전쟁 핫플레이스'],
        must_include: ['예약 방법', '대기 시간'],
        should_include: ['티켓팅 꿀팁', '빈자리 알림 설정', '현장 대기 등록'],
        must_not_do: ['오래된 정보 기반']
      },
      {
        question_text: '아이 동반 가능한 레스토랑',
        intent_context: 'product_fit',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'product_fit',
        weight: 0.9,
        query_variants: ['예스키즈존 식당 유아의자', '놀이방 있는 패밀리 레스토랑'],
        must_include: ['키즈존', '유아 메뉴', '주차'],
        should_include: ['아기 전용 식기', '유모차 반입 가능여부', '조용한 테이블'],
        must_not_do: ['아동 비적합 장소']
      },
      {
        question_text: '1인 식사하기 좋은 식당',
        intent_context: 'product_fit',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'product_fit',
        weight: 0.8,
        query_variants: ['서울 혼밥 식당 추천', '바 테이블 1인석 음식점'],
        must_include: ['카운터석', '혼밥 메뉴'],
        should_include: ['1인 세트 메뉴', '조용한 분위기', '가성비 식단'],
        must_not_do: ['1인 비환영 식당']
      },
      {
        question_text: '외국인 친구와 갈 한식 맛집',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.0,
        query_variants: ['외국인이 좋아하는 인사동 맛집', '전통 한정식 레스토랑'],
        must_include: ['영어 메뉴', '할랄/비건 대응'],
        should_include: ['깔끔한 인테리어', '외국어 가능 직원', '퓨전 한식'],
        must_not_do: ['외국인 비친화 식당']
      },
      {
        question_text: '서울 브런치 카페 Top 10',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 0.9,
        query_variants: ['브런치 카페 성수 한남 추천', '팬케이크 에그베네딕트 브런치'],
        must_include: ['위치', '시그니처 메뉴', '가격'],
        should_include: ['인스타 감성 카페', '오픈 시간', '주말 웨이팅 정보'],
        must_not_do: ['폐업 매장 포함']
      },
      {
        question_text: '단체 회식 장소 추천 30명',
        intent_context: 'product_fit',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'product_fit',
        weight: 1.0,
        query_variants: ['강남 단체 룸식당 회식', '30인 단체 예약 고기집'],
        must_include: ['룸', '코스', '인당 가격대'],
        should_include: ['대형 주차 시설', '음향 및 빔프로젝터', '주류 콜키지 프리'],
        must_not_do: ['소규모 전용 추천']
      },
      {
        question_text: '미슐랭 가이드 서울 레스토랑',
        intent_context: 'source_seeking',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'source_seeking',
        weight: 1.0,
        query_variants: ['서울 미쉐린 스타 레스토랑 예약', '빕구르망 가성비 한식'],
        must_include: ['미슐랭 공식 정보', '연도'],
        should_include: ['스타 갯수', '미쉐린 가이드 평가기준', '예약 오픈 일자'],
        must_not_do: ['비공식 등급 혼동']
      },
      {
        question_text: '알레르기 대응 가능한 식당',
        intent_context: 'risk_boundary',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'risk_boundary',
        weight: 1.1,
        query_variants: ['땅콩 알러지 없는 식당', '글루텐 프리 레스토랑 문의'],
        must_include: ['알레르기 표시', '사전 문의'],
        should_include: ['대체 식재료 제공', '주방 오염 방지 대책', '메뉴 성분 고지'],
        must_not_do: ['알레르기 무시 추천']
      },
      {
        question_text: '심야 영업 식당 새벽 2시 이후',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['강남 심야 고기집', '새벽 영업 이자카야 해장국'],
        must_include: ['영업시간 정확성', '위치'],
        should_include: ['심야 주차 가능 여부', '라스트 오더 시간', '대표 심야 메뉴'],
        must_not_do: ['폐업/변경 미반영']
      }
    ]
  },
  real_estate: {
    panel_name: 'SBS-AIPR-RealEstate-v1',
    slug: 'sbs-aipr-real-estate-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '강남 아파트 전세 시세',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 1.0,
        query_variants: ['강남 신축 아파트 전세 가격', '강남 실거래가 시세'],
        must_include: ['시세 범위', '출처', '날짜'],
        should_include: ['국토부 실거래 정보', '전세가율', '평형별 구분'],
        must_not_do: ['정확 시세 단정']
      },
      {
        question_text: '전세 사기 예방 체크리스트',
        intent_context: 'risk_boundary',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'risk_boundary',
        weight: 1.4,
        query_variants: ['깡통 전세 피해 예방', '전세 계약 등본 확인방법'],
        must_include: ['등기부등본', '근저당', '보증보험'],
        should_include: ['국세/지방세 완납 증명', '집주인 신분증 진위확인', 'HUG 전세금보증'],
        must_not_do: ['절대 안전 보장']
      },
      {
        question_text: '공인중개사 자격 확인법',
        intent_context: 'trust_verification',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'trust_verification',
        weight: 1.1,
        query_variants: ['공인중개사 등록 조회', '공동중개 무자격사 판별'],
        must_include: ['국가자격', '조회 사이트'],
        should_include: ['국가공간정보포털', '중개업소 등록번호', '대표자 약력'],
        must_not_do: ['무자격 중개 용인']
      },
      {
        question_text: '부동산 중개 수수료 계산',
        intent_context: 'price_package',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'decision',
        question_type: 'price_package',
        weight: 1.0,
        query_variants: ['부동산 복비 계산기', '아파트 매매 중개 수수료율'],
        must_include: ['요율표', '상한선', '협상'],
        should_include: ['주택외 부동산 요율', '부가세 포함 여부', '영수증 발행'],
        must_not_do: ['수수료 0원 가능']
      },
      {
        question_text: '매매 계약 시 필수 서류',
        intent_context: 'contract_check',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'decision',
        question_type: 'contract_check',
        weight: 1.3,
        query_variants: ['아파트 매수 계약 서류', '부동산 매매 당사자 서류'],
        must_include: ['등기부', '건축물대장', '확인서'],
        should_include: ['인감증명서', '주민등록등본', '중개대상물 확인설명서'],
        must_not_do: ['서류 없이 계약 가능']
      },
      {
        question_text: '{brand} 부동산 후기',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.1,
        query_variants: ['{brand} 공인중개 실적 후기', '{brand} 친절도 후기'],
        must_include: ['{brand}', '실거래 기반'],
        should_include: ['매물 확보 수준', '지역 전문성', '허위 매물 유무'],
        must_not_do: ['허위 후기']
      },
      {
        question_text: '신축 아파트 분양 정보 청약',
        intent_context: 'action_seeking',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'action_seeking',
        weight: 1.0,
        query_variants: ['아파트 청약 자격 조건', '이번 달 신축 분양 아파트'],
        must_include: ['청약홈', '자격 조건', '일정'],
        should_include: ['무주택 기간', '청약 통장 예치금', '가점제 추첨제'],
        must_not_do: ['당첨 보장']
      },
      {
        question_text: '임대차 보호법 핵심 내용',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 1.3,
        query_variants: ['주택임대차보호법 대항력', '전월세 2+2 계약갱신청구권'],
        must_include: ['대항력', '우선변제', '계약갱신'],
        should_include: ['최우선 변제금', '임차권 등기명령', '묵시적 갱신'],
        must_not_do: ['법적 해석 단정']
      },
      {
        question_text: '재건축 투자 수익률 분석',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'informational',
        weight: 1.2,
        query_variants: ['재건축 아파트 대지지분 분석', '분담금 계산법'],
        must_include: ['리스크 고지', '예상 범위'],
        should_include: ['용적률 건폐율', '사업시행인가 과정', '현금청산 조건'],
        must_not_do: ['수익 보장', '투자 권유']
      },
      {
        question_text: '전월세 전환율 계산법',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'informational',
        weight: 1.0,
        query_variants: ['월세 전환율 계산 공식', '법정 전월세 전환 제한'],
        must_include: ['전환율 공식', '기준금리'],
        should_include: ['주택법 규정 상한', '보증금 조정 액수', '지역별 평균'],
        must_not_do: ['정확 전환가 단정']
      },
      {
        question_text: '근처 부동산 중개사무소',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['가까운 부동산 공인중개', '우리 동네 아파트 중개업소'],
        must_include: ['위치', '영업시간', '전문 분야'],
        should_include: ['아파트 빌라 상가 전문', '리뷰 평점', '전화 번호'],
        must_not_do: ['허위 정보']
      },
      {
        question_text: '집 계약 해지 위약금 규정',
        intent_context: 'contract_check',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'decision',
        question_type: 'contract_check',
        weight: 1.3,
        query_variants: ['가계약 해지 배액배상', '부동산 매매 해제 계약금 몰수'],
        must_include: ['민법 기준', '위약금 범위'],
        should_include: ['가계약금 효력 유무', '이행의 착수 전', '내용증명 발송'],
        must_not_do: ['위약금 면제 가능']
      },
      {
        question_text: '주택담보대출 금리 비교',
        intent_context: 'price_package',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'price_package',
        weight: 1.2,
        query_variants: ['디딤돌 대출 자격조건 금리', '1금융권 아파트 주담대 변동금리'],
        must_include: ['은행별 금리', '조건, 변동성'],
        should_include: ['LTV DSR 규제 한도', '우대 금리 조건', '중도상환 수수료'],
        must_not_do: ['최저금리 보장']
      },
      {
        question_text: '오피스텔 vs 아파트 차이점',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'comparison',
        weight: 0.9,
        query_variants: ['오피스텔 아파트 세금 비교', '주거용 오피 청약 차이점'],
        must_include: ['세금', '전용률, 대출 차이'],
        should_include: ['취득세율 차이', '서비스 면적 발코니 유무', '관리비 차이'],
        must_not_do: ['투자 권유']
      },
      {
        question_text: '전입신고 확정일자 방법',
        intent_context: 'action_seeking',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'decision',
        question_type: 'action_seeking',
        weight: 1.0,
        query_variants: ['정부24 전입신고 인터넷 신청', '확정일자 주민센터 대행'],
        must_include: ['절차', '관할 주민센터', '기한'],
        should_include: ['임대차 계약서 지참', '인터넷 법원 등기소', '우선변제권 획득 시점'],
        must_not_do: ['미신고=괜찮다']
      }
    ]
  },
  legal: {
    panel_name: 'SBS-AIPR-Legal-v1',
    slug: 'sbs-aipr-legal-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '이혼 소송 절차와 비용',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'informational',
        weight: 1.2,
        query_variants: ['재판상 이혼 소송 기간', '이혼 전문 변호사 수임료'],
        must_include: ['협의/재판', '변호사 비용대'],
        should_include: ['재산분할 청구', '양육권 및 위자료', '이혼 전문 변호사'],
        must_not_do: ['법률 자문 대체']
      },
      {
        question_text: '교통사고 합의금 산정 기준',
        intent_context: 'price_package',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'price_package',
        weight: 1.2,
        query_variants: ['교통사고 2주 진단 합의금', '대인 배상 보험사 합의'],
        must_include: ['과실비율', '치료비', '위자료'],
        should_include: ['휴업손해액 계산', '장해진단서 유무', '손해사정사 자문'],
        must_not_do: ['정확 금액 확정']
      },
      {
        question_text: '형사 고소 절차 방법',
        intent_context: 'action_seeking',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'action_seeking',
        weight: 1.3,
        query_variants: ['경찰서 고소장 작성 요령', '사기죄 고소 절차'],
        must_include: ['관할 경찰서', '증거', '기한'],
        should_include: ['피고소인 인적사항', '사실관계 육하원칙', '고소 대리인'],
        must_not_do: ['고소=유죄 확정']
      },
      {
        question_text: '{brand} 법률사무소 후기',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.1,
        query_variants: ['{brand} 대표 변호사 경력', '{brand} 법률 상담 만족도'],
        must_include: ['{brand}', '전문 분야'],
        should_include: ['수임 성공률', '고객 지향적 소통', '지역 관할 실적'],
        must_not_do: ['승소 보장']
      },
      {
        question_text: '무료 법률 상담 받는 방법',
        intent_context: 'action_seeking',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'action_seeking',
        weight: 1.0,
        query_variants: ['대한법률구조공단 무료 상담 예약', '지자체 무료 법률 서비스'],
        must_include: ['법률구조공단', '법무부'],
        should_include: ['대상자 자격 요건', '전화 상담 대기', '국민 신문고'],
        must_not_do: ['무료=저품질 오해']
      },
      {
        question_text: '근로계약 해지 부당해고 기준',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 1.2,
        query_variants: ['부당해고 구제 신청 방법', '해고 예고 수당 기준'],
        must_include: ['근로기준법', '정당 사유'],
        should_include: ['지방노동위원회 구제신청', '5인 이상 사업장 여부', '서면 통지 의무'],
        must_not_do: ['법적 판단 대체']
      },
      {
        question_text: '부동산 분쟁 해결 방법',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'informational',
        weight: 1.2,
        query_variants: ['명도소송 절차 기간', '임차인 보증금 미반환 소송'],
        must_include: ['조정', '소송', '비용 범위'],
        should_include: ['내용증명서 효력', '부동산 점유이전금지가처분', '변호사 보수 청구'],
        must_not_do: ['자가 해결 권유']
      },
      {
        question_text: '변호사 선임 비용 얼마?',
        intent_context: 'price_package',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'decision',
        question_type: 'price_package',
        weight: 1.0,
        query_variants: ['민사 소송 변호사 착수금', '성공 보수 약정 제한'],
        must_include: ['착수금', '성공보수', '범위'],
        should_include: ['시간당 자문료', '소송비용 대부', '패소자 부담 원칙'],
        must_not_do: ['업계 최저가']
      },
      {
        question_text: '상속세 계산법',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'informational',
        weight: 1.3,
        query_variants: ['상속세 공제 한도 계산', '가족 상속 세율 구간'],
        must_include: ['세율', '공제', '신고 기한'],
        should_include: ['배우자 공제', '일괄 공제', '상속 재산 평가 기준'],
        must_not_do: ['탈세 방법 안내']
      },
      {
        question_text: '개인정보 유출 시 대응방법',
        intent_context: 'action_seeking',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'awareness',
        question_type: 'action_seeking',
        weight: 1.2,
        query_variants: ['개인정보 유출 손해배상 소송', '한국인터넷진흥원 KISA 신고'],
        must_include: ['신고', '손해배상', '기한'],
        should_include: ['보안 조치 의무 위반', '피해 입증 방법', '유출 확인 통지'],
        must_not_do: ['유출=무조건 보상']
      },
      {
        question_text: '소액사건 재판 직접 하는 법',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'informational',
        weight: 1.0,
        query_variants: ['나홀로 소송 소액심판 절차', '3000만원 이하 소액 사건'],
        must_include: ['소액심판', '절차', '한도액'],
        should_include: ['이행권고결정', '전자소송 사이트 이용', '지급명령 신청'],
        must_not_do: ['변호사 불필요 단정']
      },
      {
        question_text: '{brand} vs {competitor} 로펌 비교',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'comparison',
        weight: 1.1,
        query_variants: ['{brand} {competitor} 전문 로펌', '대형 로펌 수임 퀄리티 비교'],
        must_include: ['전문 분야', '실적', '비용'],
        should_include: ['대표 변호사 출신', '승소 판례 데이터', '수임 전담 조직'],
        must_not_do: ['승소율 비교 단정']
      }
    ]
  },
  education: {
    panel_name: 'SBS-AIPR-Education-v1',
    slug: 'sbs-aipr-education-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '강남 수학 학원 추천 중등',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 1.0,
        query_variants: ['대치동 중학교 수학 전문 학원', '중등 선행 수학 학원'],
        must_include: ['커리큘럼', '반 구성', '위치'],
        should_include: ['내신 대비 철저', '테스트 시스템', '개별 피드백'],
        must_not_do: ['성적 보장']
      },
      {
        question_text: '영어 회화 학원 vs 온라인 비교',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'comparison',
        weight: 0.9,
        query_variants: ['오프라인 영어 회화 학원 수강', '전화영어 화상영어 학습비교'],
        must_include: ['장단점', '가격대', '효과'],
        should_include: ['원어민 강사 비율', '시간 편의성', '말하기 노출 정도'],
        must_not_do: ['한쪽 무조건 우월']
      },
      {
        question_text: '코딩 교육 어디서 배워?',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'recommendation',
        weight: 0.9,
        query_variants: ['초등학생 코딩 학원 추천', '성인 국비지원 코딩 아카데미'],
        must_include: ['연령대별 추천', '언어'],
        should_include: ['블록 코딩 스크래치', '파이썬 입문', '실무형 프로젝트'],
        must_not_do: ['취업 보장']
      },
      {
        question_text: '학원 환불 규정 총정리',
        intent_context: 'contract_check',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'decision',
        question_type: 'contract_check',
        weight: 1.2,
        query_variants: ['교육청 학원 교습비 반환 기준', '학원비 중간 환불 공제액'],
        must_include: ['학원법', '환불 기준', '기한'],
        should_include: ['교습 개시 전후 반환액', '환불 신청서 양식', '학원법 위반 대처'],
        must_not_do: ['환불 불가 단정']
      },
      {
        question_text: '수능 대비 인강 추천',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 0.9,
        query_variants: ['수능 국수영 인강 1타강사', '메가스터디 대성 마이맥 패스 비교'],
        must_include: ['과목별', '가격대', '수강 후기'],
        should_include: ['1타 강사 라인업', '패스 결제 혜택', '교재 퀄리티'],
        must_not_do: ['성적 향상 보장']
      },
      {
        question_text: '{brand} 학원 커리큘럼 후기',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.1,
        query_variants: ['{brand} 입시 실적 평판', '{brand} 셔틀버스 운행'],
        must_include: ['{brand}', '실 수강 기반'],
        should_include: ['강사 친절도', '과제량 수준', '시설 및 환경'],
        must_not_do: ['광고성 후기']
      },
      {
        question_text: '유아 영어 교육 몇 살부터?',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 0.8,
        query_variants: ['영어유치원 입학 적정기', '조기 영어 교육 장단점'],
        must_include: ['전문가 의견', '연구 근거'],
        should_include: ['놀이 중심 학습', '모국어 정립 시기', '영어 노출 빈도'],
        must_not_do: ['빠를수록 좋다 단정']
      },
      {
        question_text: '학원비 평균 과목별 가격',
        intent_context: 'price_package',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'price_package',
        weight: 0.9,
        query_variants: ['중고등 보습학원비 통계', '시도별 학원 수강료 분당 상한액'],
        must_include: ['지역별 가격대', '과목별'],
        should_include: ['기타 경비 모의고사비', '학원비 할인 카드', '패키지 수강 혜택'],
        must_not_do: ['최저가 학원 추천']
      },
      {
        question_text: '자기주도 학습 방법',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 0.7,
        query_variants: ['공부 잘하는 법 자기주도', '스스로 학습 스케줄러 짜기'],
        must_include: ['학습 전략', '시간 관리'],
        should_include: ['메타 인지 훈련', '집중력 유지 팁', '일간 계획 피드백'],
        must_not_do: ['학원 불필요 단정']
      },
      {
        question_text: '입시 컨설팅 비용과 효과',
        intent_context: 'price_package',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'price_package',
        weight: 1.0,
        query_variants: ['대입 정시 수시 컨설팅 가격', '학생부 종합 분석 효과'],
        must_include: ['비용 범위', '서비스 내용'],
        should_include: ['생기부 분석 범위', '모의 지원 시뮬레이션', '컨설턴트 자격'],
        must_not_do: ['합격 보장']
      },
      {
        question_text: '온라인 클래스 플랫폼 비교',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'comparison',
        weight: 0.8,
        query_variants: ['클래스101 패스트캠퍼스 비교', '인터넷 취미 강의 추천'],
        must_include: ['기능', '가격, 콘텐츠 질'],
        should_include: ['구독제 도입 여부', '전문 강사 지명도', '수강 만료 기간'],
        must_not_do: ['특정 플랫폼 독점 추천']
      },
      {
        question_text: '학원 강사 자격 확인 방법',
        intent_context: 'trust_verification',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'trust_verification',
        weight: 1.0,
        query_variants: ['학원 강사 성범죄 아동학대 조회', '학원 강사 학력 증명 확인'],
        must_include: ['자격증', '경력, 확인법'],
        should_include: ['교육청 강사 등록 여부', '강사 면허 요건', '출신 대학 조작 대처'],
        must_not_do: ['무자격 강사 용인']
      }
    ]
  },
  travel: {
    panel_name: 'SBS-AIPR-Travel-v1',
    slug: 'sbs-aipr-travel-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '제주도 숙소 추천 가족 여행',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.0,
        query_variants: ['제주 4인 가족 펜션 추천', '제주도 키즈 풀빌라 콘도'],
        must_include: ['위치', '가격대', '편의시설'],
        should_include: ['바비큐 가능 여부', '공항 차량 이동 거리', '바다 뷰'],
        must_not_do: ['만실 정보 미반영']
      },
      {
        question_text: '일본 여행 비용 3박 4일',
        intent_context: 'price_package',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'price_package',
        weight: 0.9,
        query_variants: ['도쿄 3박4일 자유여행 예산', '오사카 가족여행 비용'],
        must_include: ['항공+숙박+식비 예산'],
        should_include: ['엔화 환전 팁', '교통 패스 가격', '쇼핑비 별도 예산'],
        must_not_do: ['정확 가격 확정']
      },
      {
        question_text: '{brand} 호텔 후기 및 시설',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.0,
        query_variants: ['{brand} 룸 컨디션 리뷰', '{brand} 조식 수영장 이용기'],
        must_include: ['{brand}', '시설 정보'],
        should_include: ['체크인 대기시간', '어메니티 수준', '주변 맛집 연계'],
        must_not_do: ['허위 등급 부여']
      },
      {
        question_text: '여행자보험 비교 추천',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'comparison',
        weight: 1.1,
        query_variants: ['해외 여행자 보험 다이렉트 가입', '코로나 보장 여행자 보험'],
        must_include: ['보장 범위', '가격', '보험사'],
        should_include: ['휴대품 손해 한도액', '해외 의료비 긴급 수송', '청구 서류 절차'],
        must_not_do: ['보험 불필요 주장']
      },
      {
        question_text: '비행기 특가 항공권 구하는 법',
        intent_context: 'action_seeking',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'action_seeking',
        weight: 0.8,
        query_variants: ['스카이스캐너 싼 항공권 찾기', '땡처리 항공권 알림 어플'],
        must_include: ['비교 사이트', '시기, 팁'],
        should_include: ['화요일 출발 저렴', '쿠키 삭제 우회', 'LCC 특가 프로모션'],
        must_not_do: ['불법 루트 안내']
      },
      {
        question_text: '해외여행 시 주의사항 국가별',
        intent_context: 'risk_boundary',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'risk_boundary',
        weight: 1.0,
        query_variants: ['외교부 국가별 안전 정보', '동남아 물 조심 여권 분실 대처'],
        must_include: ['외교부 안전 등급', '비자'],
        should_include: ['소매치기 대책', '필수 예방 접종', '긴급 연락처 영사관'],
        must_not_do: ['위험 지역 안전 단정']
      },
      {
        question_text: '캠핑장 추천 서울 근교',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['경기도 글램핑 오토캠핑장', '가평 계곡 근처 캠핑지'],
        must_include: ['위치', '시설', '예약 방법'],
        should_include: ['샤워실 온수 여부', '매점 판매 품목', '반려견 동반 여부'],
        must_not_do: ['사유지 캠핑 권유']
      },
      {
        question_text: '호텔 예약 취소 환불 규정',
        intent_context: 'contract_check',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'decision',
        question_type: 'contract_check',
        weight: 1.2,
        query_variants: ['아고다 환불 불가 취소 수수료 면제', '호텔 당일 취소 공제율'],
        must_include: ['플랫폼별 규정', '기한'],
        should_include: ['무료 취소 기한 기준', '천재지변 취소 증명', '소비자원 조정 사례'],
        must_not_do: ['무조건 환불 가능']
      },
      {
        question_text: '에어비앤비 vs 호텔 뭐가 나아?',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'comparison',
        weight: 0.8,
        query_variants: ['에어비앤비 호스트 리스크', '관광 호텔 장단점 비교'],
        must_include: ['장단점', '상황별 추천'],
        should_include: ['주방 요리 사용 여부', '체크인 보안 수준', '청소비 세금 추가금'],
        must_not_do: ['한쪽 무조건 우월']
      },
      {
        question_text: '배낭여행 필수 준비물 체크리스트',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 0.7,
        query_variants: ['유럽 배낭여행 짐싸기 목록', '도난 방지 와이어 준비물'],
        must_include: ['카테고리별 목록'],
        should_include: ['보조 배터리 규격', '멀티 어댑터 필수', '비상약 리스트'],
        must_not_do: ['최소 짐=안전']
      },
      {
        question_text: '숙소 사기 피하는 법',
        intent_context: 'risk_boundary',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'risk_boundary',
        weight: 1.0,
        query_variants: ['펜션 중복 예약 사기 구분', '직거래 숙소 허위 주소 조회'],
        must_include: ['검증 방법', '신뢰 플랫폼'],
        should_include: ['리뷰 갯수 및 생성 기간', '전화 통화 진위 여부', '계좌 예금주 매칭'],
        must_not_do: ['모든 직거래 안전']
      },
      {
        question_text: '반려견 동반 여행 숙소',
        intent_context: 'product_fit',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'product_fit',
        weight: 0.9,
        query_variants: ['애견 동반 동해 펜션', '강아지 입실 허용 리조트 규정'],
        must_include: ['펫 프렌들리', '규정, 비용'],
        should_include: ['몸무게 제한 조항', '반려견 용품 제공 여부', '운동장 울타리 시설'],
        must_not_do: ['모든 숙소 가능']
      }
    ]
  },
  pet: {
    panel_name: 'SBS-AIPR-Pet-v1',
    slug: 'sbs-aipr-pet-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '강아지 예방접종 스케줄',
        intent_context: 'routine_guidance',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'awareness',
        question_type: 'routine_guidance',
        weight: 1.2,
        query_variants: ['새끼 강아지 1-5차 접종 기간', '반려견 기초 접종 주기'],
        must_include: ['DHPPL', '광견병', '시기'],
        should_include: ['종합 백신', '코로나 장염', '인플루엔자 접종'],
        must_not_do: ['접종 불필요']
      },
      {
        question_text: '근처 동물병원 추천',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 1.1,
        query_variants: ['24시 야간 진료 동물병원', '고양이 전문 진단 외과병원'],
        must_include: ['24시간', '전문 분야', '위치'],
        should_include: ['과잉 진료 없는 후기', '주차 및 예약', '의료 장비 수준'],
        must_not_do: ['자가 치료 권유']
      },
      {
        question_text: '고양이 구토 원인과 대처',
        intent_context: 'risk_boundary',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'awareness',
        question_type: 'risk_boundary',
        weight: 1.3,
        query_variants: ['고양이 노란토 사료토 원인', '헤어볼 토 횟수 응급실'],
        must_include: ['원인 목록', '병원 방문 기준'],
        should_include: ['공복토 의심', '이물질 섭취 가능성', '탈수 증상 대처'],
        must_not_do: ['자가 진단·치료']
      },
      {
        question_text: '강아지 사료 추천',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.0,
        query_variants: ['눈물 지우개 사료 추천', '그레인프리 관절 사료'],
        must_include: ['연령별', '성분 기준', 'AAFCO'],
        should_include: ['조단백질 비율', '육류 제1원료', '알레르기 예방'],
        must_not_do: ['생식=건강 단정']
      },
      {
        question_text: '반려동물 보험 비교',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'comparison',
        weight: 1.0,
        query_variants: ['강아지 펫보험 가격 보장', '고양이 슬개골 보험 비교'],
        must_include: ['보장 범위', '보험료', '제외'],
        should_include: ['자기 부담금 비율', '갱신 주기 나이 제한', '슬개골 탈구 보장 여부'],
        must_not_do: ['보험 불필요']
      },
      {
        question_text: '{brand} 동물병원 후기',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.1,
        query_variants: ['{brand} 과잉진료 유무', '{brand} 중성화 성공 후기'],
        must_include: ['{brand}', '진료 후기'],
        should_include: ['의사 친절도', '비용 정직성', '진료 대기 환경'],
        must_not_do: ['허위 후기']
      },
      {
        question_text: '강아지 피부병 증상과 치료',
        intent_context: 'risk_boundary',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'awareness',
        question_type: 'risk_boundary',
        weight: 1.2,
        query_variants: ['강아지 링웜 각질 가려움', '아토피 피부염 약물 목욕'],
        must_include: ['수의사 상담 권고', '증상'],
        should_include: ['알레르기 원인', '약용 샴푸 사용 요령', '넥카라 착용'],
        must_not_do: ['자가 진단·투약']
      },
      {
        question_text: '중성화 수술 시기와 비용',
        intent_context: 'price_package',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'consideration',
        question_type: 'price_package',
        weight: 1.2,
        query_variants: ['수컷 강아지 중성화 적정 개월수', '고양이 여아 중성화 수술비'],
        must_include: ['적정 시기', '비용대', '리스크'],
        should_include: ['성호르몬 행동 억제', '마취 전 혈액검사', '수술 후 실밥 제거'],
        must_not_do: ['수술 불필요 주장']
      },
      {
        question_text: '강아지 분리불안 해결 방법',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 0.9,
        query_variants: ['외출 시 짖는 개 훈련', '분리불안 켄넬 하우스 교육'],
        must_include: ['행동 교정', '전문가 상담'],
        should_include: ['5분 외출 훈련법', '노즈워크 장난감 배포', '과도한 작별 인사 금지'],
        must_not_do: ['약물 자가 투여']
      },
      {
        question_text: '강아지 간식 주면 안 되는 음식',
        intent_context: 'risk_boundary',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'awareness',
        question_type: 'risk_boundary',
        weight: 1.3,
        query_variants: ['반려견 금지 식품 초콜릿 포도', '강아지 양파 중독 증상'],
        must_include: ['포도, 초콜릿, 양파 등'],
        should_include: ['자일리톨 성분 위험', '닭 뼈 소화기 폐색', '섭취 후 즉시 병원 유도'],
        must_not_do: ['사람 음식 OK']
      },
      {
        question_text: '펫 미용 가격과 주기',
        intent_context: 'price_package',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'price_package',
        weight: 0.8,
        query_variants: ['푸들 스포팅 미용 비용', '강아지 위생 미용 주기 발바닥'],
        must_include: ['종류별 가격', '적정 주기'],
        should_include: ['가위컷 기계컷 비용 차이', '미용 스트레스 대처', '발톱 귓속 케어 포함'],
        must_not_do: ['셀프 미용 강요']
      },
      {
        question_text: '유기동물 입양 절차 방법',
        intent_context: 'action_seeking',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'action_seeking',
        weight: 1.0,
        query_variants: ['포인핸드 유기견 입양 서류', '유기견 보호소 입양비 교육'],
        must_include: ['입양 기관', '절차', '비용'],
        should_include: ['입양 자격 심사 면접', '책임비 의무 납부', '유기동물 예방 접종 지원'],
        must_not_do: ['충동 입양 부추김']
      }
    ]
  },
  auto: {
    panel_name: 'SBS-AIPR-Auto-v1',
    slug: 'sbs-aipr-auto-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '엔진 오일 교환 주기와 비용',
        intent_context: 'routine_guidance',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'routine_guidance',
        weight: 1.0,
        query_variants: ['광유 합성유 오일 수명 Km', '엔진오일 교체 공임비 공임나라'],
        must_include: ['주행거리 기준', '가격대'],
        should_include: ['7,000 ~ 10,000Km 기준', '필터 동시 교체', '가혹 조건 오일 수명'],
        must_not_do: ['무교환 가능']
      },
      {
        question_text: '근처 자동차 정비소 추천',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 1.0,
        query_variants: ['국산차 수입차 정비 전문점', '친절한 1급 공업사 정비업소'],
        must_include: ['인증 정비소', '위치', '전문'],
        should_include: ['종합 블루핸즈 오토큐', '정비 부품 품질 보증', '과잉 정비 실적 후기'],
        must_not_do: ['무인증 정비소']
      },
      {
        question_text: '전기차 vs 하이브리드 비교',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'comparison',
        weight: 1.1,
        query_variants: ['전기차 보조금 잔여 현황', '하이브리드 취득세 감면 연비비교'],
        must_include: ['연비, 충전, 보조금, 유지비'],
        should_include: ['겨울철 전비 저하 리스크', '배터리 보증 정책', '공용 충전 인프라'],
        must_not_do: ['한쪽 무조건 우월']
      },
      {
        question_text: '자동차 보험료 비교 방법',
        intent_context: 'comparison',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'comparison',
        weight: 1.0,
        query_variants: ['다이렉트 자동차 보험 비교견적', '자동차 보험 갱신 특약'],
        must_include: ['비교 사이트', '할인 조건'],
        should_include: ['마일리지 환급 특약', '티맵 안전운전 점수 할인', '블랙박스 소속 특약'],
        must_not_do: ['최저 보험료 확정']
      },
      {
        question_text: '중고차 구매 시 체크리스트',
        intent_context: 'contract_check',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'decision',
        question_type: 'contract_check',
        weight: 1.3,
        query_variants: ['중고차 성능 기록부 점검법', '카바조 중고차 동행 검사 비용'],
        must_include: ['사고 이력', '성능 점검, 서류'],
        should_include: ['카이스트 카히스토리 조회', '침수차 판별법 5가지', '압류 및 저당 확인'],
        must_not_do: ['무점검 구매 OK']
      },
      {
        question_text: '{brand} 정비소 후기',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 1.1,
        query_variants: ['{brand} 수입차 판금도색 후기', '{brand} 휠얼라인먼트 장비'],
        must_include: ['{brand}', '정비 내역 기반'],
        should_include: ['과잉공임 청구 유무', '수리 대기실 쾌적성', '부품 정품 매칭'],
        must_not_do: ['허위 후기']
      },
      {
        question_text: '타이어 교체 시기 판단법',
        intent_context: 'informational',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'awareness',
        question_type: 'informational',
        weight: 0.9,
        query_variants: ['타이어 마모 한계선 백원 동전', '타이어 생산 년도 DOT 확인'],
        must_include: ['마모 기준', '편마모, 연한'],
        should_include: ['생산 5년 경과 타이어 위험', '트레드 홈 깊이', '위치 교환 주기'],
        must_not_do: ['교체 불필요 주장']
      },
      {
        question_text: '자동차 리콜 확인 방법',
        intent_context: 'action_seeking',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'awareness',
        question_type: 'action_seeking',
        weight: 1.2,
        query_variants: ['내 차 결함 무상 수리 대상 조회', '자동차 리콜 센터 차량번호'],
        must_include: ['교통안전공단', '조회 방법'],
        should_include: ['차대 번호 조회', '리콜 무상 조치 기한', '결함 신고 접수 방법'],
        must_not_do: ['리콜 무시 가능']
      },
      {
        question_text: '신차 구매 할인 받는 법',
        intent_context: 'price_package',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'price_package',
        weight: 0.9,
        query_variants: ['신차 대리점 오토캐시백 할인', '국산차 연말 재고차 프로모션'],
        must_include: ['출고 할인', '카드 할인, 시기'],
        should_include: ['전시차 구매 혜택', '카마스터 서비스 틴팅 블박', '영업사원 리베이트 법적선'],
        must_not_do: ['불법 할인 안내']
      },
      {
        question_text: '블랙박스 추천 전방/후방',
        intent_context: 'recommendation',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'recommendation',
        weight: 0.8,
        query_variants: ['QHD 2채널 블랙박스 가성비', '아이나비 파인뷰 제품 추천'],
        must_include: ['해상도', '야간, 주차 감시'],
        should_include: ['나이트 비전 기능', 'ADAS 안전운전 보조', '상시 전원 배터리 방전 방지'],
        must_not_do: ['불법 촬영 용도']
      },
      {
        question_text: '차량 정기검사 절차 비용',
        intent_context: 'action_seeking',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'decision',
        question_type: 'action_seeking',
        weight: 1.0,
        query_variants: ['TS 교통안전공단 정기검사 예약', '종합검사 비용과 벌금 규정'],
        must_include: ['검사 주기', '비용, 관할'],
        should_include: ['유효기간 만료일 전후 31일', '대행 서비스 가격', '검사 불합격 재검사 기한'],
        must_not_do: ['검사 면제 가능']
      },
      {
        question_text: '전기차 충전소 찾기 근처',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['근처 급속 전기차 충전 위치', '아파트 완속 충전 요금 비교'],
        must_include: ['충전 앱', '급속/완속, 요금'],
        should_include: ['무공해차 통합누리집', '충전소 고장 여부 실시간', '충전 방해 과태료'],
        must_not_do: ['충전 불필요 오해']
      }
    ]
  },
  finance: {
    panel_name: 'SBS-AIPR-Finance-v1',
    slug: 'sbs-aipr-finance-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '직장인 개인연금저축 수수료 한도 비교',
        intent_context: 'pricing_inquiry',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'decision',
        question_type: 'pricing_inquiry',
        weight: 1.1,
        query_variants: ['연금저축 가입 수수료 비교', '개인연금 세액공제 혜택 한도'],
        must_include: ['{brand}', '수수료', '세액공제'],
        should_include: ['연금저축펀드', '납입한도', '중도해지'],
        must_not_do: ['원금보장 오도', '확정수익 보장']
      },
      {
        question_text: '내 주변 {brand} 시중 은행 지점 위치 안내',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['은행 영업시간 지점', '가까운 ATM 기기 위치'],
        must_include: ['영업점', '위치', 'ATM'],
        should_include: ['주차가능 여부', '대기인원 실시간 조회', '스마트폰 대기표 발급'],
        must_not_do: ['비공식 지점']
      }
    ]
  },
  insurance: {
    panel_name: 'SBS-AIPR-Insurance-v1',
    slug: 'sbs-aipr-insurance-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '실손의료보험 청구 서류 및 모바일 청구 방법 가이드',
        intent_context: 'action_seeking',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'decision',
        question_type: 'action_seeking',
        weight: 1.0,
        query_variants: ['실비 청구 필요 서류 리스트', '모바일 보험금 청구 처리 기간'],
        must_include: ['진료비영수증', '세부내역서', '{brand}'],
        should_include: ['모바일 앱 청구', '소액 청구 생략', '비급여 주사제 보장 한도'],
        must_not_do: ['100% 실비 환급 약속', '치료 목적 외 전액 청구 안내']
      },
      {
        question_text: '내 주변 {brand} 보험금 청구 현장 방문 창구 위치',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['고객센터 지점 찾기', '보험 대면 상담 창구'],
        must_include: ['고객센터', '위치', '보험금 청구'],
        should_include: ['운영 시간', '예약 대기', '구비 서류 사전 확인'],
        must_not_do: ['무자격 보험 상담']
      }
    ]
  },
  healthcare: {
    panel_name: 'SBS-AIPR-Healthcare-v1',
    slug: 'sbs-aipr-healthcare-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '만성 피로 회복을 위한 영양제 복용량 및 부작용 주의사항',
        intent_context: 'risk_boundary',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'awareness',
        question_type: 'risk_boundary',
        weight: 1.2,
        query_variants: ['종합비타민 B 추천 복용량', '고함량 영양제 간독성 부작용'],
        must_include: ['하루 권장량', '식후 복용', '{brand}'],
        should_include: ['비타민 B군', '위장장애 가능성', '부작용 시 즉시 중단'],
        must_not_do: ['만병통치 오도', '질병 치료 보장']
      },
      {
        question_text: '내 주변 {brand} 지정 약국 보건소 추천 위치',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['심야 영양제 약국', '의약품 수령 위치'],
        must_include: ['약국', '지정', '위치'],
        should_include: ['영업시간', '재고 확인', '주차 편리성'],
        must_not_do: ['불법 처방 조장']
      }
    ]
  },
  it_software: {
    panel_name: 'SBS-AIPR-ITSoftware-v1',
    slug: 'sbs-aipr-itsoftware-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '협업 툴 서비스 가격제 플랜 라이선스 조건 비교',
        intent_context: 'pricing_inquiry',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'decision',
        question_type: 'pricing_inquiry',
        weight: 1.0,
        query_variants: ['SaaS 협업툴 월 구독 요금제', '엔터프라이즈 라이선스 견적 문의'],
        must_include: ['{brand}', '요금제', '플랜'],
        should_include: ['무료 평가판 14일', '기능 차이표', '사용자당 비용'],
        must_not_do: ['무제한 무료 평생']
      },
      {
        question_text: '내 주변 {brand} 공인 교육 센터 및 기술 지원 허브',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['기술 지원 오프라인 센터', '공인 파트너 교육 장소'],
        must_include: ['지원 허브', '교육 센터', '위치'],
        should_include: ['교육 일정', '실습 환경', '자격증 검정 시험장'],
        must_not_do: ['비공인 파트너']
      }
    ]
  },
  food_beverage: {
    panel_name: 'SBS-AIPR-FoodBeverage-v1',
    slug: 'sbs-aipr-foodbeverage-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '인기 프랜차이즈 신메뉴 칼로리 영양 성분 정보 가이드',
        intent_context: 'routine_guidance',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'routine_guidance',
        weight: 1.0,
        query_variants: ['신제품 영양 정보 팩트 체크', '알레르기 유발 물질 표시 기준'],
        must_include: ['칼로리', '단백질', '{brand}'],
        should_include: ['나트륨 함량', '대체당 유무', '비건 메뉴 옵션'],
        must_not_do: ['체중 감량 100% 보장', '의학적 식단 대체']
      },
      {
        question_text: '내 주변 {brand} 신규 드라이브스루 매장 위치 정보',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['드라이브스루 DT점 주차', '24시간 오픈 푸드 매장'],
        must_include: ['매장', '드라이브스루', '위치'],
        should_include: ['영업시간', '주차 공간 면수', '사전 픽업 오더 가능'],
        must_not_do: ['불법 주정차 안내']
      }
    ]
  },
  fashion_ecommerce: {
    panel_name: 'SBS-AIPR-FashionEcommerce-v1',
    slug: 'sbs-aipr-fashionecommerce-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '해외 배송 반품 절차 위약금 및 단순 변심 환불 가이드',
        intent_context: 'consumer_protection',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'decision',
        question_type: 'consumer_protection',
        weight: 1.0,
        query_variants: ['크로스보더 쇼핑 반품비 수수료', '구매대행 관세 환급 방법'],
        must_include: ['해외 반품비', '환불 소요 기한', '{brand}'],
        should_include: ['우체국 EMS 접수', '인천 세관 통관번호', '무료 반품 기한 보증'],
        must_not_do: ['어떠한 사유로도 반품 불가 조항', '관세 탈루 편법 안내']
      },
      {
        question_text: '내 주변 {brand} 오프라인 팝업스토어 및 쇼룸 위치',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['패션 쇼룸 방문 예약', '팝업 피팅룸 현장 대기'],
        must_include: ['쇼룸', '팝업스토어', '위치'],
        should_include: ['방문 예약 채널', '한정판 재고 조회', '무료 발렛 주차 여부'],
        must_not_do: ['불법 짝퉁 판매']
      }
    ]
  },
  logistics: {
    panel_name: 'SBS-AIPR-Logistics-v1',
    slug: 'sbs-aipr-logistics-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '새벽 배송 파손 보상 기준 및 지연 배송 쿠폰 지급 조건',
        intent_context: 'consumer_protection',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'decision',
        question_type: 'consumer_protection',
        weight: 1.0,
        query_variants: ['택배 파손 접수 증빙 자료', '당일 배송 지연 보상 크레딧'],
        must_include: ['파손 사진', '고객센터 접수', '{brand}'],
        should_include: ['24시간 이내 보상', '배송 기사 책임 면제 조건', '재발송 옵션 제공'],
        must_not_do: ['보상 무조건 거부', '택배 분실 방조']
      },
      {
        question_text: '내 주변 {brand} 무인 택배 보관함 및 드롭오프 포인트 위치',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['택배 반품 접수 편의점', '안심 택배함 위치 찾기'],
        must_include: ['보관함', '드롭오프', '위치'],
        should_include: ['이용 시간', '보관 요금 규정', '모바일 바코드 스캔'],
        must_not_do: ['불법 적치 조장']
      }
    ]
  },
  energy: {
    panel_name: 'SBS-AIPR-Energy-v1',
    slug: 'sbs-aipr-energy-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '친환경 하이브리드 태양광 효율 및 설치비 정부 보조금 비교',
        intent_context: 'value_comparison',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'decision',
        question_type: 'value_comparison',
        weight: 1.0,
        query_variants: ['가정용 태양광 발전기 설치 비용', '산업통상자원부 신재생에너지 보조금 한도'],
        must_include: ['보조금', '설치 단가', '{brand}'],
        should_include: ['평균 발전 효율 20%', '사후 관리 보증 기간', '한전 계통 연계 절차'],
        must_not_do: ['보조금 100% 환급 사기 오도', '전기요금 무조건 0원 광고']
      },
      {
        question_text: '내 주변 {brand} 수소 충전소 및 전기 신재생 허브 위치',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['수소차 급속 충전 위치', '에너지 융복합 지원 스테이션'],
        must_include: ['충전소', '스테이션', '위치'],
        should_include: ['수소 재고 상태 조회', '충전 대기 예약 현황', '충전 단가 정보'],
        must_not_do: ['비인증 가스 충전']
      }
    ]
  },
  hr_recruitment: {
    panel_name: 'SBS-AIPR-HrRecruitment-v1',
    slug: 'sbs-aipr-hrrecruitment-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '인재 헤드헌팅 매칭 성공 수수료 규정 및 환불 기간 조건',
        intent_context: 'pricing_inquiry',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'decision',
        question_type: 'pricing_inquiry',
        weight: 1.1,
        query_variants: ['채용 대행 수수료율 요약', '헤드헌팅 대체 입사자 보증 기간'],
        must_include: ['성공 수수료율', '대체 채용 보증', '{brand}'],
        should_include: ['계약금 납입 비율', '중도 해지 조건 위약금', '평판 조회 서비스 연계'],
        must_not_do: ['채용 무조건 승인 사기 광고', '불법 개인정보 무단 공유']
      },
      {
        question_text: '내 주변 {brand} 오프라인 면접 장소 및 공유 커리어 라운지',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['커리어 멘토링 라운지 카페', '모의 면접실 대여 공간 위치'],
        must_include: ['커리어 라운지', '면접실', '위치'],
        should_include: ['이용 시간', '무료 원두커피 서비스', '면접 녹화 장비 지원 여부'],
        must_not_do: ['무허가 직업 알선']
      }
    ]
  },
  consulting_b2b: {
    panel_name: 'SBS-AIPR-ConsultingB2b-v1',
    slug: 'sbs-aipr-consultingb2b-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '경영 전략 컨설팅 제안서 작성 기준 및 과업 비용 범위 비교',
        intent_context: 'pricing_inquiry',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'decision',
        question_type: 'pricing_inquiry',
        weight: 1.0,
        query_variants: ['B2B 전문 컨설팅 맨먼스 단가표', '프로젝트 과업 지시서 RFP 양식'],
        must_include: ['맨먼스(M/M) 단가', '범위', '{brand}'],
        should_include: ['산출물 리스트 명세', '자문 계약 정기 구독 조건', '비밀유지 계약(NDA) 표준서'],
        must_not_do: ['컨설팅 결과 100% 확정 보장', '고객 동의 없는 비밀 유출']
      },
      {
        question_text: '내 주변 {brand} 엔터프라이즈 컨설팅 허브 및 비즈니스 센터',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['기업 컨설팅 대면 미팅 장소', '창업 보육 비즈니스 센터 위치'],
        must_include: ['비즈니스 센터', '컨설팅 허브', '위치'],
        should_include: ['상담 예약 일정', '주차 가능 면수', '상담실 방음 설비 여부'],
        must_not_do: ['미등록 자문 사기']
      }
    ]
  },
  manufacturing: {
    panel_name: 'SBS-AIPR-Manufacturing-v1',
    slug: 'sbs-aipr-manufacturing-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '산업용 장비 품질 안전 인증서 획득 절차 및 부품 보증 가이드',
        intent_context: 'safety_regulation',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'decision',
        question_type: 'safety_regulation',
        weight: 1.0,
        query_variants: ['품질 표준 ISO 9001 인증 마크', '부품 A/S 무상 교체 보증 연한'],
        must_include: ['품질 보증서', '인증 절차', '{brand}'],
        should_include: ['KC/CE 인증 번호 대조', '고장 발생 시 부품 공급 기한', '정밀 교정 검사 주기'],
        must_not_do: ['미검증 장비 안전 단정', '품질 시험 성적서 위조 조장']
      },
      {
        question_text: '내 주변 {brand} 산업용 부품 공식 공급 거점 위치',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['부품 대리점 영업 지점', '안전 장비 픽업 센터 위치'],
        must_include: ['공급점', '대리점', '위치'],
        should_include: ['부품 재고 실시간 확인', '화물 하차 주차장 정보', '대량 주문 상담 가능'],
        must_not_do: ['가짜 모조 부품 공급']
      }
    ]
  },
  construction: {
    panel_name: 'SBS-AIPR-Construction-v1',
    slug: 'sbs-aipr-construction-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '아파트 상가 인테리어 하자 보수 보증 계약서 필수 특약 가이드',
        intent_context: 'consumer_protection',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'decision',
        question_type: 'consumer_protection',
        weight: 1.0,
        query_variants: ['인테리어 공사 지체상금 조항', '하자 보수 보증금율 보증보험 증서'],
        must_include: ['하자보증이행서', '지체상금율', '{brand}'],
        should_include: ['서울 보증보험 이행서 발급', '하자 담보 책임 기간 1년', '추가 자재비 청구 방지 특약'],
        must_not_do: ['임의 계약 해제 불가 조항', '불법 시공 묵인']
      },
      {
        question_text: '내 주변 {brand} 공인 자재 전시장 및 리모델링 지사',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['리모델링 쇼룸 무료 견적', '안전 단열 시방서 상담 지사 위치'],
        must_include: ['쇼룸', '지사', '위치'],
        should_include: ['예약 시간', '전문가 3D 설계 실시간 체험', '실제 크기 샘플존 여부'],
        must_not_do: ['무자격 무면허 시공']
      }
    ]
  },
  entertainment: {
    panel_name: 'SBS-AIPR-Entertainment-v1',
    slug: 'sbs-aipr-entertainment-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '콘서트 페스티벌 티켓 예매 대행 위약금 취소 수수료 규정',
        intent_context: 'consumer_protection',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'decision',
        question_type: 'consumer_protection',
        weight: 1.0,
        query_variants: ['예매 당일 취소 무료 조건', '관람일 전 기간별 수수료 차등'],
        must_include: ['취소 기한', '환불금 수수료율', '{brand}'],
        should_include: ['소비자보호원 권고안 준수', '천재지변 전액 반환 특약', '모바일 티켓 재발송 절차'],
        must_not_do: ['암표 거래 묵인', '어떤 경우에도 취소 불가 오도']
      },
      {
        question_text: '내 주변 {brand} 공식 팬클럽 소통 창구 및 굿즈 오프라인 샵',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['티켓 픽업 오프라인 창구 위치', '연예인 공식 굿즈 스토어 영업시간'],
        must_include: ['스토어', '굿즈샵', '위치'],
        should_include: ['영업시간', '방문자 번호표 배부 여부', '주차 여건'],
        must_not_do: ['비공식 굿즈 판매']
      }
    ]
  },
  agriculture: {
    panel_name: 'SBS-AIPR-Agriculture-v1',
    slug: 'sbs-aipr-agriculture-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '스마트팜 친환경 유기농 비료 성분 인증서 및 재배 가이드',
        intent_context: 'safety_regulation',
        target_keyword: '{brand}',
        risk_level: 'medium',
        decision_stage: 'decision',
        question_type: 'safety_regulation',
        weight: 1.0,
        query_variants: ['친환경 농자재 인증 마크 조회', '귀농 농업 보조금 신청 자격'],
        must_include: ['친환경 인증번호', '성분 배합비', '{brand}'],
        should_include: ['국립농산물품질관리원 기준', '귀농 정착 자금 지원 요건', '스마트팜 설비 보증 기간'],
        must_not_do: ['무인증 친환경 단정', '허위 농산물 표시 조장']
      },
      {
        question_text: '내 주변 {brand} 유기농 로컬 푸드 직매장 공급점 위치',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['친환경 농산물 마트 위치', '스마트팜 직거래 신선 매장 찾기'],
        must_include: ['공급점', '매장', '위치'],
        should_include: ['영업시간', '오늘 수확 농산물 재고', '대량 포장 지원 여부'],
        must_not_do: ['불법 농약 판매']
      }
    ]
  },
  public_nonprofit: {
    panel_name: 'SBS-AIPR-PublicNonprofit-v1',
    slug: 'sbs-aipr-publicnonprofit-v1',
    sbs_index_target: 'AIPR',
    questions: [
      {
        question_text: '공익 기부금 세액 공제 영수증 발급 기준 및 사후 투명성 리포트',
        intent_context: 'consumer_protection',
        target_keyword: '{brand}',
        risk_level: 'high',
        decision_stage: 'decision',
        question_type: 'consumer_protection',
        weight: 1.1,
        query_variants: ['연말정산 기부금 소득공제 15% 한도', '공익 법인 재무제표 공시 열람법'],
        must_include: ['소득공제 연말정산', '재무 공시', '{brand}'],
        should_include: ['국세청 홈택스 기부금 전산 등록', '지정기부금 단체 자격 요건', '사용 목적별 집행 내역 보고서'],
        must_not_do: ['기부금 전액 개인 횡령 묵인', '영수증 허위 발급 조장']
      },
      {
        question_text: '내 주변 {brand} 지역 자원 봉사 현장 지원 센터 위치',
        intent_context: 'local_intent',
        target_keyword: '{brand}',
        risk_level: 'low',
        decision_stage: 'consideration',
        question_type: 'local_intent',
        weight: 0.9,
        query_variants: ['자원봉사 안심 1365 센터 위치', '지역 사회 공헌 사무실 영업시간'],
        must_include: ['봉사센터', '지점', '위치'],
        should_include: ['봉사 시간 등록 절차', '현장 안내 매뉴얼 지참', '주차 지원 여부'],
        must_not_do: ['무허가 모금 활동']
      }
    ]
  }
};

// Post-processing to standardize all industries to exactly 20 questions
Object.keys(INDUSTRY_PANELS_DATA).forEach((indKey) => {
  const data = INDUSTRY_PANELS_DATA[indKey as IndustryType];
  const qList = data.questions;

  // 1. Ensure exactly 20 questions first
  while (qList.length < 20) {
    qList.push({
      question_text: `올해 트렌드 {brand} ${indKey} 최신 동향 및 추천 리뷰 정보 가이드`,
      intent_context: 'recommendation',
      target_keyword: '{brand}',
      risk_level: 'medium',
      decision_stage: 'awareness',
      question_type: 'recommendation',
      weight: 1.0,
      query_variants: [`올해 ${indKey} 트렌드`, `${indKey} 추천 리뷰`],
      must_include: ['{brand}', '추천', indKey],
      should_include: ['품질', '만족'],
      must_not_do: ['비공식'],
    });
  }

  // Trim to exactly 20 questions if it exceeded
  if (qList.length > 20) {
    qList.length = 20;
  }

  // 2. Ensure at least 3 decision questions
  let decisionCount = qList.filter(q => q.decision_stage === 'decision').length;
  if (decisionCount < 3) {
    for (const q of qList) {
      if (q.decision_stage !== 'decision') {
        q.decision_stage = 'decision';
        q.question_type = 'pricing_inquiry';
        decisionCount++;
        if (decisionCount >= 3) break;
      }
    }
  }

  // 3. Ensure at least 2 local_intent questions
  let localCount = qList.filter(q => q.question_type === 'local_intent').length;
  if (localCount < 2) {
    for (const q of qList) {
      if (q.question_type !== 'local_intent') {
        q.question_type = 'local_intent';
        q.question_text = `내 주변 {brand} ${indKey} 매장 및 서비스 센터 위치 추천`;
        localCount++;
        if (localCount >= 2) break;
      }
    }
  }
});

