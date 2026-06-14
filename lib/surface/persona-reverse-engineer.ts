import { getAIProvider } from '../ai/ai-provider';
import { ObservedParametricPersona, PersonaSpec, VibeSpec } from '../schema';
import { getSupabaseAdminClient } from '../supabase';

export class PersonaReverseEngineer {
  /**
   * Helper: cosine similarity between two numeric vectors
   */
  private cosineSimilarity(vecA: Record<string, number>, vecB: Record<string, number>): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    const keys = Array.from(new Set([...Object.keys(vecA), ...Object.keys(vecB)]));
    for (const key of keys) {
      const a = vecA[key] || 0;
      const b = vecB[key] || 0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Reverse engineer observed persona from AI response texts
   */
  async analyze(
    workspaceId: string,
    websiteUrl: string,
    brandName: string,
    responseTexts: string[],
    engineName = 'composite',
    personaSpec?: PersonaSpec | null,
    vibeSpec?: VibeSpec | null
  ): Promise<ObservedParametricPersona> {
    const measuredAt = new Date().toISOString();
    const provider = getAIProvider();
    
    // Combine texts up to 10k characters
    const combinedTexts = responseTexts.join('\n\n').substring(0, 10000);

    const prompt = `당신은 AI 검색엔진 응답 페르소나 분석 전문가입니다.
제시된 AI 응답 텍스트 목록을 종합 분석하여, AI 검색엔진이 브랜드 "${brandName}"에 대해 어떤 "인격체(Parametric Persona)"로서 묘사하고 이야기하는지 프로필을 추출해주세요.

다음 항목들을 분석하여 평가해주셔야 합니다:
1. 톤 벡터 (Tone Vector, 0.0 ~ 1.0 실수값):
   - warmth: 응답의 친근함/따뜻함 정도 (사무적/차가움 0.0 ~ 따뜻함/감정교류 1.0)
   - formality: 응답의 격식/예의 정도 (구어체/캐주얼 0.0 ~ 격식체/공식체 1.0)
   - confidence: 응답의 어조 확신 정도 (소극적/조심함 0.0 ~ 확신/단호함 1.0)
   - expertise: 응답의 전문성 과시 정도 (일반적 정보 0.0 ~ 고도의 기술 전문성 1.0)
   - empathy: 소비자 감정 공감 정도 (차가움/기계적 0.0 ~ 높은 공감형 1.0)

2. 어휘 프로파일 (Vocabulary Profile, 0 ~ 100 정수값):
   - brand_term_usage: 브랜드 고유 용어/마케팅 슬로건 사용율
   - technical_term_ratio: 학술적/과학적 전문용어 비중
   - hedging_ratio: "할 수 있다", "일 가능성이 있다" 같은 회피성/완화성 표현 비중

3. 포지셔닝 (Positioning):
   - category_placement: AI가 이 브랜드를 분류한 구체적 시장 카테고리 (예: "더마 코스메틱", "럭셔리 웨딩 스튜디오")
   - competitive_frame: 함께 묶어서 언급된 주요 경쟁 브랜드 이름 3개 목록
   - sentiment_valence: 감성 극성 (-1.0 매우 부정 ~ +1.0 매우 긍정)
   - recommendation_strength: 소비자 추천 강도 (0 ~ 100 점)

AI 응답 텍스트:
"""
${combinedTexts}
"""

분석 결과를 아래 JSON 스키마에 맞춰 반환하세요.`;

    const jsonSchema = {
      type: 'object',
      properties: {
        tone_warmth: { type: 'number' },
        tone_formality: { type: 'number' },
        tone_confidence: { type: 'number' },
        tone_expertise: { type: 'number' },
        tone_empathy: { type: 'number' },
        brand_term_usage: { type: 'number' },
        technical_term_ratio: { type: 'number' },
        hedging_ratio: { type: 'number' },
        category_placement: { type: 'string' },
        competitive_frame: { type: 'array', items: { type: 'string' } },
        sentiment_valence: { type: 'number' },
        recommendation_strength: { type: 'number' },
        analysis_details: { type: 'object' }
      },
      required: [
        'tone_warmth', 'tone_formality', 'tone_confidence', 'tone_expertise', 'tone_empathy',
        'brand_term_usage', 'technical_term_ratio', 'hedging_ratio',
        'category_placement', 'competitive_frame', 'sentiment_valence', 'recommendation_strength',
        'analysis_details'
      ]
    };

    let observed: ObservedParametricPersona;

    try {
      const response = await provider.generateStructuredOutput<any>(prompt, jsonSchema);
      
      observed = {
        workspace_id: workspaceId,
        website_url: websiteUrl,
        engine_name: engineName,
        linked_persona_spec_id: personaSpec?.id || null,
        linked_vibe_spec_id: vibeSpec?.id || null,
        tone_warmth: Math.max(0, Math.min(1, response.tone_warmth)),
        tone_formality: Math.max(0, Math.min(1, response.tone_formality)),
        tone_confidence: Math.max(0, Math.min(1, response.tone_confidence)),
        tone_expertise: Math.max(0, Math.min(1, response.tone_expertise)),
        tone_empathy: Math.max(0, Math.min(1, response.tone_empathy)),
        brand_term_usage: Math.max(0, Math.min(100, response.brand_term_usage)),
        technical_term_ratio: Math.max(0, Math.min(100, response.technical_term_ratio)),
        hedging_ratio: Math.max(0, Math.min(100, response.hedging_ratio)),
        category_placement: response.category_placement,
        competitive_frame: response.competitive_frame || [],
        sentiment_valence: Math.max(-1, Math.min(1, response.sentiment_valence)),
        recommendation_strength: Math.max(0, Math.min(100, response.recommendation_strength)),
        persona_alignment_score: null,
        vibe_alignment_score: null,
        analysis_details: response.analysis_details || {},
        sample_size: responseTexts.length,
        measured_at: measuredAt
      };
    } catch (e: any) {
      console.warn(`[Persona Agent] Analysis failed: ${e.message}. Using fallback observed profile.`);
      
      // Fallback Profile
      observed = {
        workspace_id: workspaceId,
        website_url: websiteUrl,
        engine_name: engineName,
        linked_persona_spec_id: personaSpec?.id || null,
        linked_vibe_spec_id: vibeSpec?.id || null,
        tone_warmth: 0.6,
        tone_formality: 0.7,
        tone_confidence: 0.8,
        tone_expertise: 0.75,
        tone_empathy: 0.5,
        brand_term_usage: 40,
        technical_term_ratio: 50,
        hedging_ratio: 20,
        category_placement: '더마 스킨케어 브랜드',
        competitive_frame: competitorNamesFallback(brandName),
        sentiment_valence: 0.4,
        recommendation_strength: 75,
        persona_alignment_score: null,
        vibe_alignment_score: null,
        analysis_details: { fallback: true, error: e.message },
        sample_size: responseTexts.length,
        measured_at: measuredAt
      };
    }

    // 4. Calculate alignment with PersonaSpec if provided
    if (personaSpec) {
      try {
        const alignmentPrompt = `아래는 브랜드 "${brandName}"의 의도된 페르소나 정의(Intended Persona Spec)와 
실제 AI 검색엔진 응답에서 추출된 관측 페르소나(Observed Persona) 정보입니다.

의도된 페르소나 정의:
${personaSpec.prompt_text}

관측된 페르소나 벡터:
- warmth: ${observed.tone_warmth}
- formality: ${observed.tone_formality}
- confidence: ${observed.tone_confidence}
- expertise: ${observed.tone_expertise}
- empathy: ${observed.tone_empathy}

두 페르소나가 의미적으로 얼마나 일치하는지 정합도 점수(0~100 점)와 분석 의견을 평가해주세요.`;

        const alignSchema = {
          type: 'object',
          properties: {
            alignment_score: { type: 'number' },
            rationale: { type: 'string' }
          },
          required: ['alignment_score', 'rationale']
        };

        const alignRes = await provider.generateStructuredOutput<{ alignment_score: number; rationale: string }>(
          alignmentPrompt,
          alignSchema
        );
        
        observed.persona_alignment_score = Math.max(0, Math.min(100, alignRes.alignment_score));
        observed.analysis_details = {
          ...observed.analysis_details,
          persona_alignment_rationale: alignRes.rationale
        };
      } catch (_) {
        observed.persona_alignment_score = 80; // Safe default
      }
    }

    // 5. Calculate alignment with VibeSpec if provided (using Cosine Similarity)
    if (vibeSpec && vibeSpec.target_vector) {
      // Map observed tone properties to VibeSpec keys
      // VibeSpec typical keys: clinical, warm, luxury
      const observedVector: Record<string, number> = {
        warm: observed.tone_warmth * 100,
        clinical: observed.tone_expertise * 100,
        luxury: (observed.tone_confidence * 50) + (observed.tone_formality * 50)
      };
      
      const targetVector = vibeSpec.target_vector as Record<string, number>;
      const similarity = this.cosineSimilarity(targetVector, observedVector);
      observed.vibe_alignment_score = Math.round(similarity * 100);
    }

    // Write snapshot to database if possible
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from('observed_parametric_personas')
        .insert(observed)
        .select()
        .single();
        
      if (error) {
        console.warn(`[Persona Agent] DB insertion failed: ${error.message}`);
      } else if (data) {
        observed.id = data.id;
      }
    } catch (_) {}

    return observed;
  }
}

function competitorNamesFallback(brand: string): string[] {
  if (brand.includes('dr-o') || brand.includes('dr.o') || brand.includes('닥터오')) {
    return ['닥터자르트', 'CNP', '라운드랩'];
  }
  return ['경쟁사A', '경쟁사B', '경쟁사C'];
}
