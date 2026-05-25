export type Locale = 'en' | 'ko';

export const i18nDict = {
  en: {
    dashboardTitle: "Brand Semantic Website OS Studio",
    meaningOps: "Brand MeaningOps Studio",
    websiteFactory: "Semantic Website Factory",
    observatory: "AI Answer Observatory",
    fixit: "Fix-It OS Closed Loop",
    releaseGate: "Release Gate Dashboard",
    claimsCount: "Verified Claims",
    activeQis: "Active QIS Scenes",
    readinessScore: "Observed AEO Readiness (ARS)",
    methodologyDisclosure: "Methodology Disclosure Enforced",
    vibeScore: "Vibe Match Alignment (VPA)",
    btnToggleLanguage: "한글 버전 전환",
    disclaimerCaveat: "Methodology Caveat Gate Active"
  },
  ko: {
    dashboardTitle: "브랜드 시맨틱 웹사이트 OS 스튜디오",
    meaningOps: "브랜드 미닝옵스(MeaningOps) 스튜디오",
    websiteFactory: "시맨틱 웹사이트 팩토리",
    observatory: "AI 답변 옵저버토리 (ARS 측정)",
    fixit: "픽스잇(Fix-It) OS 클로즈드 루프",
    releaseGate: "배포 릴리즈 게이트 대시보드",
    claimsCount: "검증 완료 브랜드 클레임 수",
    activeQis: "활성 QIS 검색 시나리오",
    readinessScore: "AI 검색 대비 상태 지표 (ARS)",
    methodologyDisclosure: "검증 방법론 및 프록시 고지 의무 통제 중",
    vibeScore: "브랜드 어조 정밀 일치도 (VPA)",
    btnToggleLanguage: "Switch to English",
    disclaimerCaveat: "프록시 고지 의무 준수 게이트 활성"
  }
};

/**
 * i18n Translation Helper.
 */
export function translate(locale: Locale, key: keyof typeof i18nDict['en']): string {
  return i18nDict[locale]?.[key] ?? i18nDict['en'][key] ?? String(key);
}
