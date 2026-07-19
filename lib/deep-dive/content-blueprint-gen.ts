import { TargetQuestionCandidate, ContentBlueprint } from './types';
import { LlmAnalyst } from './llm-analyst';

export class ContentBlueprintGenerator {
  /**
   * Estimate AEO Position Index impact from CPS score.
   * AEPI measures how much a piece of content can improve the brand's
   * AI search engine answer position. Higher CPS → higher potential impact.
   * Scale: 0-100 (linear mapping from CPS with a diminishing returns curve)
   */
  private static estimateAepiImpact(cpsScore: number, priority: number): number {
    // Base impact from CPS (0-100 scale, soft-capped via sqrt curve)
    const normalizedCps = Math.max(0, Math.min(100, cpsScore));
    const baseImpact = Math.sqrt(normalizedCps / 100) * 100;
    // Priority bonus: top-ranked items get an additional boost (max +15)
    const priorityBonus = priority > 0 ? Math.max(0, 15 - priority * 1.5) : 0;
    return parseFloat(Math.min(100, baseImpact + priorityBonus).toFixed(2));
  }

  /**
   * Estimate Brand Domination Ratio delta from CPS and gap analysis.
   * BDR measures how much the brand's dominance in answer surfaces would increase.
   * Scale: 0-1.0 representing percentage-point improvement.
   */
  private static estimateBdrDelta(cpsScore: number, gapDetail: string): number {
    const normalizedCps = Math.max(0, Math.min(100, cpsScore));
    // High-CPS content targeting actual gaps has greater dominance potential
    const gapMultiplier = gapDetail && gapDetail !== 'none' ? 1.5 : 1.0;
    const baseDelta = (normalizedCps / 100) * 0.05 * gapMultiplier;
    return parseFloat(Math.min(0.10, baseDelta).toFixed(4));
  }

  static async generate(
    candidate: TargetQuestionCandidate,
    brandContext: { name: string; keywords: string[]; domains: string[] },
    truthRules: { approvedClaims: string[]; boundaryRules: string[] }
  ): Promise<ContentBlueprint> {
    
    // 1. LLM Analyst를 활용하여 Blueprint 초안 생성
    // AUTO-PILOT: Claim/Concept Injection
    console.log(`[Auto-Pilot] Injected ${truthRules.approvedClaims.length} Claims and TCO Concepts into Blueprint Generator for: ${candidate.question_text}`);
    
    const llmBlueprint = await LlmAnalyst.generateContentBlueprint(
      candidate,
      brandContext,
      truthRules.approvedClaims,
      truthRules.boundaryRules
    );

    // 2. Determine prescription source for BDR estimation
    const primarySourceType = candidate.sources?.[0]?.type;
    const prescriptionSource = {
      quadrant: 'white' as const,
      prescription_type: 'general',
      gap_detail: primarySourceType === 'opportunity_gap' ? primarySourceType : 'none'
    };

    // 3. Compute real impact estimates based on CPS score
    const cps = candidate.composite_priority || 0;
    const priorityRank = candidate.composite_priority || 0;

    // 4. Fallback or merge with generated values
    return {
      target_question_id: candidate.id || 'temp',
      content_type: 'informational',
      title_suggestion_ko: llmBlueprint.title_suggestion_ko || `${brandContext.name} - ${candidate.question_text} 심층 분석`,
      heading_structure: llmBlueprint.heading_structure || [
        { level: 'h2', text: '핵심 답변', target_keyword: candidate.question_text, is_question_heading: true }
      ],
      expected_layer: llmBlueprint.expected_layer || {
        must_include: [brandContext.name, ...truthRules.approvedClaims.slice(0, 2)],
        strongly_recommended: ['공식 홈페이지 참조'],
        should_include: [],
        caution: truthRules.boundaryRules,
        must_not_do: ['경쟁사 비방']
      },
      schema_suggestions: [],
      linked_evidence_ids: [],
      linked_claim_ids: [],
      linked_boundary_ids: [],
      prescription_source: prescriptionSource,
      estimated_aepi_impact: this.estimateAepiImpact(cps, priorityRank),
      estimated_bdr_delta: this.estimateBdrDelta(cps, prescriptionSource.gap_detail),
      priority_rank: priorityRank,
      // 5. Keep structured links
      structured_links: [
        { type: 'product', url: `https://${brandContext.domains[0] || 'example.com'}/shop`, anchor_text: '공식몰 바로가기' }
      ]
    };
  }
}