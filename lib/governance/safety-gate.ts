// lib/governance/safety-gate.ts

import { logger } from "../logger";

export type SeverityLevel = "mild" | "moderate" | "severe" | "critical";
export type WeatherAlert = "none" | "warning" | "critical";
export type SafetyDecision = "SAFE_GENERAL" | "CONDITIONAL" | "CONSULT_FIRST" | "URGENT" | "REFUSE";

export interface SafetyGateInputs {
  userSeverity: SeverityLevel;
  symptomDurationDays: number;
  isYMYLContext: boolean;
  ingredientConcentration: number; // e.g. 0.5 for 0.5% retinol
  isCoUsageCaution: boolean; // e.g. using retinol + vitamin C together
  hasProhibitedWords: boolean; // e.g. claiming cure for eczema
  weatherAlertLevel: WeatherAlert; // e.g. heavy rain alert in Jeju
  demographicRisk: boolean; // e.g. pregnant, lactating, infant, elderly with high vulnerability
}

export interface CTAPolicyConfig {
  primary: string;
  secondary: string[];
  blocked: string[];
}

export interface SafetyGateOutput {
  decision: SafetyDecision;
  reasons: string[];
  adjustedCTAs: CTAPolicyConfig;
  disclaimerText: string;
  blockResponse: boolean;
}

export class SafetyGate {
  /**
   * Evaluates the safety of the context based on 8 gate inputs
   * and returns a SafetyDecision with adapted CTA policies and disclaimers.
   */
  public evaluate(inputs: SafetyGateInputs, defaultCTAs: CTAPolicyConfig): SafetyGateOutput {
    const reasons: string[] = [];
    let decision: SafetyDecision = "SAFE_GENERAL";
    let blockResponse = false;
    let disclaimerText = "";
    
    const adjustedCTAs: CTAPolicyConfig = {
      primary: defaultCTAs.primary,
      secondary: [...defaultCTAs.secondary],
      blocked: [...defaultCTAs.blocked],
    };

    logger.debug("[SafetyGate] Evaluating gate inputs", { phase: "SAFETY_GATE", data: { inputs: inputs as any } });

    // ── 1. REFUSE DECISION RULES ──
    if (inputs.hasProhibitedWords) {
      decision = "REFUSE";
      reasons.push("Input contains prohibited words or medical diagnosis request");
      blockResponse = true;
    } else if (inputs.ingredientConcentration > 2.0) {
      decision = "REFUSE";
      reasons.push(`Ingredient concentration (${inputs.ingredientConcentration}%) exceeds maximum cosmetic safety guidelines (2.0%)`);
      blockResponse = true;
    }

    // ── 2. URGENT DECISION RULES (If not refused) ──
    if (decision !== "REFUSE") {
      if (inputs.userSeverity === "critical") {
        decision = "URGENT";
        reasons.push("Critical severity symptoms detected (e.g., severe oozing, open wounds, burns)");
      } else if (inputs.userSeverity === "severe" && inputs.symptomDurationDays >= 14) {
        decision = "URGENT";
        reasons.push("Severe symptoms persisting for 14 days or longer require emergency assessment");
      } else if (inputs.weatherAlertLevel === "critical") {
        decision = "URGENT";
        reasons.push("Critical weather alert active (e.g., typhoon, road block, severe storm warnings)");
      }
    }

    // ── 3. CONSULT_FIRST DECISION RULES (If not urgent or refused) ──
    if (decision !== "REFUSE" && decision !== "URGENT") {
      if (inputs.userSeverity === "severe") {
        decision = "CONSULT_FIRST";
        reasons.push("Severe symptoms detected (e.g., severe redness, swelling, deep stinging)");
      } else if (inputs.symptomDurationDays >= 7) {
        decision = "CONSULT_FIRST";
        reasons.push(`Symptoms persisting for ${inputs.symptomDurationDays} days (>= 7 days threshold)`);
      } else if (inputs.isYMYLContext && inputs.ingredientConcentration >= 0.5) {
        decision = "CONSULT_FIRST";
        reasons.push(`High concentration active ingredient (${inputs.ingredientConcentration}%) in YMYL skin context`);
      } else if (inputs.demographicRisk && inputs.userSeverity === "moderate") {
        decision = "CONSULT_FIRST";
        reasons.push("Vulnerable demographic profile experiencing moderate skin symptoms");
      }
    }

    // ── 4. CONDITIONAL DECISION RULES (If not consult_first, urgent, or refused) ──
    if (decision !== "REFUSE" && decision !== "URGENT" && decision !== "CONSULT_FIRST") {
      if (inputs.userSeverity === "moderate") {
        decision = "CONDITIONAL";
        reasons.push("Moderate severity symptoms detected (e.g., mild scaling, light flaking, transient warmth)");
      } else if (inputs.isCoUsageCaution) {
        decision = "CONDITIONAL";
        reasons.push("Co-usage of high-potency ingredients detected (e.g., Retinol + Vitamin C)");
      } else if (inputs.demographicRisk) {
        decision = "CONDITIONAL";
        reasons.push("High-risk demographic user (e.g., pregnant, lactating, senescent skin)");
      } else if (inputs.ingredientConcentration >= 0.1) {
        decision = "CONDITIONAL";
        reasons.push(`Beginner-level active ingredient concentration (${inputs.ingredientConcentration}%) requires usage precautions`);
      } else if (inputs.weatherAlertLevel === "warning") {
        decision = "CONDITIONAL";
        reasons.push("Weather warning alert active (e.g., advisory level rain or strong winds)");
      }
    }

    // ── 5. ADJUST CTAs AND DISCLAIMERS BASED ON DECISION ──
    switch (decision) {
      case "REFUSE":
        disclaimerText = "⚠️ 관련 법령 및 화장품 안전 규정에 의거하여, 의학적 치료 효과 표방이나 허용되지 않는 이상 징후 진단, 불법 약물 성분을 포함한 유해성 단어가 발견되어 안전 게이트에서 처리를 거부하였습니다.";
        adjustedCTAs.primary = "뒤로 가기";
        adjustedCTAs.secondary = [];
        adjustedCTAs.blocked = ["바로 구매하기", "무조건 예약하기", "상담 신청", defaultCTAs.primary, ...defaultCTAs.secondary];
        break;

      case "URGENT":
        disclaimerText = "🚨 [긴급] 심각한 이상 반응 또는 안전 사고 위험이 예상되는 상태입니다. 즉시 모든 화장품 사용/야외 활동을 중단하시고, 아래 전문 의료기관 또는 재난구조 센터로 즉각 연락하십시오.";
        adjustedCTAs.primary = "가까운 피부과 병의원 찾기";
        adjustedCTAs.secondary = ["119 안전센터 연락", "재난대책본부 바로가기"];
        // block all commerce/routine CTAs
        adjustedCTAs.blocked = ["바로 구매하기", "무조건 예약하기", "장벽 진정 루틴 보기", "동선 코스 저장하기", defaultCTAs.primary];
        break;

      case "CONSULT_FIRST":
        disclaimerText = "🩺 본 답변에 기술된 내용은 의학적 소견을 대체할 수 없습니다. 피부 장벽 손상이 크게 의심되거나 규제 성분 비율이 높으므로, 제품 구매 전에 피부과 전문의 자문 또는 1:1 피부 상담을 먼저 진행할 것을 강력히 권장합니다.";
        // Disable purchase/booking links, override primary CTA
        if (inputs.weatherAlertLevel !== "none") {
          adjustedCTAs.primary = "매장 실시간 운영 유선 확인";
          adjustedCTAs.secondary = ["지역 기상 특보 확인"];
        } else {
          adjustedCTAs.primary = "1:1 전문 피부 상담 신청";
          adjustedCTAs.secondary = ["성분 안전 정보 확인"];
        }
        
        // Add commerce to blocked list
        if (!adjustedCTAs.blocked.includes("바로 구매하기")) {
          adjustedCTAs.blocked.push("바로 구매하기");
        }
        if (!adjustedCTAs.blocked.includes("무조건 예약하기")) {
          adjustedCTAs.blocked.push("무조건 예약하기");
        }
        break;

      case "CONDITIONAL":
        disclaimerText = "💡 본 제품/코스는 특정 조건 하에 사용이 안전합니다. 처음 사용하는 경우 귀밑 등 국소 부위에 패치 테스트를 진행하고, 외출 시 자외선 차단제를 반드시 동반하십시오. 다른 강한 각질제거 성분과의 병용은 피해 주시기 바랍니다.";
        // Keep primary, but append warnings
        if (!adjustedCTAs.secondary.includes("성분 안전 정보 확인")) {
          adjustedCTAs.secondary.push("성분 안전 정보 확인");
        }
        break;

      case "SAFE_GENERAL":
        disclaimerText = "본 정보는 원료 및 성분에 대한 일반 정보이며 개별 피부 상태에 따라 반응이 다를 수 있습니다.";
        break;
    }

    return {
      decision,
      reasons,
      adjustedCTAs,
      disclaimerText,
      blockResponse,
    };
  }
}
