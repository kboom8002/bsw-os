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
          const question = extractQuestionFromContent(signal.content);
          if (!question) {
            result.skipped++;
            continue;
          }

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
// 헬퍼: 콘텐츠에서 질문 추출
// ──────────────────────────────────────────────────────────────
function extractQuestionFromContent(content: string): string | null {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 5);
  if (lines.length === 0) return null;

  const title = lines[0].slice(0, 100);

  if (title.includes('?') || title.endsWith('가요') || title.endsWith('나요') ||
      title.endsWith('줘') || title.endsWith('줘요') || title.endsWith('해요') ||
      title.includes('추천') || title.includes('알려') || title.includes('어때')) {
    return title.replace('[Fallback]', '').trim();
  }

  if (title.length > 10 && !title.startsWith('[')) {
    return `${title} 관련해서 알려줘`;
  }

  return null;
}
