// lib/governance/claim-registry.ts

import { getSupabaseAdminClient } from "../supabase";
import { logger } from "../logger";
import { EvidenceRegistry, EvidenceLevel } from "./evidence-registry";

export interface ClaimInput {
  id?: string;
  workspace_id: string;
  operational_truth_id: string;
  claim_summary: string;
  metadata?: Record<string, any>;
}

export interface ClaimValidationReport {
  status: "allowed" | "blocked" | "flagged_high_risk";
  reasons: string[];
  policyViolations: string[];
  requiredDisclosures: string[];
}

export class ClaimRegistry {
  private static inMemoryClaims = new Map<string, any>();
  private evidenceRegistry = new EvidenceRegistry();

  /**
   * Registers a claim node.
   * Integrates with Supabase, with automatic in-memory fallback.
   */
  public async registerClaim(input: ClaimInput): Promise<any> {
    const supabase = getSupabaseAdminClient();
    const id = input.id || crypto.randomUUID();
    const payload = {
      id,
      workspace_id: input.workspace_id,
      operational_truth_id: input.operational_truth_id,
      claim_summary: input.claim_summary,
      metadata: input.metadata || {},
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("claim_nodes")
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      logger.info(`[ClaimRegistry] Registered claim in Database: ${id}`);
      return data;
    } catch (err: any) {
      logger.warn(
        `[ClaimRegistry] Supabase insert failed: ${err.message}. Falling back to in-memory registration.`
      );
      ClaimRegistry.inMemoryClaims.set(id, payload);
      return payload;
    }
  }

  /**
   * Retrieves a claim by ID.
   */
  public async getClaim(workspaceId: string, claimId: string): Promise<any | null> {
    const supabase = getSupabaseAdminClient();
    try {
      const { data, error } = await supabase
        .from("claim_nodes")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("id", claimId)
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (err: any) {
      logger.warn(`[ClaimRegistry] Database read failed for claim ${claimId}: ${err.message}. Querying in-memory fallback.`);
      return ClaimRegistry.inMemoryClaims.get(claimId) || null;
    }
  }

  /**
   * Evaluates the strength of a claim based on its linked evidence.
   * Strength is determined by the highest evidence level (Level 1 is strongest, Level 6 is weakest).
   */
  public async evaluateClaimStrength(workspaceId: string, claimId: string): Promise<{
    strengthLevel: EvidenceLevel;
    evidenceCount: number;
    description: string;
  }> {
    const evidenceList = await this.evidenceRegistry.getEvidenceForClaim(workspaceId, claimId);
    if (evidenceList.length === 0) {
      return {
        strengthLevel: 6,
        evidenceCount: 0,
        description: "No evidence linked. Evaluated at Level 6 (Weakest / Anecdotal)",
      };
    }

    let highestLevel: EvidenceLevel = 6;
    for (const item of evidenceList) {
      const evaluation = this.evidenceRegistry.evaluateEvidence(item);
      if (evaluation.level < highestLevel) {
        highestLevel = evaluation.level;
      }
    }

    let description = "Level 6: Anecdotal evidence or user feedback";
    if (highestLevel === 1) description = "Level 1: Strongest clinical-grade trial / meta-analysis evidence";
    else if (highestLevel === 2) description = "Level 2: Controlled scientific lab reports or academic journals";
    else if (highestLevel === 3) description = "Level 3: Official certifications, patents, or government approvals";
    else if (highestLevel === 4) description = "Level 4: Manufacturer R&D technical sheets / certificates of analysis";
    else if (highestLevel === 5) description = "Level 5: Expert editorial opinions / medical advisory boards";

    return {
      strengthLevel: highestLevel,
      evidenceCount: evidenceList.length,
      description,
    };
  }

  /**
   * Validates a claim against vertical guidelines (YMYL medical claims & Jeju local act policies).
   */
  public validateClaimAgainstPolicies(
    claimText: string,
    metadata: Record<string, any> = {},
    linkedEvidence: any[] = []
  ): ClaimValidationReport {
    const reasons: string[] = [];
    const policyViolations: string[] = [];
    const requiredDisclosures: string[] = [];
    let status: "allowed" | "blocked" | "flagged_high_risk" = "allowed";

    const claimTextLower = claimText.toLowerCase();

    // ── Rule 1: YMYL Medical Claim Detection (의학적 치료 및 예방 주장 금지) ──
    const medicalProhibitedKeywords = [
      "치료", "완치", "치료제", "의학적 효능", "질병 예방", 
      "아토피 치료", "여드름 치료", "여드름 완치", "탈모 치료", "건선 치료", 
      "의약품", "소염 작용", "항염제", "스테로이드 대체"
    ];

    const foundMedicalKeywords = medicalProhibitedKeywords.filter(kw => claimTextLower.includes(kw));
    if (foundMedicalKeywords.length > 0) {
      status = "blocked";
      policyViolations.push("YMYL_MEDICAL_CLAIM_VIOLATION");
      reasons.push(
        `Claim contains prohibited medical/therapeutic terminology: [${foundMedicalKeywords.join(", ")}]. Cosmetics cannot claim disease treatment or prevention.`
      );
    }

    // ── Rule 2: Jeju Special Act & Origin Claims (제주 특별법 및 화장품 규정) ──
    const jejuKeywords = ["제주", "jeju", "제주산", "제주 화장품", "제주스킨케어"];
    const containsJejuReference = jejuKeywords.some(kw => claimTextLower.includes(kw));

    if (containsJejuReference) {
      // Check if product is registered with Jeju Cosmetic Cert (JCC)
      const hasJejuCert = metadata.jeju_cosmetic_cert === true || linkedEvidence.some(item => 
        item.evidence_type === "certificate" && 
        (item.title.includes("제주 화장품 인증") || item.title.includes("JCC") || item.title.toLowerCase().includes("jeju cosmetic cert"))
      );

      if (!hasJejuCert) {
        status = "blocked";
        policyViolations.push("JEJU_SPECIAL_ACT_VIOLATION");
        reasons.push(
          "Claim mentions 'Jeju' or 'Jeju origin' without presenting official Jeju Cosmetic Certification (JCC) evidence."
        );
      } else {
        reasons.push("Verified official Jeju Cosmetic Certification (JCC) via linked evidence.");
      }

      // Check for protected local resources
      const protectedJejuResources = ["비자나무", "한라산", "백록담", "화산송이", "동백", "감귤", "녹차"];
      const foundProtected = protectedJejuResources.filter(res => claimTextLower.includes(res));
      if (foundProtected.length > 0) {
        // Must declare origin tracking
        if (!metadata.origin_tracked && !metadata.origin_certificate_id) {
          if (status !== "blocked") status = "flagged_high_risk";
          policyViolations.push("JEJU_BIO_RESOURCE_RESTRICTION");
          reasons.push(
            `Claim refers to protected local bio-resources [${foundProtected.join(", ")}] without verified origin-tracking registry.`
          );
          requiredDisclosures.push("본 제품에 사용된 제주 원료는 채취 허가를 취득한 자원입니다.");
        }
      }
    }

    // ── Rule 3: Cosmetic Claims Validation (화장품 표방 가능 범위) ──
    const cosmeticCautionKeywords = ["영구적", "즉각적 완화", "즉시 해결", "완벽 차단", "부작용 없음"];
    const foundCaution = cosmeticCautionKeywords.filter(kw => claimTextLower.includes(kw));
    if (foundCaution.length > 0) {
      if (status !== "blocked") status = "flagged_high_risk";
      policyViolations.push("COSMETIC_EXAGGERATION_RISK");
      reasons.push(
        `Claim contains exaggerated expressions [${foundCaution.join(", ")}]. Must be revised or softened.`
      );
      requiredDisclosures.push("개인차에 따라 효과가 다를 수 있습니다.");
    }

    // If high risk and has level 1 or 2 evidence, we can downgrade risk to allowed but keep disclosures
    const hasStrongEvidence = linkedEvidence.some(item => {
      const type = item.evidence_type;
      return type === "clinical_trial" || type === "lab_report";
    });

    if (status === "flagged_high_risk" && hasStrongEvidence) {
      status = "allowed";
      reasons.push("Downgraded high-risk flag to allowed due to presence of Level 1/2 clinical/lab evidence.");
    }

    return {
      status,
      reasons,
      policyViolations,
      requiredDisclosures,
    };
  }
}
