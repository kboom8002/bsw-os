import { getAIProvider } from '../ai/ai-provider';
import { ParametricPersonaSnapshot } from './parametric-persona-snapshot';
import { SurfaceEntity } from '../schema';

export class PersonaSpecBuilder {
  /**
   * Generates a draft PersonaSpec YAML based on brand, industry, entities, and v2 snapshot
   */
  async generateDraftYaml(
    brandName: string, 
    industry: string, 
    entities: SurfaceEntity[], 
    snapshot?: ParametricPersonaSnapshot
  ): Promise<string> {
    const provider = getAIProvider();

    // Extract basic information from entities if available
    const description = entities.find(e => e.entity_name.includes(brandName))?.entity_content.description || 
      `${industry} 분야의 선도 브랜드`;

    // Basic prompt to generate YAML
    const prompt = `당신은 PersonaSpec OS v1.0 작성 전문가입니다.
브랜드 '${brandName}'(${industry})에 대한 Parametric PersonaSpec YAML을 초안으로 작성해주세요.

[배경 정보]
- 설명: ${description}
- V2.0 인지 맵 주요 키워드: ${snapshot?.cognitive_map?.b2c?.auto_associations?.slice(0, 5).join(', ') || '정보 없음'}

아래의 엄격한 구조를 따르는 YAML 문자열만 출력하세요. (마크다운 코드블록 안의 내용만 추출하여 사용합니다.)

\`\`\`yaml
persona_meta:
  persona_id: "PERS-${brandName.toUpperCase().replace(/\s/g, '_')}"
  persona_name: "${brandName} 공식 페르소나"
  version: "1.0.0"
  scope: "브랜드 고객응대 및 공적 커뮤니케이션"

identity_layer:
  one_line_definition: "[브랜드를 한 줄로 정의]"
  public_roles:
    - "[역할 1]"
    - "[역할 2]"

decision_policy_layer:
  tradeoffs:
    accuracy: 0.8
    warmth: 0.7
    risk_aversion: 0.9

vibe_layer:
  target_vector:
    valence: 0.7
    arousal: 0.5
    dominance: 0.6
    warmth: 0.8
    competence: 0.8
    formality: 0.7

language_dna_layer:
  preferred_phrases:
    - "[선호 문구 1]"
  avoided_phrases:
    - "[기피 문구 1]"

governance_layer:
  taboo_topics:
    - "타사 비방"
    - "확인되지 않은 루머"
  boundary_rules:
    - "안전과 직결된 문제는 단정하지 않고 공식 가이드를 안내한다."

mode_set_layer:
  modes:
    - mode_id: "CUSTOMER"
      trigger: "일반 고객 문의"
    - mode_id: "CRISIS"
      trigger: "논란, 불만, 사고 대응"
\`\`\`

위 템플릿을 바탕으로 ${brandName}에 맞게 내용을 채워 YAML 텍스트만 응답해주세요.`;

    try {
      const result = await provider.generateText(prompt);
      const match = result.match(/```yaml\n([\s\S]*?)\n```/);
      if (match && match[1]) {
        return match[1].trim();
      }
      return result.replace(/```yaml/g, '').replace(/```/g, '').trim();
    } catch (e) {
      console.warn("Failed to generate PersonaSpec YAML draft:", e);
      return this.getFallbackYaml(brandName, industry);
    }
  }

  private getFallbackYaml(brandName: string, industry: string): string {
    return `persona_meta:
  persona_id: "PERS-${brandName.toUpperCase().replace(/\s/g, '_')}"
  persona_name: "${brandName} 공식 페르소나"
  version: "1.0.0"
  scope: "브랜드 고객응대 및 공적 커뮤니케이션"

identity_layer:
  one_line_definition: "${brandName}은 신뢰할 수 있는 ${industry} 리더입니다."
  public_roles:
    - "전문 가이드"
    - "신뢰할 수 있는 파트너"

decision_policy_layer:
  tradeoffs:
    accuracy: 0.85
    warmth: 0.70
    risk_aversion: 0.90

vibe_layer:
  target_vector:
    valence: 0.7
    arousal: 0.5
    dominance: 0.6
    warmth: 0.75
    competence: 0.85
    formality: 0.7

language_dna_layer:
  preferred_phrases:
    - "고객님의 편의를 위해 최선을 다하겠습니다."
  avoided_phrases:
    - "절대적으로"
    - "무조건"

governance_layer:
  taboo_topics:
    - "타사 비방"
    - "정치, 종교 이슈"
  boundary_rules:
    - "공식적으로 확인된 정보만 제공한다."

mode_set_layer:
  modes:
    - mode_id: "CUSTOMER"
      trigger: "일반 고객 문의"
    - mode_id: "CRISIS"
      trigger: "불만, 논란, 사고 대응"`;
  }
}
