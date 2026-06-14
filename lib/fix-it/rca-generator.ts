/**
 * lib/fix-it/rca-generator.ts
 *
 * ② AI 기반 RCA 가설 생성기.
 * 이상 탐지 결과와 브랜드 컨텍스트를 AI에 제공하여 근본 원인 가설을 자동 생성합니다.
 */

import { getAIProvider } from '../ai/ai-provider';
import type { Anomaly, RcaContext, RcaHypothesis, PatchType, ArtifactRef } from './types';

const MAX_HYPOTHESES = 3;

export class RcaGenerator {
  /**
   * 이상 탐지 결과를 기반으로 AI가 근본 원인 가설을 자동 생성합니다.
   *
   * @param workspaceId 워크스페이스 ID (로깅용)
   * @param anomalies   탐지된 이상 목록
   * @param context     브랜드 SSoT, 변경 이력, 과거 RCA 등 컨텍스트
   * @returns 신뢰도 내림차순 정렬된 가설 목록 (최대 3개)
   */
  async generateHypotheses(
    workspaceId: string,
    anomalies: Anomaly[],
    context: RcaContext,
  ): Promise<RcaHypothesis[]> {
    if (anomalies.length === 0) {
      return [];
    }

    const ai = getAIProvider();
    const prompt = this._buildPrompt(anomalies, context);

    try {
      const schema = {
        type: 'object',
        properties: {
          hypotheses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                cause_hypothesis: { type: 'string' },
                confidence: { type: 'number' },
                evidence: { type: 'array', items: { type: 'string' } },
                suggested_patch_type: { type: 'string' },
                affected_artifacts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      artifact_type: { type: 'string' },
                      artifact_id: { type: 'string' },
                      description: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const result = await ai.generateStructuredOutput<{ hypotheses: any[] }>(prompt, schema, {
        temperature: 0.3,
      });

      return this._parseHypotheses(result.hypotheses ?? []);
    } catch (err: any) {
      console.error(`[RcaGenerator] generateHypotheses error: ${err.message}`);
      // fallback: 규칙 기반 가설 생성
      return this._fallbackHypotheses(anomalies);
    }
  }

  // ─────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────

  private _buildPrompt(anomalies: Anomaly[], context: RcaContext): string {
    const anomalyLines = anomalies
      .slice(0, 5)
      .map(
        (a) =>
          `- ${a.metric_name} = ${a.current_value.toFixed(3)} (임계: ${a.threshold}, ${a.direction === 'above' ? '초과' : '미달'}, ${a.severity})` +
          (a.affected_concepts.length > 0
            ? `\n  영향 개념: ${a.affected_concepts.join(', ')}`
            : ''),
      )
      .join('\n');

    const ssotLines = context.ssot_entries
      .slice(0, 5)
      .map((e) => `- [${e.risk_level}] ${e.claim}`)
      .join('\n');

    const changeLines = context.recent_changes
      .slice(0, 3)
      .map((c) => `- ${c.date}: [${c.change_type}] ${c.description}`)
      .join('\n');

    const distortionLines = (context.distortion_details ?? [])
      .slice(0, 3)
      .map((d) => `- 개념 "${d.concept}": "${d.original}" → "${d.distorted}" (심각도: ${d.severity})`)
      .join('\n');

    const pastRcaLines = context.past_rca_summaries
      .slice(0, 3)
      .map((s) => `- ${s}`)
      .join('\n');

    return `당신은 AEO/GEO 시맨틱 진단 전문가입니다.

[이상 데이터]
${anomalyLines || '(이상 없음)'}

${distortionLines ? `[왜곡 상세]\n${distortionLines}\n` : ''}
[브랜드 SSoT (Brand Operational Truths)]
${ssotLines || '(데이터 없음)'}

[최근 변경 이력]
${changeLines || '(변경 이력 없음)'}

${pastRcaLines ? `[과거 RCA 케이스]\n${pastRcaLines}\n` : ''}
위 데이터를 분석하여 근본 원인 가설 최대 ${MAX_HYPOTHESES}개를 도출하세요.
각 가설에 대해 다음 정보를 포함하세요:
- cause_hypothesis: 원인 가설 (한국어, 구체적)
- confidence: AI 신뢰도 (0.0~1.0)
- evidence: 근거 목록 (문자열 배열)
- suggested_patch_type: 패치 유형 (ssot_update | answer_card_create | answer_card_update | boundary_rule_add | schema_markup_fix | expected_layer_update | content_restructure)
- affected_artifacts: 수정 필요 아티팩트 (artifact_type, artifact_id="unknown", description)

JSON 형식으로만 응답하세요.`;
  }

  private _parseHypotheses(raw: any[]): RcaHypothesis[] {
    const validPatchTypes = new Set<PatchType>([
      'ssot_update', 'answer_card_create', 'answer_card_update',
      'boundary_rule_add', 'schema_markup_fix', 'expected_layer_update', 'content_restructure',
    ]);

    return raw
      .slice(0, MAX_HYPOTHESES)
      .map((h: any): RcaHypothesis => ({
        cause_hypothesis: String(h.cause_hypothesis || ''),
        confidence: Math.min(1, Math.max(0, Number(h.confidence) || 0)),
        evidence: Array.isArray(h.evidence) ? h.evidence.map(String) : [],
        suggested_patch_type: validPatchTypes.has(h.suggested_patch_type)
          ? h.suggested_patch_type
          : 'ssot_update',
        affected_artifacts: Array.isArray(h.affected_artifacts)
          ? h.affected_artifacts.map((a: any): ArtifactRef => ({
              artifact_type: a.artifact_type || 'brand_operational_truth',
              artifact_id: a.artifact_id || 'unknown',
              description: a.description || '',
            }))
          : [],
      }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  /** API 실패 시 규칙 기반 fallback 가설 */
  private _fallbackHypotheses(anomalies: Anomaly[]): RcaHypothesis[] {
    const hypotheses: RcaHypothesis[] = [];

    for (const a of anomalies.slice(0, MAX_HYPOTHESES)) {
      const patchType: PatchType = a.metric_name.includes('distortion') || a.metric_name.includes('M4')
        ? 'boundary_rule_add'
        : a.metric_name.includes('hallucination') || a.metric_name.includes('M6')
        ? 'ssot_update'
        : a.metric_name.includes('concept') || a.metric_name.includes('M1')
        ? 'answer_card_update'
        : 'ssot_update';

      hypotheses.push({
        cause_hypothesis: `[규칙 기반 가설] ${a.metric_name} 지표가 ${a.direction === 'above' ? '임계값을 초과' : '임계값 미달'}했습니다 (현재: ${a.current_value.toFixed(3)}, 임계: ${a.threshold}). 브랜드 SSoT 또는 경계 규칙 점검이 필요합니다.`,
        confidence: 0.5,
        evidence: [
          `${a.metric_name} = ${a.current_value.toFixed(3)} (${a.severity})`,
          `영향 개념: ${a.affected_concepts.join(', ') || '없음'}`,
        ],
        suggested_patch_type: patchType,
        affected_artifacts: [],
      });
    }

    return hypotheses;
  }
}
