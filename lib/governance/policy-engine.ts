// lib/governance/policy-engine.ts

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { logger } from "../logger";

export interface PolicyContext {
  vertical: string;
  userMessage: string;
  attemptedActions?: string[];
  hasCertificate?: boolean; // e.g. Jeju Cosmetic Cert
}

export interface PolicyEvaluation {
  isViolation: boolean;
  prohibitedTermsFound: string[];
  allowedActionsMatching: string[];
  blockedActionsFound: string[];
  escalationTriggered: boolean;
  escalationReasons: string[];
  boundaryNotes: string[];
  ctaPolicy: {
    primary: string;
    secondary: string[];
    blocked: string[];
  };
}

export class PolicyEngine {
  private packsDir: string;

  constructor(customPacksDir?: string) {
    // Resolve packs directory relative to process root or constructor override
    this.packsDir = customPacksDir || path.resolve(process.cwd(), "packs");
  }

  /**
   * Evaluates the current message and context against loaded vertical policies.
   */
  public evaluatePolicy(context: PolicyContext): PolicyEvaluation {
    const vertical = context.vertical;
    const userMessage = context.userMessage || "";
    const attemptedActions = context.attemptedActions || [];
    
    // 1. Load policies for the vertical
    const policyData = this.loadVerticalPolicies(vertical);
    const conceptsData = this.loadVerticalConcepts(vertical);

    const prohibitedTermsFound: string[] = [];
    const blockedActionsFound: string[] = [];
    const allowedActionsMatching: string[] = [];
    const escalationReasons: string[] = [];
    let escalationTriggered = false;

    // ── A. Evaluate Blocked Actions ──
    const blockedActions = policyData.blocked_actions || [];
    for (const action of attemptedActions) {
      if (blockedActions.includes(action)) {
        blockedActionsFound.push(action);
      }
    }

    // ── B. Evaluate Allowed Actions ──
    const allowedActions = policyData.allowed_actions || [];
    for (const action of attemptedActions) {
      if (allowedActions.includes(action)) {
        allowedActionsMatching.push(action);
      }
    }

    // ── C. Evaluate Escalation Conditions ──
    const escalationConditions = policyData.safety_policy?.escalation_conditions || [];
    const lowerMessage = userMessage.toLowerCase();
    for (const cond of escalationConditions) {
      if (lowerMessage.includes(cond.toLowerCase())) {
        escalationTriggered = true;
        escalationReasons.push(`Escalation condition matched: "${cond}"`);
      }
    }

    // ── D. Evaluate Prohibited Terms ──
    // Load prohibited terms from both default lists and concepts keywords
    const prohibitedWords = this.getProhibitedWords(vertical, context.hasCertificate);
    for (const word of prohibitedWords) {
      if (lowerMessage.includes(word.toLowerCase())) {
        prohibitedTermsFound.push(word);
      }
    }

    // Check concepts activation conditions for high irritation risk
    if (conceptsData && Array.isArray(conceptsData)) {
      for (const concept of conceptsData) {
        if (concept.risk_vector?.irritation_risk === "high" || concept.risk_vector?.medical_escalation === "high") {
          const keywords = concept.activation_condition?.keywords || [];
          for (const kw of keywords) {
            if (lowerMessage.includes(kw.toLowerCase()) && !escalationTriggered) {
              escalationTriggered = true;
              escalationReasons.push(`High risk ingredient/symptom concept activated: "${concept.name}"`);
            }
          }
        }
      }
    }

    const isViolation = prohibitedTermsFound.length > 0 || blockedActionsFound.length > 0;
    const boundaryNotes = policyData.safety_policy?.boundary_notes || [];
    const ctaPolicy = policyData.cta_policy || { primary: "", secondary: [], blocked: [] };

    return {
      isViolation,
      prohibitedTermsFound,
      allowedActionsMatching,
      blockedActionsFound,
      escalationTriggered,
      escalationReasons,
      boundaryNotes,
      ctaPolicy,
    };
  }

  /**
   * Helper to load policies.yaml for the specified vertical.
   * Fallback to hardcoded defaults if disk reads fail.
   */
  private loadVerticalPolicies(vertical: string): any {
    const packFolderName = this.getPackFolderName(vertical);
    if (!packFolderName) return this.getFallbackPolicies(vertical);

    const filePath = path.join(this.packsDir, packFolderName, "policies.yaml");

    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf8");
        const parsed = yaml.load(fileContent);
        logger.info(`[PolicyEngine] Loaded policies.yaml for vertical '${vertical}' from disk`);
        return parsed || {};
      }
    } catch (err: any) {
      logger.warn(`[PolicyEngine] Failed to read policies.yaml for vertical '${vertical}': ${err.message}. Using fallback.`);
    }

    return this.getFallbackPolicies(vertical);
  }

  /**
   * Helper to load concepts.yaml for the specified vertical.
   */
  private loadVerticalConcepts(vertical: string): any {
    const packFolderName = this.getPackFolderName(vertical);
    if (!packFolderName) return [];

    const filePath = path.join(this.packsDir, packFolderName, "concepts.yaml");

    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf8");
        const parsed = yaml.load(fileContent);
        logger.info(`[PolicyEngine] Loaded concepts.yaml for vertical '${vertical}' from disk`);
        return parsed || [];
      }
    } catch (err: any) {
      logger.warn(`[PolicyEngine] Failed to read concepts.yaml for vertical '${vertical}': ${err.message}.`);
    }

    return [];
  }

  private getPackFolderName(vertical: string): string | null {
    // Static mapping for well-known verticals
    const KNOWN_VERTICALS: Record<string, string> = {
      'skincare': 'kbeauty-skincare',
      'travel': 'jeju-context-travel',
      'k-wedding': 'k-wedding-services',
      'k-food': 'k-food-restaurant',
      'k-cafe': 'k-cafe-dessert',
      'senior-care': 'senior-care',
    };
    if (KNOWN_VERTICALS[vertical]) return KNOWN_VERTICALS[vertical];
    
    // Dynamic resolution: try to find a pack directory matching the vertical slug
    try {
      const candidatePath = path.join(this.packsDir, vertical);
      if (fs.existsSync(candidatePath)) return vertical;
    } catch {}
    
    return null;
  }

  /**
   * Get list of prohibited words based on regulatory vertical and certificates.
   */
  private getProhibitedWords(vertical: string, hasCertificate?: boolean): string[] {
    const commonBlocked = ["마약", "불법", "부작용 절대 없음", "100% 효과 보장"];
    
    if (vertical === "skincare") {
      return [
        ...commonBlocked,
        "치료", "완치", "치료제", "의학적 효능", "질병 예방", 
        "아토피 치료", "여드름 치료", "여드름 완치", "탈모 치료", "건선 치료", 
        "의약품", "소염 작용", "항염제", "스테로이드 대체"
      ];
    }

    if (vertical === "travel") {
      const list = [...commonBlocked, "무단 침입", "통제구역 진입", "야생 동물 사냥"];
      // If Jeju cert is not verified, then claiming origin acts as a violation keyword
      if (!hasCertificate) {
        list.push("제주산", "제주 화장품", "제주인증");
      }
      return list;
    }

    return commonBlocked;
  }

  /**
   * Hardcoded default fallback policies for skincare, travel, and general.
   */
  private getFallbackPolicies(vertical: string): any {
    if (vertical === "skincare") {
      return {
        allowed_actions: [
          "ask_frequency_and_severity",
          "explain_cautious_homecare",
          "offer_routine_info_if_low_risk",
          "suggest_safer_expression"
        ],
        blocked_actions: [
          "unconditional_product_permission",
          "push_product_purchase",
          "diagnose_condition"
        ],
        cta_policy: {
          primary: "장벽 진정 루틴 보기",
          secondary: [
            "성분 안전 정보 확인",
            "1:1 피부 상담 신청"
          ],
          blocked: [
            "바로 구매하기"
          ]
        },
        safety_policy: {
          boundary_notes: [
            "상태가 지속되거나 진물이 나는 경우 즉시 사용을 중단하고 전문의와 상담하세요."
          ],
          escalation_conditions: [
            "진물",
            "심한 붉은기",
            "지속적인 화끈거림"
          ]
        }
      };
    }

    if (vertical === "travel") {
      return {
        allowed_actions: [
          "ask_region_and_mobility_if_missing",
          "propose_plan_a_b",
          "include_map_cta",
          "avoid_stairs_if_unknown",
          "prefer_short_walk_rest_stop"
        ],
        blocked_actions: [
          "long_oreum_hike",
          "overpacked_schedule",
          "unsafe_weather_route"
        ],
        cta_policy: {
          primary: "카카오맵 길찾기 경로 열기",
          secondary: [
            "동선 코스 저장하기",
            "코스 지역 변경하기"
          ],
          blocked: [
            "무조건 예약하기"
          ]
        },
        safety_policy: {
          boundary_notes: [
            "우천 및 강풍 경보 시 해안가 및 산간 오름 진입을 금지하며 실내 실시간 운영 여부를 사전에 유선 확인하세요."
          ],
          escalation_conditions: [
            "호우경보",
            "강풍주의보",
            "도로통제"
          ]
        }
      };
    }

    // General fallback
    return {
      allowed_actions: ["offer_information"],
      blocked_actions: ["dangerous_advice"],
      cta_policy: {
        primary: "더 알아보기",
        secondary: [],
        blocked: []
      },
      safety_policy: {
        boundary_notes: ["본 정보는 일반 안내 목적으로 제공됩니다."],
        escalation_conditions: []
      }
    };
  }
}
