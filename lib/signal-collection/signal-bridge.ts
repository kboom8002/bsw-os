/**
 * lib/signal-collection/signal-bridge.ts
 *
 * 외부 수집 데이터(external_signals, search_trends)를
 * S-OGDE 파이프라인에 연결하는 브릿지 모듈.
 *
 * 3가지 경로:
 * 1. buildContextChunks() — VOCChunk[] 로 변환하여 LLM 컨텍스트 주입
 * 2. convertExternalToQuestionSignals() — question_signals 직접 생성
 * 3. enrichVolumeFromTrends() — DataLab 트렌드로 volume 보정
 */

import { getSupabaseAdminClient } from '../supabase';
import type { VOCChunk } from './types';
import { getAIProvider } from '../ai/ai-provider';

export interface BridgeResult {
  converted: number;
  skipped: number;
  errors: string[];
}

export interface VolumeEnrichResult {
  enriched: number;
  errors: string[];
}

export class SignalBridge {

  // ──────────────────────────────────────────────────────────────
  // 경로 1: external_signals → VOCChunk[] (S-OGDE contextChunks)
  // ──────────────────────────────────────────────────────────────
  /**
   * 최근 수집된 외부 시그널을 VOC 청크로 변환하여
   * MetaQuestionEngine과 ExploratoryChain의 컨텍스트로 주입 가능하게 반환합니다.
   */
  static async buildContextChunks(
    workspaceId: string,
    industryKey: string,
    maxItems: number = 20
  ): Promise<VOCChunk[]> {
    try {
      const supabase = getSupabaseAdminClient();

      const { data: signals, error } = await supabase
        .from('external_signals')
        .select('content, source_type, url, published_at')
        .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
        .order('collected_at', { ascending: false })
        .limit(maxItems);

      if (error || !signals || signals.length === 0) {
        console.log(`[SignalBridge] No external signals found for context injection.`);
        return [];
      }

      const chunks: VOCChunk[] = signals.map(s => ({
        text: s.content,
        source: s.source_type || 'external',
        timestamp: s.published_at || new Date().toISOString(),
      }));

      console.log(`[SignalBridge] Built ${chunks.length} context chunks from external signals.`);
      return chunks;

    } catch (err: any) {
      console.error(`[SignalBridge] buildContextChunks error: ${err.message}`);
      return [];
    }
  }

  // ──────────────────────────────────────────────────────────────
  // 경로 2: external_signals → question_signals 직접 변환
  // ──────────────────────────────────────────────────────────────
  /**
   * 미변환 외부 시그널에서 질문 패턴을 추출하여
   * question_signals 테이블에 직접 삽입합니다.
   * [v2.0] 다층식 QuestionDetector 모듈 도입으로 오탐률 대폭 감소.
   */
  static async convertExternalToQuestionSignals(
    workspaceId: string,
    industryKey: string
  ): Promise<BridgeResult> {
    const result: BridgeResult = { converted: 0, skipped: 0, errors: [] };

    try {
      const supabase = getSupabaseAdminClient();

      const { data: signals, error } = await supabase
        .from('external_signals')
        .select('id, content, source_type, metadata')
        .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
        .eq('is_converted', false)
        .order('collected_at', { ascending: false })
        .limit(30);

      if (error || !signals || signals.length === 0) {
        console.log(`[SignalBridge] No unconverted external signals.`);
        return result;
      }

      for (const signal of signals) {
        try {
          // [v2.0] QuestionDetector 비동기 detect 함수 적용
          const detectRes = await QuestionDetector.detect(signal.content);
          if (!detectRes.isQuestion || !detectRes.questionText) {
            result.skipped++;
            continue;
          }

          const question = detectRes.questionText;

          const { error: insertErr } = await supabase
            .from('question_signals')
            .insert({
              workspace_id: workspaceId,
              query: question,
              volume: 0,
              intent: 'informational',
              status: 'mined',
              source_type: `external_${signal.source_type}`,
              normalized_question: question,
              language: 'ko',
              locale: 'ko-KR',
              source_payload: {
                original_content: signal.content.slice(0, 500),
                source_type: signal.source_type,
                external_signal_id: signal.id,
              },
            });

          if (insertErr) {
            result.errors.push(`Insert failed: ${insertErr.message}`);
            continue;
          }

          await supabase
            .from('external_signals')
            .update({ is_converted: true })
            .eq('id', signal.id);

          result.converted++;

        } catch (itemErr: any) {
          result.errors.push(`Item error: ${itemErr.message}`);
        }
      }

      console.log(`[SignalBridge] Converted ${result.converted}/${signals.length} external signals to question signals.`);
      return result;

    } catch (err: any) {
      result.errors.push(err.message);
      console.error(`[SignalBridge] convertExternalToQuestionSignals error: ${err.message}`);
      return result;
    }
  }

  // ──────────────────────────────────────────────────────────────
  // 경로 3: search_trends → question_signals 볼륨 보정
  // ──────────────────────────────────────────────────────────────
  /**
   * DataLab 트렌드 데이터를 활용하여
   * 기존 question_signals의 volume을 보정합니다.
   */
  static async enrichVolumeFromTrends(
    workspaceId: string
  ): Promise<VolumeEnrichResult> {
    const result: VolumeEnrichResult = { enriched: 0, errors: [] };

    try {
      const supabase = getSupabaseAdminClient();

      const { data: trends } = await supabase
        .from('search_trends')
        .select('keyword, relative_volume')
        .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!trends || trends.length === 0) return result;

      const trendMap = new Map<string, number>();
      for (const t of trends) {
        const existing = trendMap.get(t.keyword) || 0;
        trendMap.set(t.keyword, Math.max(existing, t.relative_volume));
      }

      const { data: signals } = await supabase
        .from('question_signals')
        .select('id, query')
        .eq('workspace_id', workspaceId)
        .eq('volume', 0)
        .limit(50);

      for (const signal of signals || []) {
        const query = (signal.query as string).toLowerCase();
        let maxVolume = 0;

        for (const [keyword, volume] of trendMap.entries()) {
          if (query.includes(keyword.toLowerCase())) {
            maxVolume = Math.max(maxVolume, volume);
          }
        }

        if (maxVolume > 0) {
          const { error } = await supabase
            .from('question_signals')
            .update({ volume: Math.round(maxVolume * 1000) })
            .eq('id', signal.id);

          if (!error) result.enriched++;
        }
      }

      console.log(`[SignalBridge] Enriched volume for ${result.enriched} signals.`);
      return result;

    } catch (err: any) {
      result.errors.push(err.message);
      return result;
    }
  }
}

// ──────────────────────────────────────────────────────────────
// [v2.0] QuestionDetector: 다층형 질문 감지 모듈
// ──────────────────────────────────────────────────────────────
export class QuestionDetector {
  
  /**
   * Level 1: 규칙 기반 질문 감지 (한국어 의문사/어미 및 기호 필터)
   */
  public static ruleBasedDetect(text: string): { isQuestion: boolean; confidence: number } {
    const cleanText = text.replace(/\[Fallback\]/g, '').trim().toLowerCase();
    if (cleanText.length < 5) {
      return { isQuestion: false, confidence: 0.0 };
    }

    const interrogativeWords = /^(어디|어떻게|왜|언제|누구|얼마|몇|어느|무엇|무슨|어떤|어떻습니까|어떻게해야)/;
    const questionEndings = /(가요|나요|ㄹ까요?|줘|주세요|알려|추천|비교|차이|방법|는지|건지|의문|치료|후기|부작용|원인|효과|대처|주의사항)\s*[\?？]?\s*$/;

    const hasInterrogative = interrogativeWords.test(cleanText);
    const hasEnding = questionEndings.test(cleanText);
    const hasQuestionMark = cleanText.includes('?');

    // 의문사와 질문형 어미가 모두 등장하거나, 명확한 물음표가 있는 경우 높은 확신도 부여
    if (hasInterrogative && hasEnding) {
      return { isQuestion: true, confidence: 0.95 };
    }
    if ((hasInterrogative || hasEnding) && hasQuestionMark) {
      return { isQuestion: true, confidence: 0.90 };
    }
    
    // 단순 의문형 어미 혹은 질문 키워드만 있는 경우 중간 확신도
    if (hasInterrogative || hasEnding || hasQuestionMark) {
      return { isQuestion: true, confidence: 0.75 };
    }

    // 명백히 질문 패턴이 안 보일 때
    return { isQuestion: false, confidence: 0.20 };
  }

  /**
   * Level 2: 임베딩 기반 분류 (Phase 2에서 완비 예정, 현재는 Level 1 통과 처리)
   */
  public static async embeddingClassify(text: string): Promise<{ isQuestion: boolean; confidence: number }> {
    return this.ruleBasedDetect(text);
  }

  /**
   * Level 3: LLM 기반 최종 질문 판정 및 정규화 추출 (Confidence가 중위권일 때 가동)
   */
  public static async llmClassify(text: string): Promise<{ isQuestion: boolean; questionText: string | null }> {
    try {
      const ai = getAIProvider();
      
      const prompt = `당신은 유입 문장이 소비자가 입력한 실제 질문/고민형 검색 쿼리인지 판정하는 AI 전문가입니다.
문장: "${text}"

위 문장을 분석하여:
1. 소비자가 해결하려는 실제 질문이나 고민의 목적이 드러나 있는지 (isQuestion: true/false) 판정하십시오.
2. 질문이 맞다면, 불필요한 서술어(예: "안녕하세요", "홍길동 드림") 및 PII 정보들을 제거하고 자연스러운 한국어 검색 질문형으로 정제한 대표 쿼리를 추출하십시오 (questionText).

다음 JSON 스키마를 엄격히 따르십시오.`;

      const schema = {
        type: 'OBJECT',
        properties: {
          isQuestion: { type: 'BOOLEAN' },
          questionText: { type: 'STRING', nullable: true }
        },
        required: ['isQuestion', 'questionText']
      };

      const result = await ai.generateStructuredOutput<{ isQuestion: boolean; questionText: string | null }>(
        prompt,
        schema,
        { temperature: 0.1 }
      );

      return {
        isQuestion: result.isQuestion,
        questionText: result.isQuestion ? (result.questionText || text) : null
      };

    } catch (err: any) {
      console.warn('[QuestionDetector] LLM classification error (falling back to rule):', err.message);
      const rule = this.ruleBasedDetect(text);
      return {
        isQuestion: rule.isQuestion,
        questionText: rule.isQuestion ? text : null
      };
    }
  }

  /**
   * E2E 다층 감지 오케스트레이션
   */
  public static async detect(text: string): Promise<{ isQuestion: boolean; questionText: string | null }> {
    // 1. 규칙 기반 스캔
    const ruleResult = this.ruleBasedDetect(text);
    
    // 확신도 임계값 분기
    if (ruleResult.confidence >= 0.90) {
      return { isQuestion: true, questionText: text.replace(/\[Fallback\]/g, '').trim() };
    }
    if (ruleResult.confidence < 0.30) {
      return { isQuestion: false, questionText: null };
    }

    // 2. 중간 구역(0.30 ~ 0.90)은 LLM 기반으로 2차 정밀 판정 및 정제
    return await this.llmClassify(text);
  }
}
