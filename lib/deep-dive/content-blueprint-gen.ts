import { TargetQuestionCandidate, ContentBlueprint } from './types';
import { LlmAnalyst } from './llm-analyst';

export class ContentBlueprintGenerator {
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

    // 2. Fallback or merge with generated values
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
      prescription_source: {
        quadrant: 'white',
        prescription_type: 'general',
        gap_detail: 'none'
      },
      estimated_aepi_impact: 0,
      estimated_bdr_delta: 0,
      priority_rank: candidate.composite_priority || 0,
      // 3. Keep structured links
      structured_links: [
        { type: 'product', url: `https://${brandContext.domains[0] || 'example.com'}/shop`, anchor_text: '공식몰 바로가기' }
      ]
    };
  }
}