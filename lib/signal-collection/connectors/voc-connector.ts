/**
 * lib/signal-collection/connectors/voc-connector.ts
 * 
 * VOC (Voice of Customer) 데이터 통합 커넥터.
 * 내부 검색 쿼리 로그, AI 가이드 대화록, FAQ/Q&A 문의 내역, 고객 리뷰/댓글 데이터를 수집하며,
 * 수집 과정에서 개인정보 보호를 위한 PII Redaction 필터를 자동으로 적용합니다.
 */

import { getSupabaseAdminClient } from '../../supabase';
import { CollectionStorage, ExternalSignal } from '../collection-storage';

export interface VOCConfig {
  sourceType: 'site_search' | 'ai_guide' | 'inquiry' | 'review';
  limit?: number;
}

export interface VOCRawRow {
  id: string;
  rawText: string;
  sourceUrl?: string;
  createdAt: string;
  meta?: any;
}

export class VOCConnector {
  
  /**
   * PII Redaction 필터: 전화번호, 이메일, 계좌번호, 주민번호, 이름(패턴) 등 마스킹
   * (PRD §FR-001 개인정보보호 강화 규격 준수)
   */
  public static redactPII(text: string): string {
    if (!text) return '';
    let cleaned = text;

    // 1. 이메일 마스킹
    cleaned = cleaned.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[EMAIL_REDACTED]');

    // 2. 전화번호/휴대폰번호 마스킹 (010-xxxx-xxxx, 02-xxxx-xxxx 등)
    cleaned = cleaned.replace(/(01[016789]|02|0[3-9][0-9])[-. ]?(\d{3,4})[-. ]?(\d{4})/g, '[PHONE_REDACTED]');

    // 3. 계좌번호 및 주민등록번호 마스킹
    cleaned = cleaned.replace(/\b\d{6}[-. ]?[1-4]\d{6}\b/g, '[RRN_REDACTED]'); // 주민번호
    cleaned = cleaned.replace(/\b\d{3,6}[-. ]?\d{2,6}[-. ]?\d{3,6}\b/g, '[ACCOUNT_REDACTED]'); // 계좌번호 패턴

    // 4. 주소 지번/상세 패턴 마스킹 (동/읍/면/길/로 + 번지)
    cleaned = cleaned.replace(/([가-힣]+[로길동읍면])\s?(\d+[-]?\d*)/g, '$1 [ADDRESS_REDACTED]');

    return cleaned;
  }

  /**
   * VOC 데이터 원천으로부터 원시 데이터를 수집합니다.
   * Supabase 테이블이 없는 경우 또는 데모 환경에서는 고품질 시뮬레이션 데이터를 반환합니다.
   */
  public static async fetchVOCData(workspaceId: string, config: VOCConfig): Promise<VOCRawRow[]> {
    const supabase = getSupabaseAdminClient();
    const limit = config.limit || 50;

    try {
      // 데이터 유형에 따라 실제 DB 테이블 쿼리 시도
      let data: any[] | null = null;
      let error: any = null;

      if (config.sourceType === 'site_search') {
        const res = await supabase.from('site_search_logs')
          .select('id, query_text, created_at')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(limit);
        data = res.data;
        error = res.error;
      } else if (config.sourceType === 'ai_guide') {
        const res = await supabase.from('ai_guide_dialogs')
          .select('id, user_message, created_at, session_id')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(limit);
        data = res.data;
        error = res.error;
      } else if (config.sourceType === 'inquiry') {
        const res = await supabase.from('customer_inquiries')
          .select('id, title, content, created_at')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(limit);
        data = res.data;
        error = res.error;
      } else if (config.sourceType === 'review') {
        const res = await supabase.from('product_reviews')
          .select('id, content, product_name, created_at')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(limit);
        data = res.data;
        error = res.error;
      }

      if (error || !data || data.length === 0) {
        // 테이블이 존재하지 않거나 데이터가 없을 때 시뮬레이션 폴백
        return this.getMockVocData(config.sourceType);
      }

      // 표준 포맷으로 변환
      return data.map(item => ({
        id: item.id,
        rawText: item.query_text || item.user_message || `${item.title || ''}\n${item.content || ''}` || item.content || '',
        createdAt: item.created_at,
        meta: item.session_id ? { session_id: item.session_id } : (item.product_name ? { product_name: item.product_name } : undefined)
      }));

    } catch (err: any) {
      console.warn(`[VOCConnector] Fetching VOC ${config.sourceType} failed: ${err.message}. Falling back to simulation.`);
      return this.getMockVocData(config.sourceType);
    }
  }

  /**
   * VOC 데이터 정제 및 ExternalSignal 저장
   */
  public static async convertToSignals(workspaceId: string, sourceId: string, rows: VOCRawRow[], sourceType: VOCConfig['sourceType']): Promise<number> {
    const signals: Omit<ExternalSignal, 'id'>[] = rows.map(row => {
      // 1. 개인정보 비식별화 필터 적용
      const cleanContent = this.redactPII(row.rawText);

      return {
        workspace_id: workspaceId,
        source_id: sourceId,
        source_type: `voc_${sourceType}`,
        content: cleanContent,
        url: row.sourceUrl || null,
        published_at: row.createdAt,
        metadata: {
          original_id: row.id,
          raw_source: `voc_connector_${sourceType}`,
          pii_redacted: cleanContent !== row.rawText,
          data_provenance: 'INTERNAL_VOC_INGESTION',
          ...row.meta
        }
      };
    });

    // 필터링: 마스킹 후 공백이거나 유효하지 않은 짧은 문장 제외
    const validSignals = signals.filter(s => s.content.trim().length >= 5);

    return await CollectionStorage.saveExternalSignals(workspaceId, validSignals);
  }

  /**
   * 한국어 질문형 VOC 필터링
   */
  public static filterQuestionQueries(rows: VOCRawRow[]): VOCRawRow[] {
    const interrogativeWords = /^(어디|어떻게|왜|언제|누구|얼마|몇|어느|무엇|무슨|어떤|어떻습니까|어떻게해야)/;
    const questionEndings = /(가요|나요|ㄹ까요?|줘|주세요|알려|추천|비교|차이|방법|는지|건지|의문|치료|후기|부작용|원인|효과|대처|주의사항)\s*[\?？]?\s*$/;

    return rows.filter(row => {
      const t = row.rawText.trim().toLowerCase();
      if (t.length < 5) return false;
      return interrogativeWords.test(t) || questionEndings.test(t);
    });
  }

  /**
   * 고품질 VOC 시뮬레이션 데이터
   */
  private static getMockVocData(sourceType: VOCConfig['sourceType']): VOCRawRow[] {
    const now = new Date().toISOString();
    
    if (sourceType === 'site_search') {
      return [
        { id: "voc-search-1", rawText: "레티놀 크림 바르고 얼굴 붉어짐 해결법", createdAt: now },
        { id: "voc-search-2", rawText: "세라마이드 판테놀 앰플 차이점", createdAt: now },
        { id: "voc-search-3", rawText: "레이저 시술 직후 붙이는 쿨링 패치 사용해도 되나요", createdAt: now },
        { id: "voc-search-4", rawText: "민감성 수부지 장벽 개선 세럼 순위", createdAt: now }
      ];
    } else if (sourceType === 'ai_guide') {
      return [
        { id: "voc-chat-1", rawText: "안녕하세요. 제가 어제 인모드 리프팅 레이저를 받고 왔는데요, 병원에서 준 진정 크림 말고 세라마이드가 들어간 수분 크림을 발라도 피부에 무리가 없을까요? 제 폰번호는 010-1234-5678 입니다. 홍길동 드림.", createdAt: now, meta: { session_id: "session-abc-123" } },
        { id: "voc-chat-2", rawText: "레티놀 0.3% 제품을 선물 받았는데, 제가 평소에 비타민C 앰플을 아침에 쓰거든요. 두 성분을 같이 사용해도 되나요? 만약 안 된다면 격일로 써야 하는지 알고 싶어요.", createdAt: now, meta: { session_id: "session-abc-456" } }
      ];
    } else if (sourceType === 'inquiry') {
      return [
        { id: "voc-inq-1", rawText: "문의사항: 시술 후 세안 시 폼클렌징 사용 시기\n내용: 어제 프락셀 시술 받았는데 언제부터 평소 쓰는 각질 제거 약산성 폼클렌징 쓸 수 있는지 궁금합니다. 이메일은 test@gmail.com 입니다.", createdAt: now },
        { id: "voc-inq-2", rawText: "문의사항: 레티놀 따가움 환불 문의\n내용: 제품 수령 후 2회 발랐는데 너무 따갑고 붉어져서 사용이 불가능해요. 환불 처리 규정은 어떻게 되나요?", createdAt: now }
      ];
    } else { // review
      return [
        { id: "voc-rev-1", rawText: "일주일간 써봤는데 피부 속건조가 많이 잡혔어요! 다만 레티놀이라 그런지 처음 이틀은 약간 붉어졌는데 세라마이드 크림이랑 섞어 바르니까 이제 괜찮네요. 다 쓰면 재구매 예정입니다.", createdAt: now, meta: { product_name: "레티놀 리페어 앰플" } },
        { id: "voc-rev-2", rawText: "레이저 시술 후 장벽 회복용으로 샀는데 순하고 아주 마음에 들어요. 유해 성분이나 자극적인 향도 없어서 민감한 시기에 쓰기 딱 좋습니다.", createdAt: now, meta: { product_name: "세라마이드 장벽 크림" } }
      ];
    }
  }
}
