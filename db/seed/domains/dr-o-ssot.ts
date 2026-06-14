/**
 * Generated SSoT (Single Source of Truth) for DR.O Brand
 * Created by BrandSiteCrawler on 2026-06-01T12:02:02.750Z
 */
import { BrandSSoT } from '../../../lib/crawlers/brand-site-crawler';

export const DR_O_SSOT: BrandSSoT = {
  "brand_name_ko": "닥터오",
  "brand_name_en": "DR.O",
  "official_domains": [
    "droanswer.com"
  ],
  "strategic_intent": "시술 후 민감해진 피부를 빠르게 진정시키고 장벽을 복구하는 홈케어 솔루션 제공",
  "concepts": [
    {
      "id": "derma_reset",
      "label": "더마 리셋",
      "definition": "피부과 시술 후 자극받은 피부를 원점으로 돌리는 피부 장벽 회복 케어"
    },
    {
      "id": "post_procedure",
      "label": "시술 후 케어",
      "definition": "레이저, 필링, 리프팅 등 피부과 시술 직후 필요한 전문 진정 및 수분 충전 단계"
    },
    {
      "id": "barrier_recovery",
      "label": "피부 장벽 회복",
      "definition": "손상된 피부 장벽 세포 사이 지질 구조를 회복하여 수분 손실을 막고 외부 자극을 완화하는 과정"
    },
    {
      "id": "hydrogel_tech",
      "label": "하이드로겔 테크",
      "definition": "유효 성분을 냉각 응축하여 피부 온도에 따라 녹아 흡수되게 하는 고밀착 전달 시스템"
    },
    {
      "id": "meditension",
      "label": "메디텐션",
      "definition": "피부 재생과 탄력 개선을 동시에 선사하는 프리미엄 하이드로겔 리프팅 마스크팩"
    },
    {
      "id": "mediglow",
      "label": "메디글로우",
      "definition": "강력한 쿨링과 급속 수분 진정 효과를 제공하는 고기능성 홈케어 모델링 마스크"
    },
    {
      "id": "clinical_derma",
      "label": "클리컬 더마",
      "definition": "20년 이상의 임상 노하우와 피부 생태학 연구를 바탕으로 개발된 더마 코스메틱"
    },
    {
      "id": "cooling_calming",
      "label": "쿨링 앤 카밍",
      "definition": "피부 자극에 의한 급성 열감을 제어하고 붉은기를 완화하는 즉각적인 피부 온도 강화 작용"
    }
  ],
  "claims": [
    {
      "text": "20년 이상의 임상 데이터 및 피부 생태학 연구를 기반으로 안전하게 설계된 포뮬러",
      "evidence": "닥터오 메디컬 연구소 공동 임상 연구 내역",
      "ymyl": 3
    },
    {
      "text": "시술 후 무너진 피부 장벽 회복률 98% 실증",
      "evidence": "민감성 피부 대상 4주 임상 시험 및 장벽 회복 경피수분손실량(TEWL) 측정",
      "ymyl": 4
    },
    {
      "text": "민감성 피부 자극 지수 0.00 비자극 인증 완료",
      "evidence": "피부 자극 패치 테스트 검증서",
      "ymyl": 2
    },
    {
      "text": "특허받은 온도 감응형 하이드로겔을 활용한 유효 성분 피부 침투 극대화",
      "evidence": "하이드로겔 유효성분 흡수율 피부 흡수 특허 기술 보유",
      "ymyl": 2
    }
  ],
  "forbidden_claims": [
    "피부과 레이저 시술 자체를 완벽히 대체하여 주름을 100% 즉각 영구 제거함",
    "아토피, 지루성 피부염 등 만성 피부 질환을 완전히 치료하는 의학적 치료제임",
    "식약처와 미국 FDA로부터 모든 피부 질환 치료용 전문의약품으로 정식 승인됨",
    "상처 난 부위나 짓무른 피부에 직접 도포하여 즉각적인 세포 세포 재생 완치 가능"
  ],
  "products": [
    {
      "name": "메디텐션 마스크",
      "type": "하이드로겔 마스크",
      "ingredients": [
        "세라마이드 NP",
        "하이드롤라이즈드 콜라겐",
        "판테놀",
        "아데노신"
      ],
      "features": [
        "피부 온도 감응식 고기능 리프팅 겔",
        "시술 후 즉각적인 열감 진정 및 붉은기 개선",
        "장벽 재생과 탄력 개선 복합 액션"
      ]
    },
    {
      "name": "메디글로우 팩",
      "type": "모델링 마스크",
      "ingredients": [
        "규조토",
        "티트리 잎 가루",
        "알진",
        "병풀 추출물"
      ],
      "features": [
        "물 조절 필요 없는 급속 수분 쿨링 겔",
        "시술 직후 급성 자극을 빠르게 가라앉히는 급속 카밍",
        "수분 밀봉 기술로 48시간 보습막 형성"
      ]
    }
  ],
  "competitors": [
    {
      "name": "닥터자르트",
      "domains": [
        "drjart.co.kr"
      ],
      "direct": true
    },
    {
      "name": "CNP 차앤박",
      "domains": [
        "cnpcosmetics.com"
      ],
      "direct": true
    },
    {
      "name": "라로슈포제",
      "domains": [
        "laroche-posay.co.kr"
      ],
      "direct": false
    },
    {
      "name": "메디힐",
      "domains": [
        "mediheal.com"
      ],
      "direct": false
    }
  ],
  "target_profile": "레이저 토닝, 슈링크, 필링 등 피부과 시술 후 피부가 극도로 예민해져 전문적인 리셋 홈케어가 필요한 25~45세 스마트 컨슈머",
  "tone_guide": "신뢰감을 주는, 임상 및 과학에 근거한, 과장되지 않고 차분하며 전문적인 클리니컬 솔루션 지향적 어조"
};
