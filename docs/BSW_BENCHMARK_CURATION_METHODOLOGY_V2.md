# BSW-OS 업종별 벤치마크 큐레이션 방법론 v2.0

> **Version:** 2.0 | **작성일:** 2026-06-26  
> **대상 모듈:** `lib/industry/reference-sites-registry.ts`

---

## 1. 파이프라인 총괄 (6단계)

```
Stage 0: 핵심 키워드 정의 (20개/업종)
Stage 1: 1차 풀 수집 (45+5 = 50 후보)
Stage 2: 매트릭스 필터링 (50 → 35)
Stage 3: Pre-Audit 기술 검증
Stage 4: 2D 태깅 + DB 적재
Stage 5: 벤치마크 프로필 생성
Stage 6: 품질 검증 + 반복
```

## 2. 슬롯 배분 (35개/업종)

| 슬롯 유형 | 할당 | 소스 |
|----------|------|------|
| Traffic Giant | 10 | SimilarWeb 트래픽 TOP |
| AEO Monster | 10 | AI 인용 빈도 크로스 검증 |
| Rising Star | 10 | 성장세/투자/버즈/기술 |
| Anchor Baseline | 5 | 미최적화 로컬/소규모 |

## 3. 2차원 태깅 시스템

- **tier** (자동): Pre-Audit AEPI 기반 → `excellent` / `average` / `poor`
- **tags** (수동): 큐레이터 태깅
  - 소스: `traffic_giant`, `aeo_monster`, `rising_star`, `anchor_poor`
  - 특성: `d2c_brand`, `content_leader`, `expert_persona`, `tech_leader`, `schema_rich`, `blog_strong`, `review_strong`, `local_seo`
  - 기술: `nextjs`, `pwa`, `ssr`, `spa`
  - 지역: `global`, `korea`

## 4. Wave 전략

| 파동 | 업종 | 상태 |
|------|------|------|
| **Wave 1** | skincare, wedding, medical_clinic, restaurant_cafe, hotel, place_brand | ✅ 시드 완료 |
| Wave 2 | fashion, hanbang, real_estate, fitness, expert_professional, entertainment, k_culture_content, hair_nail, consulting, startup | 예정 |
| Wave 3 | food_product, home_living, academy, auto_service, pet_care, senior_care, legal, finance_accounting, it_saas, online_education, travel_tourism, photography | 예정 |

## 5. 글로벌/한국 비율 (매크로별)

| 매크로 | 글로벌 | 한국 |
|--------|--------|------|
| ecommerce_d2c | 40% | 60% |
| local_services | 10% | 90% |
| ymyl_professional | 20% | 80% |
| b2b_tech_saas | 50% | 50% |
| media_content_hub | 30% | 70% |

## 6. 필터링 규칙

- **F1 도메인 단일성:** 플랫폼 입점몰 제외 (네이버 스마트스토어, 쿠팡 등)
- **F2 BM 동질성:** 순수 서비스/브랜드 사이트만 (언론사, 쇼핑몰 혼동 방지)
- **F3 중복 제거:** 동일 모기업 하위 브랜드 3개 이상 금지
- **F4 지역 비율:** 매크로별 글로벌/한국 비율 차등 적용

## 7. Wave 1 시드 현황

| 업종 | 사이트 수 | Excellent | Average | Poor |
|------|---------|-----------|---------|------|
| skincare | 25 | 12 | 9 | 4 |
| wedding | 16 | 7 | 6 | 3 |
| medical_clinic | 16 | 9 | 4 | 3 |
| restaurant_cafe | 13 | 7 | 4 | 2 |
| hotel | 13 | 7 | 4 | 2 |
| place_brand | 13 | 6 | 5 | 2 |
| **합계** | **96** | **48** | **32** | **16** |
