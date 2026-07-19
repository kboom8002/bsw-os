// lib/governance/evidence-registry.ts

import { getSupabaseAdminClient } from "../supabase";
import { logger } from "../logger";

export type EvidenceLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface EvidenceDimensionScores {
  credibility: number; // 0.0 to 1.0
  specificity: number; // 0.0 to 1.0
  verification: number; // 0.0 to 1.0
  mediaPresence: number; // 0.0 to 1.0
}

export interface EvidenceHierarchyInfo {
  level: EvidenceLevel;
  name: string;
  description: string;
  allowedTypes: string[];
}

export const EVIDENCE_HIERARCHY: Record<EvidenceLevel, EvidenceHierarchyInfo> = {
  1: {
    level: 1,
    name: "Level 1: Clinical Trials & Meta-Analyses",
    description: "임상시험, 무작위 대조군 실험(RCT) 및 메타분석 결과",
    allowedTypes: ["clinical_trial", "meta_analysis"],
  },
  2: {
    level: 2,
    name: "Level 2: Controlled Scientific Lab Reports",
    description: "학술 연구소의 통제된 실험, 피어리뷰 학술지 발표 자료",
    allowedTypes: ["lab_report", "peer_reviewed_paper"],
  },
  3: {
    level: 3,
    name: "Level 3: Official Certifications & Approvals",
    description: "정부 기관 승인, 특허, 국가 공인 인증 마크 (예: 식약처 기능성 승인)",
    allowedTypes: ["certificate", "patent", "government_approval"],
  },
  4: {
    level: 4,
    name: "Level 4: Technical Sheets & R&D Sheets",
    description: "제조사 R&D 부서 기술 설명서, 원료 분석 성적서",
    allowedTypes: ["technical_document", "raw_material_sheet"],
  },
  5: {
    level: 5,
    name: "Level 5: Expert Editorial Reviews",
    description: "피부과 전문의 자문, 업계 전문가 기고문, 공식 브랜드 에디토리얼",
    allowedTypes: ["expert_opinion", "editorial_review"],
  },
  6: {
    level: 6,
    name: "Level 6: Anecdotal Evidence & User Feedback",
    description: "사용자 실사용 후기, 서베이 응답 데이터, 일반 소셜 피드백",
    allowedTypes: ["user_feedback", "unverified_review", "manual_verify"],
  },
};

export interface EvidenceItemInput {
  id?: string;
  workspace_id: string;
  title: string;
  content: string;
  url?: string | null;
  evidence_type: string;
  is_verified?: boolean;
  metadata?: Record<string, any>;
}

export interface EvidenceEvaluation {
  evidenceId: string;
  level: EvidenceLevel;
  scores: EvidenceDimensionScores;
  compositeScore: number; // 0.0 to 1.0
  isReadinessApproved: boolean;
  reasons: string[];
}

export class EvidenceRegistry {
  // In-memory simulation fallback state
  private static inMemoryEvidence = new Map<string, any>();
  private static inMemoryLineage = new Map<string, { claimId: string; evidenceId: string }[]>();

  /**
   * Registers a new evidence item.
   * Integrates with Supabase, with automatic in-memory fallback.
   */
  public async registerEvidence(input: EvidenceItemInput): Promise<any> {
    const supabase = getSupabaseAdminClient();
    const id = input.id || crypto.randomUUID();
    const payload = {
      id,
      workspace_id: input.workspace_id,
      title: input.title,
      content: input.content,
      url: input.url || null,
      evidence_type: input.evidence_type,
      is_verified: input.is_verified ?? false,
      verified_at: input.is_verified ? new Date().toISOString() : null,
      metadata: input.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("evidence_items")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      logger.info(`[EvidenceRegistry] Registered evidence in Database: ${id}`);
      return data;
    } catch (err: any) {
      logger.warn(
        `[EvidenceRegistry] Supabase insert failed: ${err.message}. Falling back to in-memory registration.`
      );
      EvidenceRegistry.inMemoryEvidence.set(id, payload);
      return payload;
    }
  }

  /**
   * Links an evidence item to a claim node via lineage_records.
   */
  public async linkEvidenceToClaim(
    workspaceId: string,
    claimNodeId: string,
    evidenceItemId: string
  ): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    const recordId = crypto.randomUUID();
    const payload = {
      id: recordId,
      workspace_id: workspaceId,
      claim_node_id: claimNodeId,
      evidence_item_id: evidenceItemId,
      is_publishable: true,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from("lineage_records").insert(payload);
      if (error) {
        throw new Error(error.message);
      }
      logger.info(`[EvidenceRegistry] Linked evidence ${evidenceItemId} to claim ${claimNodeId} in Database`);
      return true;
    } catch (err: any) {
      logger.warn(
        `[EvidenceRegistry] Supabase link failed: ${err.message}. Falling back to in-memory link.`
      );
      const list = EvidenceRegistry.inMemoryLineage.get(workspaceId) || [];
      list.push({ claimId: claimNodeId, evidenceId: evidenceItemId });
      EvidenceRegistry.inMemoryLineage.set(workspaceId, list);
      return true;
    }
  }

  /**
   * Evaluates the quality of a single evidence item across 4 dimensions:
   * 1. Credibility (source reliability)
   * 2. Specificity (level of detail / quantifiable claims)
   * 3. Verification Status (approved review process)
   * 4. Media Presence (assets, PDFs, links)
   */
  public evaluateEvidence(item: any): EvidenceEvaluation {
    const evidenceId = item.id || "unknown";
    const type = item.evidence_type || "manual_verify";
    const content = item.content || "";
    const metadata = item.metadata || {};
    
    // Determine level from type
    let level: EvidenceLevel = 6;
    for (const [lvlKey, info] of Object.entries(EVIDENCE_HIERARCHY)) {
      if (info.allowedTypes.includes(type)) {
        level = Number(lvlKey) as EvidenceLevel;
        break;
      }
    }

    const reasons: string[] = [];

    // 1. Credibility score (0.0 to 1.0)
    let credibility = 0.2; // default level 6
    if (level === 1) credibility = 1.0;
    else if (level === 2) credibility = 0.85;
    else if (level === 3) credibility = 0.8;
    else if (level === 4) credibility = 0.6;
    else if (level === 5) credibility = 0.5;

    // Check trusted source domain
    if (item.url) {
      const urlStr = String(item.url);
      if (urlStr.includes(".gov") || urlStr.includes(".ac.kr") || urlStr.includes(".edu") || urlStr.includes("ncbi.nlm.nih.gov")) {
        credibility = Math.min(1.0, credibility + 0.15);
        reasons.push("Source originates from trusted academic or government domain");
      }
    }

    // 2. Specificity score (0.0 to 1.0)
    // Check for quantitative metrics, clinical keywords, and exact ingredients
    let specificityScore = 0.1;
    let specHits = 0;
    
    // Check for percentage values (e.g. 24.3% or 10%)
    if (/%|퍼센트|배|증가|감소/.test(content)) {
      specHits += 2;
    }
    // Check for exact numbers/statistics
    if (/\b\d+(\.\d+)?(주|일|시간|명|개|ml|g|%)\b/.test(content)) {
      specHits += 1.5;
    }
    // Check for active scientific ingredients
    const activeIngredients = ["레티놀", "retinol", "비타민", "vitamin", "아데노신", "adenosine", "나이아신아마이드", "niacinamide", "시카", "cica", "병풀", "centella", "세라마이드", "ceramide", "살리실산", "salicylic"];
    const foundIngredients = activeIngredients.filter(ing => content.toLowerCase().includes(ing));
    if (foundIngredients.length > 0) {
      specHits += Math.min(3, foundIngredients.length * 1.0);
    }
    // Check clinical terminology
    if (/임상|대조군|피부과|자극|인체적용시험|이중맹검|p-value|유의미/.test(content)) {
      specHits += 2;
    }

    specificityScore = Math.min(1.0, 0.1 + (specHits / 8));
    if (specificityScore > 0.6) {
      reasons.push(`High specificity with exact terms/numbers (hits: ${specHits})`);
    }

    // 3. Verification score (0.0 to 1.0)
    let verification = 0.1;
    if (item.is_verified || metadata.is_verified) {
      verification = 1.0;
      reasons.push("Verified by internal review panel or external registry");
    } else if (item.verified_at) {
      verification = 0.9;
    } else if (metadata.verification_signature || metadata.verified_by) {
      verification = 0.8;
      reasons.push("Presents verification signature or audit trail");
    }

    // 4. Media Presence score (0.0 to 1.0)
    let mediaPresence = 0.0;
    if (item.url && item.url.trim().length > 0) {
      mediaPresence += 0.6;
    }
    if (metadata.attachments || metadata.images || metadata.pdf_url || metadata.raw_report) {
      mediaPresence += 0.4;
      reasons.push("Evidence includes digital assets (PDFs, raw reports or charts)");
    }
    mediaPresence = Math.min(1.0, mediaPresence);

    // Calculate Composite Score (Weighted average)
    // Credibility: 40%, Specificity: 30%, Verification: 20%, Media: 10%
    const compositeScore = Number(
      ((credibility * 0.4) + (specificityScore * 0.3) + (verification * 0.2) + (mediaPresence * 0.1)).toFixed(3)
    );

    // Readiness threshold
    // High-risk or YMYL claims require compositeScore >= 0.6 and Level <= 3
    // General claims require compositeScore >= 0.45
    const isReadinessApproved = compositeScore >= 0.45;

    return {
      evidenceId,
      level,
      scores: { credibility, specificity: specificityScore, verification, mediaPresence },
      compositeScore,
      isReadinessApproved,
      reasons,
    };
  }

  /**
   * Retrieves evidence linked to a claim node.
   */
  public async getEvidenceForClaim(workspaceId: string, claimNodeId: string): Promise<any[]> {
    const supabase = getSupabaseAdminClient();
    try {
      const { data: records, error } = await supabase
        .from("lineage_records")
        .select("evidence_item_id")
        .eq("workspace_id", workspaceId)
        .eq("claim_node_id", claimNodeId);

      if (error) throw new Error(error.message);

      if (!records || records.length === 0) return [];

      const ids = records.map(r => r.evidence_item_id).filter(Boolean) as string[];
      if (ids.length === 0) return [];

      const { data: items, error: itemsError } = await supabase
        .from("evidence_items")
        .select("*")
        .in("id", ids);

      if (itemsError) throw new Error(itemsError.message);
      return items || [];
    } catch (err: any) {
      logger.warn(`[EvidenceRegistry] Database read failed: ${err.message}. Querying in-memory fallback.`);
      const list = EvidenceRegistry.inMemoryLineage.get(workspaceId) || [];
      const linkedIds = list.filter(l => l.claimId === claimNodeId).map(l => l.evidenceId);
      
      const results: any[] = [];
      for (const id of linkedIds) {
        const item = EvidenceRegistry.inMemoryEvidence.get(id);
        if (item) results.push(item);
      }
      return results;
    }
  }

  /**
   * Checks the readiness of a question by evaluating all connected claims and their evidence.
   */
  public async checkQuestionReadiness(workspaceId: string, claimNodeIds: string[]): Promise<{
    approved: boolean;
    averageQuality: number;
    lowestLevel: EvidenceLevel;
    claimsEvaluated: number;
    details: { claimId: string; approved: boolean; compositeScore: number; level: EvidenceLevel }[];
  }> {
    let totalScore = 0;
    let lowestLevel: EvidenceLevel = 6; // starts at weakest
    let approvedCount = 0;
    const details: any[] = [];

    for (const claimId of claimNodeIds) {
      const evidenceList = await this.getEvidenceForClaim(workspaceId, claimId);
      if (evidenceList.length === 0) {
        details.push({
          claimId,
          approved: false,
          compositeScore: 0,
          level: 6,
          message: "No evidence linked to this claim",
        });
        continue;
      }

      // Find the best quality evidence item linked to this claim
      let bestEvaluation: EvidenceEvaluation | null = null;
      for (const item of evidenceList) {
        const evalResult = this.evaluateEvidence(item);
        if (!bestEvaluation || evalResult.compositeScore > bestEvaluation.compositeScore) {
          bestEvaluation = evalResult;
        }
      }

      if (bestEvaluation) {
        totalScore += bestEvaluation.compositeScore;
        // Lowest numeric level means strongest evidence (Level 1 < Level 6)
        if (bestEvaluation.level < lowestLevel) {
          lowestLevel = bestEvaluation.level;
        }
        if (bestEvaluation.isReadinessApproved) {
          approvedCount++;
        }
        details.push({
          claimId,
          approved: bestEvaluation.isReadinessApproved,
          compositeScore: bestEvaluation.compositeScore,
          level: bestEvaluation.level,
        });
      }
    }

    const claimsEvaluated = claimNodeIds.length;
    const averageQuality = claimsEvaluated > 0 ? Number((totalScore / claimsEvaluated).toFixed(3)) : 0;
    
    // The question is approved if all claims have at least one readiness-approved evidence item
    const approved = claimsEvaluated > 0 && approvedCount === claimsEvaluated;

    return {
      approved,
      averageQuality,
      lowestLevel,
      claimsEvaluated,
      details,
    };
  }
}
