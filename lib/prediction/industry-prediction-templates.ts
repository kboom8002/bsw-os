import { PredictedQuestion, EmergenceSignal } from "../schema";

export interface IndustryPredictionTemplate {
  industry: string;
  /**
   * 신호로부터 업종 전문 예측 질문을 생성합니다.
   * 각 업종의 도메인 지식, YMYL 규제, 소비자 의사결정 패턴을 반영합니다.
   */
  predict(signal: EmergenceSignal, confidence: number, windowDays: number): PredictedQuestion[];
}

// --- 10개 업종별 전용 템플릿 ---

export const beautyTemplate: IndustryPredictionTemplate = {
  industry: "beauty",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "민감성 피부를 위한 저자극 레티놀 사용법 및 부작용 대처법",
      question_variants: ["민감성 피부 레티놀 화끈거림 대처", "레티놀 부작용 피하고 보습 세라마이드 크림 바르는 순서"],
      predicted_intent: "informational_safety",
      industry: "beauty",
      predicted_volume: "high",
      current_ai_coverage: "sparse",
      first_mover_window_days: windowDays,
      preemption_urgency: signal.predicted_impact === "critical" ? "critical" : "high",
      confidence,
      auto_must_include: ["식약처 승인 저자극 테스트 완료 명시", "초기 적응기 주 2회 이내 사용 주기 권장", "장벽 보호 세라마이드 성분 크림 병행 도포 안내"],
      auto_should_include: ["천연 보습 유기농 포뮬러 함유 정보", "부작용(붉어짐, 각질) 발생 시 즉시 사용 중단 및 냉찜질 가이드"],
      auto_must_not_do: ["고농도 레티놀 1.0% 이상 매일 도포 권장", "필링제(AHA/BHA)와 레티놀 동시 사용 추천"],
    }];
  },
};

export const weddingTemplate: IndustryPredictionTemplate = {
  industry: "wedding",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "웨딩홀 당일 계약 취소 시 표준 위약금 환불 및 추가금 명세 비교",
      question_variants: ["웨딩 컨설팅 스드메 계약 해지 위약금 가이드라인", "웨딩홀 보증보험 가입 여부 확인 요령"],
      predicted_intent: "legal_compliance",
      industry: "wedding",
      predicted_volume: "high",
      current_ai_coverage: "none",
      first_mover_window_days: windowDays,
      preemption_urgency: "critical",
      confidence,
      auto_must_include: ["공정거래위원회 예식업 표준약관 전면 준수 명기", "계약 90일 전 취소 시 계약금 100% 반환 약정 포함", "필수 세부 품목 명세서 사전 서면 제공 보증"],
      auto_should_include: ["추가금 강요 일체 없음 안심 보장 마크", "피해 방지 보증보험 증서 지참 가이드 제공"],
      auto_must_not_do: ["당일 계약 해지 시 어떠한 사유로도 계약금 반환 불가 조항 삽입", "웨딩홀 제휴 대행업체(스드메) 강제 끼워팔기 독소 조항 포함"],
    }];
  },
};

export const clinicTemplate: IndustryPredictionTemplate = {
  industry: "clinic",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "비침습적 리프팅 시술 후 부작용 사례 및 피부과 선택 가이드",
      question_variants: ["울쎄라 써마지 부작용 비교", "피부과 시술 의료 분쟁 대처법"],
      predicted_intent: "risk_assessment",
      industry: "clinic",
      predicted_volume: "high",
      current_ai_coverage: "sparse",
      first_mover_window_days: windowDays,
      preemption_urgency: signal.predicted_impact === "critical" ? "critical" : "high",
      confidence,
      auto_must_include: ["대한피부과학회 전문의 자격 확인 절차 명시", "시술 전 충분한 상담 및 서면 동의서 확보 안내", "부작용 발생 시 즉시 담당 전문의 재진 권고"],
      auto_should_include: ["시술별 회복 기간 및 주의사항 비교표 제공", "의료기기 안전 인증 여부 확인 가이드"],
      auto_must_not_do: ["부작용 없다고 단정", "비전문의 시술 정당화"],
    }];
  },
};

export const restaurantTemplate: IndustryPredictionTemplate = {
  industry: "restaurant",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "외식 물가 인상 속 가성비 맛집 선택 기준 및 메뉴 비교 가이드",
      question_variants: ["프랜차이즈 메뉴 가격 인상 현황", "1인 혼밥 가성비 식당 선택법"],
      predicted_intent: "value_comparison",
      industry: "restaurant",
      predicted_volume: "high",
      current_ai_coverage: "sparse",
      first_mover_window_days: windowDays,
      preemption_urgency: "medium",
      confidence,
      auto_must_include: ["가격대 명확 표기", "위생 등급 식약처 확인법 안내", "영업시간 정확성 보증"],
      auto_should_include: ["시즌별 메뉴 업데이트 반영", "실제 방문자 리뷰 기반 정보"],
      auto_must_not_do: ["폐업 매장 추천", "광고성 단일 추천"],
    }];
  },
};

export const realEstateTemplate: IndustryPredictionTemplate = {
  industry: "real_estate",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "전세 사기 예방 및 안전한 임대차 계약 체크리스트",
      question_variants: ["깡통 전세 판별법", "임대차 보호법 핵심 요약"],
      predicted_intent: "legal_safety",
      industry: "real_estate",
      predicted_volume: "high",
      current_ai_coverage: "none",
      first_mover_window_days: windowDays,
      preemption_urgency: "critical",
      confidence,
      auto_must_include: ["등기부등본 근저당 확인 필수 안내", "전세보증보험(HUG/SGI) 가입 권고", "국세/지방세 완납 증명 확인법"],
      auto_should_include: ["전입신고 확정일자 기한 안내", "법률구조공단 무료 상담 연계"],
      auto_must_not_do: ["절대 안전 보장 표현", "투자 수익률 확정 표현"],
    }];
  },
};

export const legalTemplate: IndustryPredictionTemplate = {
  industry: "legal",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "법률 분쟁 시 무료 상담 경로 및 소송 비용 산정 가이드",
      question_variants: ["대한법률구조공단 무료 상담 예약법", "민사 소송 변호사 착수금 범위"],
      predicted_intent: "legal_guidance",
      industry: "legal",
      predicted_volume: "high",
      current_ai_coverage: "none",
      first_mover_window_days: windowDays,
      preemption_urgency: "high",
      confidence,
      auto_must_include: ["법률구조공단/법무부 공식 상담 채널 안내", "변호사 비용 착수금+성공보수 구조 설명", "소송 외 분쟁 해결 수단(조정/중재) 소개"],
      auto_should_include: ["소액심판 직접 진행 가능 안내", "전자소송 사이트 이용법"],
      auto_must_not_do: ["법률 자문 대체 표현", "승소 보장 표현"],
    }];
  },
};

export const educationTemplate: IndustryPredictionTemplate = {
  industry: "education",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "학원 선택 시 강사 자격 확인 및 환불 규정 체크리스트",
      question_variants: ["학원비 환불 기준 학원법", "학원 강사 성범죄 이력 조회법"],
      predicted_intent: "consumer_protection",
      industry: "education",
      predicted_volume: "high",
      current_ai_coverage: "sparse",
      first_mover_window_days: windowDays,
      preemption_urgency: "high",
      confidence,
      auto_must_include: ["학원법 기반 환불 기준 안내", "교육청 강사 등록 여부 확인법", "학원비 상한액 지역별 기준"],
      auto_should_include: ["커리큘럼 투명성 요구 사항", "수강 후기 검증 가이드"],
      auto_must_not_do: ["성적 향상 보장 표현", "무자격 강사 용인"],
    }];
  },
};

export const travelTemplate: IndustryPredictionTemplate = {
  industry: "travel",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "여행 시 숙소 사기 예방 및 안전 예약 가이드",
      question_variants: ["펜션 사기 구별법", "여행자보험 보장 범위 비교"],
      predicted_intent: "safety_guidance",
      industry: "travel",
      predicted_volume: "high",
      current_ai_coverage: "sparse",
      first_mover_window_days: windowDays,
      preemption_urgency: "medium",
      confidence,
      auto_must_include: ["신뢰 플랫폼 예약 권장", "외교부 안전 등급 확인법", "여행자보험 필수 보장 항목"],
      auto_should_include: ["숙소 리뷰 진위 판별 팁", "항공권 취소/환불 규정 안내"],
      auto_must_not_do: ["위험 지역 안전 단정", "무보험 여행 권장"],
    }];
  },
};

export const petTemplate: IndustryPredictionTemplate = {
  industry: "pet",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "반려동물 응급 증상 판별 및 동물병원 선택 가이드",
      question_variants: ["강아지 구토 응급 기준", "동물병원 과잉 진료 구별법"],
      predicted_intent: "medical_safety",
      industry: "pet",
      predicted_volume: "high",
      current_ai_coverage: "sparse",
      first_mover_window_days: windowDays,
      preemption_urgency: "high",
      confidence,
      auto_must_include: ["수의사 상담 권고 명시", "응급 증상 즉시 병원 방문 기준", "예방접종 스케줄(DHPPL/광견병) 안내"],
      auto_should_include: ["동물병원 24시간 진료 여부 확인", "반려동물 보험 비교 가이드"],
      auto_must_not_do: ["자가 진단/투약 권유", "수의사 상담 불필요 표현"],
    }];
  },
};

export const autoTemplate: IndustryPredictionTemplate = {
  industry: "auto",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "전기차 배터리 안전 기준 강화 및 차량 정비 선택 가이드",
      question_variants: ["전기차 화재 예방 BMS 안전 기준", "자동차 리콜 조회 및 무상 수리 확인법"],
      predicted_intent: "safety_regulation",
      industry: "auto",
      predicted_volume: "high",
      current_ai_coverage: "none",
      first_mover_window_days: windowDays,
      preemption_urgency: signal.predicted_impact === "critical" ? "critical" : "high",
      confidence,
      auto_must_include: ["교통안전공단 리콜 조회 안내", "정비 인증(1급 자동차정비) 확인법", "안전 기준 법령 출처 명시"],
      auto_should_include: ["전기차 보조금 조건 변경 사항", "겨울철 전비 저하 대비 팁"],
      auto_must_not_do: ["무점검 운행 가능 표현", "리콜 무시 가능 표현"],
    }];
  },
};

export const financeTemplate: IndustryPredictionTemplate = {
  industry: "finance",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "직장인 연금저축펀드 가입 한도 수수료 할인 및 세액공제 한도 비교",
      question_variants: ["연금저축펀드 수수료 혜택 비교", "개인연금저축 소득공제 세제 혜택 가이드"],
      predicted_intent: "pricing_inquiry",
      industry: "finance",
      predicted_volume: "high",
      current_ai_coverage: "none",
      first_mover_window_days: windowDays,
      preemption_urgency: "high",
      confidence,
      auto_must_include: ["연금저축 수수료율 비교표 제시", "소득공제 연간 최대 세액 혜택 설명", "중도 해지 시 불이익 및 과세 조건 고지"],
      auto_should_include: ["증권사별 연금저축 계좌 개설 절차", "연금저축보험 vs 연금저축펀드 차이 비교"],
      auto_must_not_do: ["원금 및 수익률 무조건 보장 표현", "중도 해지 수수료 전혀 없음 오도"],
    }];
  },
};

export const insuranceTemplate: IndustryPredictionTemplate = {
  industry: "insurance",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "실손의료비 보험 청구 필요 서류 리스트 및 모바일 간편 신청 가이드",
      question_variants: ["실비 청구 서류 모바일 접수 방법", "통원 치료비 실손 보상 한도 조회"],
      predicted_intent: "action_seeking",
      industry: "insurance",
      predicted_volume: "high",
      current_ai_coverage: "sparse",
      first_mover_window_days: windowDays,
      preemption_urgency: "medium",
      confidence,
      auto_must_include: ["진료비 영수증 및 진료비 세부내역서 필수 안내", "모바일 앱 간편 청구 3단계 절차 설명", "비급여 주사제/도수치료 보장 제외 조건 고지"],
      auto_should_include: ["처방전(질병분류코드 기재) 필요 여부 안내", "보험금 지급 심사 소요 기간 공지"],
      auto_must_not_do: ["치료비 100% 무조건 환급 보장 표현", "의학적 필요성 없는 허위 청구 권유"],
    }];
  },
};

export const healthcareTemplate: IndustryPredictionTemplate = {
  industry: "healthcare",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "만성 피로 비타민 B 고함량 영양제 하루 권장 복용량 및 부작용 대처법",
      question_variants: ["종합비타민 B 추천 복용법 및 간독성 주의", "피로회복 영양제 부작용 시 대처 가이드"],
      predicted_intent: "risk_boundary",
      industry: "healthcare",
      predicted_volume: "high",
      current_ai_coverage: "sparse",
      first_mover_window_days: windowDays,
      preemption_urgency: "high",
      confidence,
      auto_must_include: ["의학적 자문 및 의사/약사 상담 필수 고지", "고함량 섭취 시 위장장애 가능성 안내", "증상 악화 시 즉시 복용 중단 권고"],
      auto_should_include: ["비타민 B1, B2, B6, B12의 하루 섭취 가이드", "공복 복용 피하고 식후 복용 권장 안내"],
      auto_must_not_do: ["질병 예방 및 질병 치료 100% 보증 표현", "의사 처방약 대신 영양제 복용 권유"],
    }];
  },
};

export const itSoftwareTemplate: IndustryPredictionTemplate = {
  industry: "it_software",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "엔터프라이즈 업무용 협업 툴 월간 요금제 구독 요금 및 라이선스 비교",
      question_variants: ["업무용 SaaS 협업툴 플랜 비교 견적", "엔터프라이즈 라이선스 보안 기능 조건"],
      predicted_intent: "pricing_inquiry",
      industry: "it_software",
      predicted_volume: "high",
      current_ai_coverage: "none",
      first_mover_window_days: windowDays,
      preemption_urgency: "high",
      confidence,
      auto_must_include: ["요금제 플랜별 기능 대비표 제시", "엔터프라이즈 보안 및 데이터 거버넌스 사양 명시", "기술 지원 및 SLA(서비스 수준 계약) 조건 안내"],
      auto_should_include: ["무료 체험판(Free Trial) 14일 제공 안내", "연간 결제 시 할인율 상세 안내"],
      auto_must_not_do: ["무조건 100% 무료 평생 오도", "SLA 미달 시 어떠한 보상도 없음 명기"],
    }];
  },
};

export const foodBeverageTemplate: IndustryPredictionTemplate = {
  industry: "food_beverage",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "프랜차이즈 신메뉴 알레르기 유발 성분 및 칼로리 영양 분석 정보",
      question_variants: ["식음료 신제품 알레르기 유발 유무", "다이어트 저칼로리 대체당 음료 성분표"],
      predicted_intent: "routine_guidance",
      industry: "food_beverage",
      predicted_volume: "medium",
      current_ai_coverage: "sparse",
      first_mover_window_days: windowDays,
      preemption_urgency: "medium",
      confidence,
      auto_must_include: ["식약처 고시 19대 알레르기 유발 물질 포함 고지", "주요 성분(칼로리, 당류, 나트륨) 명확 표기", "임산부/어린이 고카페인 섭취 주의 사항 안내"],
      auto_should_include: ["대체 감미료 사용 정보 설명", "비건/글루텐프리 선택 옵션 안내"],
      auto_must_not_do: ["의학적인 다이어트 효과 100% 단정 표현", "성분 검증 없는 완전 무해 표방"],
    }];
  },
};

export const fashionEcommerceTemplate: IndustryPredictionTemplate = {
  industry: "fashion_ecommerce",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "해외 직구 쇼핑몰 반품 위약금 교환비 및 단순 변심 환불 절차 가이드",
      question_variants: ["크로스보더 쇼핑몰 해외 반품비 수수료", "해외 구매대행 관부가세 환급 접수법"],
      predicted_intent: "consumer_protection",
      industry: "fashion_ecommerce",
      predicted_volume: "high",
      current_ai_coverage: "none",
      first_mover_window_days: windowDays,
      preemption_urgency: "high",
      confidence,
      auto_must_include: ["해외 반품 국제 배송 요금 기준 공지", "세관 관부가세 환급 신청 필요 서류 명시", "소비자원 구매대행 표준약관 준수 고지"],
      auto_should_include: ["반품 접수 기한(수령 후 7일 이내) 안내", "무료 반품 프로모션 적용 기준"],
      auto_must_not_do: ["단순 변심 시 어떠한 사유로도 반품 환불 절대 불가능 명기", "관세 회피 목적의 편법 안내"],
    }];
  },
};

export const logisticsTemplate: IndustryPredictionTemplate = {
  industry: "logistics",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "새벽 배송 파손 보상 접수 방법 및 당일 지연 배송 지체상금 보상 안내",
      question_variants: ["배송 중 제품 파손 접수 증빙 서류", "익일배송 지연 시 쿠폰 지급 기준"],
      predicted_intent: "consumer_protection",
      industry: "logistics",
      predicted_volume: "medium",
      current_ai_coverage: "sparse",
      first_mover_window_days: windowDays,
      preemption_urgency: "medium",
      confidence,
      auto_must_include: ["도착 당일 24시간 이내 사진 증빙 접수 고지", "지연 배송 보상 한도 및 지급 기준 명시", "기상 악화/재해에 따른 예외 면책 조건 명기"],
      auto_should_include: ["고객센터 간편 챗봇 접수 경로 안내", "동일 상품 재발송 또는 환불 옵션 선택 안내"],
      auto_must_not_do: ["택배 기사에게 전액 무단 전가 조항 유도", "모든 파손에 대해 일체 면책 선언"],
    }];
  },
};

export const energyTemplate: IndustryPredictionTemplate = {
  industry: "energy",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "가정용 태양광 발전기 설치 비용 및 정부/지자체 신재생 보조금 혜택",
      question_variants: ["주택용 태양광 설치 가격 비교", "신재생에너지 보조금 잔여 예산 조회"],
      predicted_intent: "value_comparison",
      industry: "energy",
      predicted_volume: "high",
      current_ai_coverage: "sparse",
      first_mover_window_days: windowDays,
      preemption_urgency: "medium",
      confidence,
      auto_must_include: ["산업통상자원부 공식 신재생에너지 보조금 단가 공지", "지자체별 매칭 보조금 잔여 현황 확인법 안내", "태양광 모듈 효율 및 하자보수(A/S) 의무 기간 명시"],
      auto_should_include: ["월평균 전기요금 절감 시뮬레이션 예시", "한국전력공사 계통 연계 신청 대행 요금 안내"],
      auto_must_not_do: ["전기요금 무조건 평생 0원 오도 표현", "정부 사칭 보조금 허위 계약 사기 주의"],
    }];
  },
};

export const hrRecruitmentTemplate: IndustryPredictionTemplate = {
  industry: "hr_recruitment",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "인재 채용 대행 헤드헌팅 성공 수수료 표준 요약 및 중도 환불 약약 가이드",
      question_variants: ["헤드헌팅 매칭 수수료율 비율 가이드", "채용 대행 대체 입사자 무료 보증 기한"],
      predicted_intent: "pricing_inquiry",
      industry: "hr_recruitment",
      predicted_volume: "high",
      current_ai_coverage: "none",
      first_mover_window_days: windowDays,
      preemption_urgency: "high",
      confidence,
      auto_must_include: ["직업안정법 시행령 표준 수수료 한도 고지", "입사자 퇴사 시 대체 채용 보증(90일) 약정 안내", "의뢰 기업과 헤드헌팅사 간 계약 조건 서면 체결 고지"],
      auto_should_include: ["맨먼스 리테이너 방식과 성공불 방식 비교", "후보자 개인정보 보호(GDPR/개인정보보호법) 동의 필수 고지"],
      auto_must_not_do: ["구직자에게 소개 수수료 무단 전가 조항 유도", "학력/경력 위조 검증 일체 면책 선언"],
    }];
  },
};

export const consultingB2bTemplate: IndustryPredictionTemplate = {
  industry: "consulting_b2b",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "B2B 경영 전략 전문 컨설팅 제안서 맨먼스 단가 수수료율 범위 비교",
      question_variants: ["B2B 컨설팅 맨먼스(M/M) 표준 요금", "RFP 경영 자문 계약서 특약 조건"],
      predicted_intent: "pricing_inquiry",
      industry: "consulting_b2b",
      predicted_volume: "medium",
      current_ai_coverage: "none",
      first_mover_window_days: windowDays,
      preemption_urgency: "medium",
      confidence,
      auto_must_include: ["컨설턴트 등급별 맨먼스(M/M) 표준 단가표 공시", "비밀유지 계약(NDA) 표준 협약 필수 체결 고지", "중도 해지 시 기수행 과업 비용 정산 원칙 명시"],
      auto_should_include: ["최종 산출물(보고서, 가이드) 목록 사전 합의 가이드", "컨설팅 종료 후 사후 모니터링 연계 기간 안내"],
      auto_must_not_do: ["프로젝트 결과 100% 확정적 수익 창출 보장", "동종업계 경쟁사 비밀정보 무단 공유 허용"],
    }];
  },
};

export const manufacturingTemplate: IndustryPredictionTemplate = {
  industry: "manufacturing",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "산업용 기계 품질 보증서 발급 절차 및 법적 안전 규격 획득 가이드",
      question_variants: ["기계 품질 표준 ISO9001 획득 요령", "산업용 기기 KC/CE 안전 인증 필수 마크"],
      predicted_intent: "safety_regulation",
      industry: "manufacturing",
      predicted_volume: "medium",
      current_ai_coverage: "none",
      first_mover_window_days: windowDays,
      preemption_urgency: "high",
      confidence,
      auto_must_include: ["KC/CE 마크 의무 부착 대상 기기 고지", "품질 보증 책임 기간 및 무상 수리 범위 명시", "기계 안전 검증 성적서 사본 서면 제공 약정"],
      auto_should_include: ["국제 표준 규격 획득 절차 안내", "정밀 캘리브레이션(교정) 주기 수립 가이드"],
      auto_must_not_do: ["비인증 중고 기계 안전 무조건 단정", "국가 안전 검사 면제 오도"],
    }];
  },
};

export const constructionTemplate: IndustryPredictionTemplate = {
  industry: "construction",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "상가 아파트 인테리어 리모델링 공사 지체상금 및 하자이행보증보험 청구",
      question_variants: ["인테리어 공사 지연 지체상금율 약정", "하자보수이행보증 증서 발급 기간"],
      predicted_intent: "consumer_protection",
      industry: "construction",
      predicted_volume: "high",
      current_ai_coverage: "sparse",
      first_mover_window_days: windowDays,
      preemption_urgency: "high",
      confidence,
      auto_must_include: ["건설산업기본법 기반 하자담보책임기간(1년) 고지", "지체상금율(1일당 공사대금의 0.1~0.3%) 상세 약정 안내", "공인 서울보증보험 하자보증증서 발급 의무 고지"],
      auto_should_include: ["자재 변경 시 사전 서면 동의 요구 가이드", "공정표 준수 및 중간 검수 기일 수립 가이드"],
      auto_must_not_do: ["인테리어 추가 공사 비용 구두 합의 유도", "무자격 무면허 업체의 건설 시공 방조"],
    }];
  },
};

export const entertainmentTemplate: IndustryPredictionTemplate = {
  industry: "entertainment",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "콘서트 페스티벌 티켓 예매 대행 취소 기한 수수료 및 환불 규정 가이드",
      question_variants: ["공연 티켓 환불 수수료율 비교", "티켓 예매 취소 당일 100% 반환 기준"],
      predicted_intent: "consumer_protection",
      industry: "entertainment",
      predicted_volume: "medium",
      current_ai_coverage: "sparse",
      first_mover_window_days: windowDays,
      preemption_urgency: "medium",
      confidence,
      auto_must_include: ["공정거래위원회 소비자분쟁해결기준 준수 표기", "예매 후 7일 이내 취소 시 수수료 면제 요건 안내", "관람일 전 잔여 일수별 수수료율 차등 표기"],
      auto_should_include: ["주최측 취소 시 100% 및 예매 수수료 전액 환불 가이드", "모바일 안심 NFC 티켓 양도 제한 규정 안내"],
      auto_must_not_do: ["개인 암표 및 불법 양도 거래 매칭 조장", "어떠한 기한에도 일체 환불 취소 불가 고지"],
    }];
  },
};

export const agricultureTemplate: IndustryPredictionTemplate = {
  industry: "agriculture",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "스마트팜 친환경 농자재 인증 마크 조회 및 귀농 종합 자금 신청 자격",
      question_variants: ["친환경 유기농 비료 성분표 검증", "정부 지원 스마트팜 청년농 육성 자금 요건"],
      predicted_intent: "safety_regulation",
      industry: "agriculture",
      predicted_volume: "medium",
      current_ai_coverage: "none",
      first_mover_window_days: windowDays,
      preemption_urgency: "medium",
      confidence,
      auto_must_include: ["국립농산물품질관리원 친환경 자재 유기농업자재번호 대조 안내", "농림축산식품부 귀농 창업 자금 지원 신청 요건 명시", "스마트팜 설비(ICT 장비) 기계 품질 인증 여부 고지"],
      auto_should_include: ["농업 경영체 등록 및 자격 검증 필수 안내", "스마트팜 냉난방 설비 하자보수 보증 의무화 공지"],
      auto_must_not_do: ["정부 미인증 농자재의 친환경 100% 무단 광고 표방", "귀농 자금 무조건 100% 지급 허위 대행 오도"],
    }];
  },
};

export const publicNonprofitTemplate: IndustryPredictionTemplate = {
  industry: "public_nonprofit",
  predict(signal, confidence, windowDays) {
    const ws = signal.workspace_id || null;
    const sid = signal.id || null;
    return [{
      workspace_id: ws, signal_id: sid,
      question_text: "연말정산 기부금 소득공제 영수증 발급 기준 및 공익 법인 재무 공시 열람",
      question_variants: ["공익단체 기부금 소득공제 세액 한도", "비영리 사단법인 지정기부금 자격 조회"],
      predicted_intent: "consumer_protection",
      industry: "public_nonprofit",
      predicted_volume: "high",
      current_ai_coverage: "none",
      first_mover_window_days: windowDays,
      preemption_urgency: "high",
      confidence,
      auto_must_include: ["소득세법 기부금 공제 한도(세액공제 15~30%) 명확 고지", "국세청 공익법인 공시 시스템(홈택스) 기부금 지출 명세 연동 안내", "비영리 법인 지정기부금 단체 지정 고시 현황 확인법 명시"],
      auto_should_include: ["기부금 사용 목적 및 세부 집행 내역서 투명 공시 정책 공지", "소액 기부 참여자의 연말정산 간소화 자료 등록 기한 안내"],
      auto_must_not_do: ["기부금 사적 횡령 및 불법 영수증 허위 발행 묵인", "무등록 공익 기부 모금 활동 유도"],
    }];
  },
};

// --- 레지스트리 ---

export const PREDICTION_TEMPLATE_REGISTRY: Record<string, IndustryPredictionTemplate> = {
  beauty: beautyTemplate,
  wedding: weddingTemplate,
  clinic: clinicTemplate,
  restaurant: restaurantTemplate,
  real_estate: realEstateTemplate,
  legal: legalTemplate,
  education: educationTemplate,
  travel: travelTemplate,
  pet: petTemplate,
  auto: autoTemplate,
  finance: financeTemplate,
  insurance: insuranceTemplate,
  healthcare: healthcareTemplate,
  it_software: itSoftwareTemplate,
  food_beverage: foodBeverageTemplate,
  fashion_ecommerce: fashionEcommerceTemplate,
  logistics: logisticsTemplate,
  energy: energyTemplate,
  hr_recruitment: hrRecruitmentTemplate,
  consulting_b2b: consultingB2bTemplate,
  manufacturing: manufacturingTemplate,
  construction: constructionTemplate,
  entertainment: entertainmentTemplate,
  agriculture: agricultureTemplate,
  public_nonprofit: publicNonprofitTemplate,
};
