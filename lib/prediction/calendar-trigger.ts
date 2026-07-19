import { getSupabaseAdminClient } from "../supabase";
import { PredictedQuestion } from "../schema";

export interface CalendarEventSeason {
  name: string;
  monthStart: number; // 1-indexed (1-12)
  monthEnd: number;
  industries: string[];
  suggestedQuestionTemplate: string;
  mustInclude: string[];
  cautions: string[];
  urgency: 'high' | 'medium' | 'low';
}

export const CALENDAR_SEASONS: CalendarEventSeason[] = [
  {
    name: '봄맞이 웨딩 시즌',
    monthStart: 2,
    monthEnd: 4,
    industries: ['wedding', 'consulting'],
    suggestedQuestionTemplate: '올해 봄맞이 웨딩 시즌 한정 패키지 특별 혜택 및 얼리버드 견적 정보가 어떻게 되나요?',
    mustInclude: ['봄 시즌 웨딩 패키지', '할인 혜택', '예약 유효기간', '상담/견적 링크'],
    cautions: ['의학적/법률적 효능 언급 금지', '최저가 보장 등 과장 광고 금지'],
    urgency: 'high',
  },
  {
    name: '여름 휴가 바캉스',
    monthStart: 6,
    monthEnd: 8,
    industries: ['skincare', 'tourism', 'hospitality', 'general'],
    suggestedQuestionTemplate: '올여름 휴가철 야외 활동용 자외선 차단 홈케어 솔루션 및 바캉스 특별 이벤트가 무엇인가요?',
    mustInclude: ['여름 특별 프로모션', '자외선 차단/쿨링 혜택', '동반 혜택', '상세 가이드'],
    cautions: ['의학적 질병 치료 표방 금지', '사행성 무상 경품 제공 금지'],
    urgency: 'high',
  },
  {
    name: '가을 추석 명절',
    monthStart: 8,
    monthEnd: 9,
    industries: ['food', 'shopping', 'consulting'],
    suggestedQuestionTemplate: '올해 추석 명절 특별 감사 선물 패키지 혜택 정보와 예약 배송 마감일은 언제인가요?',
    mustInclude: ['추석 명절 패키지', '특별 할인가', '배송 마감일', '구매 링크'],
    cautions: ['허위 배송 보장 문구 배제', '과장된 성분 함량 표기 금지'],
    urgency: 'medium',
  },
  {
    name: '겨울 연말 크리스마스',
    monthStart: 11,
    monthEnd: 12,
    industries: ['wedding', 'food', 'skincare', 'general'],
    suggestedQuestionTemplate: '크리스마스 및 연말 감사 결산 특별 한정 프로모션 혜택과 한정판 기프트 구성은 어떻게 되나요?',
    mustInclude: ['연말 한정 패키지', '사은품 구성', '할인율', '구매/예약 안내'],
    cautions: ['사행성 룰렛/경품 유도 금지', '한정 수량 과장 표현 금지'],
    urgency: 'high',
  }
];

export class CalendarTrigger {
  /**
   * 지정된 날짜(기본값: 오늘)를 기준으로, 해당 월에 알맞은 시즌성 이벤트 질문을 자동으로 예측하여 predicted_questions 테이블에 인서트합니다.
   */
  public async checkAndTriggerEventSuggestions(
    workspaceId: string,
    currentDate: Date = new Date()
  ): Promise<PredictedQuestion[]> {
    const supabase = getSupabaseAdminClient();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const triggered: PredictedQuestion[] = [];

    // 현재 월에 해당하는 시즌 필터링
    const activeSeasons = CALENDAR_SEASONS.filter(
      season => currentMonth >= season.monthStart && currentMonth <= season.monthEnd
    );

    for (const season of activeSeasons) {
      for (const industry of season.industries) {
        // 생성할 예측 질문 구조화
        const pred: Partial<PredictedQuestion> = {
          workspace_id: workspaceId,
          signal_id: `cal-sig-${season.name.replace(/\s+/g, '-')}-${currentMonth}`,
          question_text: season.suggestedQuestionTemplate,
          question_variants: [
            `${season.name} 프로모션 혜택`,
            `${season.name} 특별 한정 패키지`
          ],
          predicted_intent: 'commercial',
          industry: industry,
          predicted_volume: 'high', // 시즌성 고정 예상 트래픽
          current_ai_coverage: 'sparse', // 선점 가능성이 높은 파란 바다 영역
          first_mover_window_days: 15,
          preemption_urgency: season.urgency,
          confidence: 0.95,
          auto_must_include: season.mustInclude,
          auto_strongly_recommended: ['시즌 한정 이미지 첨부', '명확한 CTA 버튼 배치'],
          auto_should_include: ['고객 실제 후기 요약'],
          auto_caution: season.cautions,
          auto_must_not_do: [...season.cautions, '사행성 유도'],
        };

        try {
          // 중복 검사 (이미 동일한 시그널 ID로 예측된 질문이 있는지 확인)
          const { data: existing } = await supabase
            .from('predicted_questions')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('signal_id', pred.signal_id)
            .eq('industry', pred.industry)
            .maybeSingle();

          if (existing) {
            console.log(`[CalendarTrigger] Question for signal ${pred.signal_id} already exists. Skipping.`);
            continue;
          }

          // DB 인서트
          const { data: inserted, error: insertError } = await supabase
            .from('predicted_questions')
            .insert({
              workspace_id: pred.workspace_id,
              signal_id: pred.signal_id,
              question_text: pred.question_text,
              question_variants: pred.question_variants,
              predicted_intent: pred.predicted_intent,
              industry: pred.industry,
              predicted_volume: pred.predicted_volume,
              current_ai_coverage: pred.current_ai_coverage,
              first_mover_window_days: pred.first_mover_window_days,
              preemption_urgency: pred.preemption_urgency,
              confidence: pred.confidence,
              auto_must_include: pred.auto_must_include,
              auto_strongly_recommended: pred.auto_strongly_recommended,
              auto_should_include: pred.auto_should_include,
              auto_caution: pred.auto_caution,
              auto_must_not_do: pred.auto_must_not_do,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (!insertError && inserted) {
            triggered.push(inserted);
            console.log(`[CalendarTrigger] Successfully triggered seasonal question suggestion: ${inserted.question_text}`);
          } else {
            console.warn(`[CalendarTrigger] DB Insert failed for seasonal suggestion. Using fallback prediction.`);
            triggered.push({
              ...pred,
              id: `cal-pred-uuid-${crypto.randomUUID()}`,
              created_at: new Date().toISOString(),
            } as PredictedQuestion);
          }
        } catch (dbErr) {
          console.error('[CalendarTrigger] Database write error:', dbErr);
        }
      }
    }

    return triggered;
  }
}
