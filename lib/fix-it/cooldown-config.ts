/**
 * lib/fix-it/cooldown-config.ts
 *
 * 업종별 쿨다운 기간 설정 + 산출 로직.
 *
 * 공식:
 *   cooldown_days = clamp(
 *     base_cooldown × patch_type_weight × content_volume_factor,
 *     min_cooldown,
 *     max_cooldown
 *   )
 */

import type { IndustryKey, CooldownConfig, PatchType } from './types';

// ─────────────────────────────────────────
// 업종별 기본 설정
// ─────────────────────────────────────────
export const COOLDOWN_CONFIGS: Record<IndustryKey, CooldownConfig> = {
  skincare: {
    industry: 'skincare',
    base_cooldown_days: 10,
    min_cooldown_days: 7,
    max_cooldown_days: 14,
    description: '스킨케어/K-Beauty: 성분·효능 콘텐츠는 AI 학습 우선순위 높음. YMYL 패치 시 14일 연장.',
  },
  wedding: {
    industry: 'wedding',
    base_cooldown_days: 14,
    min_cooldown_days: 10,
    max_cooldown_days: 21,
    description: '웨딩: 시즌성 높음, 가격/패키지 변동 잦음. 시즌 내 패치는 10일 단축.',
  },
  medical: {
    industry: 'medical',
    base_cooldown_days: 21,
    min_cooldown_days: 14,
    max_cooldown_days: 30,
    description: '의료/클리닉: YMYL 최고 등급. 규제 변경 시 30일까지 연장.',
  },
  convenience: {
    industry: 'convenience',
    base_cooldown_days: 7,
    min_cooldown_days: 5,
    max_cooldown_days: 10,
    description: '편의점/리테일: 프로모션/이벤트 기반, 빠른 콘텐츠 갱신. 프로모션 종료 전 패치는 5일.',
  },
  real_estate: {
    industry: 'real_estate',
    base_cooldown_days: 14,
    min_cooldown_days: 10,
    max_cooldown_days: 21,
    description: '부동산: 시세 데이터 갱신 주기 고려. 법률 변경 시 21일.',
  },
  finance: {
    industry: 'finance',
    base_cooldown_days: 21,
    min_cooldown_days: 14,
    max_cooldown_days: 30,
    description: '금융/보험: YMYL 고등급. 상품 변경 심사 주기. 약관 변경 시 30일.',
  },
  legal: {
    industry: 'legal',
    base_cooldown_days: 28,
    min_cooldown_days: 21,
    max_cooldown_days: 35,
    description: '법률: 판례/법령 변경 반영 최장 주기.',
  },
  education: {
    industry: 'education',
    base_cooldown_days: 14,
    min_cooldown_days: 10,
    max_cooldown_days: 21,
    description: '교육: 커리큘럼 변경 주기. 시험 시즌 전 패치는 10일.',
  },
  fnb: {
    industry: 'fnb',
    base_cooldown_days: 7,
    min_cooldown_days: 5,
    max_cooldown_days: 10,
    description: 'F&B/외식: 메뉴 변경 빈번, 빠른 반영.',
  },
  default: {
    industry: 'default',
    base_cooldown_days: 14,
    min_cooldown_days: 7,
    max_cooldown_days: 21,
    description: '기본 쿨다운 (업종 미지정)',
  },
};

// ─────────────────────────────────────────
// 패치 유형별 승수
// ─────────────────────────────────────────
export const PATCH_TYPE_WEIGHTS: Record<PatchType, number> = {
  ssot_update:          1.0,  // 표준
  answer_card_create:   1.2,  // 신규 페이지 인덱싱 대기
  answer_card_update:   1.0,  // 표준
  boundary_rule_add:    0.8,  // 삭제/차단은 빠르게 반영
  schema_markup_fix:    1.5,  // 구조화 데이터 반영은 느림
  expected_layer_update:1.0,  // 표준
  content_restructure:  1.5,  // 전체 재크롤 필요
};

// ─────────────────────────────────────────
// 쿨다운 산출 함수
// ─────────────────────────────────────────

/**
 * 업종 + 패치 유형 + 콘텐츠 규모 보정으로 쿨다운 일수를 계산합니다.
 *
 * @param industry           업종 키
 * @param patchType          패치 유형
 * @param contentVolumeFactor 콘텐츠 규모 보정 (기본 1.0, 대형 사이트는 1.2 등)
 * @returns 쿨다운 일수 (정수)
 */
export function calcCooldownDays(
  industry: IndustryKey,
  patchType: PatchType,
  contentVolumeFactor = 1.0,
): number {
  const config = COOLDOWN_CONFIGS[industry] ?? COOLDOWN_CONFIGS.default;
  const patchWeight = PATCH_TYPE_WEIGHTS[patchType] ?? 1.0;

  const raw = config.base_cooldown_days * patchWeight * contentVolumeFactor;
  const clamped = Math.max(config.min_cooldown_days, Math.min(config.max_cooldown_days, raw));

  return Math.round(clamped);
}

/**
 * 쿨다운 종료 시각을 계산합니다.
 *
 * @param patchAppliedAt 패치 적용 시각 (ISO 문자열)
 * @param cooldownDays   쿨다운 일수
 * @returns 리테스트 실행 가능 시각 (ISO 문자열)
 */
export function calcRetestScheduledAt(patchAppliedAt: string, cooldownDays: number): string {
  const date = new Date(patchAppliedAt);
  date.setDate(date.getDate() + cooldownDays);
  return date.toISOString();
}

/**
 * 문자열 업종 키를 안전하게 IndustryKey로 변환합니다.
 */
export function resolveIndustryKey(raw: string | null | undefined): IndustryKey {
  if (!raw) return 'default';
  const lower = raw.toLowerCase().replace(/[^a-z_]/g, '_');
  return (lower in COOLDOWN_CONFIGS ? lower : 'default') as IndustryKey;
}
