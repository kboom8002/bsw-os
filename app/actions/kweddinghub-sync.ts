"use server";

import { getSupabaseAdminClient } from "../../lib/supabase";
import { checkWorkspacePermission } from "../../lib/auth";
import { qisPredictedQuestionSchema } from "../../lib/qis-shared-schemas";
import { QuestionPredictor } from "../../lib/prediction/question-predictor";
import { scoreQuestionValue } from "./qvs";

const SIMULATED_USER_ID = "00000000-0000-0000-0000-000000000001";
const KWEDDINGHUB_API_URL = process.env.KWEDDINGHUB_API_URL || 'http://localhost:3000';
const KWEDDINGHUB_API_KEY = process.env.KWEDDINGHUB_API_KEY || 'mock-kweddinghub-api-key-for-dev';

/**
 * 1. BSW의 최신 예측 질문들을 KWeddingHub로 전송 (Push Predictions)
 */
export async function pushPredictionsToKWeddingHub(workspaceId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to push predictions.");
  }

  const supabase = getSupabaseAdminClient();

  // 아직 동기화되지 않은 wedding 업종 예측 질문 조회 (최근 50개)
  const { data: predictions, error } = await supabase
    .from("predicted_questions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("industry", "wedding")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`DB Error fetching predictions: ${error.message}`);
  }

  if (!predictions || predictions.length === 0) {
    return { ok: true, count: 0 };
  }

  // qisPredictedQuestionSchema에 맞춰 전송 데이터 포맷팅
  const formattedPredictions = predictions.map((pred: any) => {
    // QVS 조인 시도 (있을 경우 qvs_composite 포함)
    return qisPredictedQuestionSchema.parse({
      bsw_question_id: pred.id,
      question_text: pred.question_text,
      predicted_intent: pred.predicted_intent,
      predicted_volume: pred.predicted_volume === "high" ? "high" : pred.predicted_volume === "low" ? "low" : "medium",
      confidence: Number(pred.confidence) || 0.5,
      first_mover_window_days: pred.first_mover_window_days || 30,
      current_ai_coverage: pred.current_ai_coverage || "none",
      auto_must_include: pred.auto_must_include || [],
      auto_must_not_do: pred.auto_must_not_do || [],
      qvs_composite: undefined, // qvs_composite는 선택사항
    });
  });

  try {
    console.log(`[Sync-Predictions] Pushing ${formattedPredictions.length} predictions to KWeddingHub...`);
    const response = await fetch(`${KWEDDINGHUB_API_URL}/api/v1/qis/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-QIS-Api-Key": KWEDDINGHUB_API_KEY,
      },
      body: JSON.stringify({ predictions: formattedPredictions }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Bridge API Error ${response.status}: ${text}`);
    }

    const res = await response.json();
    return { ok: true, count: res.received || formattedPredictions.length };
  } catch (err) {
    console.error("[Sync-Predictions] Sync push failed", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * 2. KWeddingHub의 실시간 예측 검증 피드백을 수집하여 AccuracyTracker에 반영 (Pull Feedback)
 */
export async function pullFeedbackFromKWeddingHub(workspaceId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to pull feedback.");
  }

  try {
    console.log(`[Sync-Feedback] Pulling emergence feedbacks from KWeddingHub...`);
    const response = await fetch(`${KWEDDINGHUB_API_URL}/api/v1/qis/feedback`, {
      method: "GET",
      headers: {
        "X-QIS-Api-Key": KWEDDINGHUB_API_KEY,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Bridge API Error ${response.status}: ${text}`);
    }

    const res = await response.json();
    if (!res.ok || !Array.isArray(res.feedbacks)) {
      throw new Error("Invalid response format");
    }

    const feedbacks = res.feedbacks;
    console.log(`[Sync-Feedback] Retreived ${feedbacks.length} feedbacks from KWeddingHub.`);

    const predictor = new QuestionPredictor();
    let processedCount = 0;

    for (const fb of feedbacks) {
      // BSW의 predicted_questions 테이블 업데이트 및 수퍼 포캐스트 분석 실행
      await predictor.submitFeedback(
        fb.bsw_question_id,
        fb.emerged,
        fb.emerged_at || null
      );
      processedCount++;
    }

    return { ok: true, count: processedCount };
  } catch (err) {
    console.error("[Sync-Feedback] Pulling feedback failed", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * 3. KWeddingHub의 실시간 실측 메트릭을 Pull 하여 BSW QVS 산출 가중치에 주입
 */
export async function pullRealMetricsFromKWeddingHub(workspaceId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to pull metrics.");
  }

  try {
    console.log(`[Sync-Metrics] Pulling transaction metrics from KWeddingHub...`);
    const response = await fetch(`${KWEDDINGHUB_API_URL}/api/v1/qis/metrics`, {
      method: "GET",
      headers: {
        "X-QIS-Api-Key": KWEDDINGHUB_API_KEY,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Bridge API Error ${response.status}: ${text}`);
    }

    const res = await response.json();
    if (!res.ok || !Array.isArray(res.data)) {
      throw new Error("Invalid response format");
    }

    const metrics = res.data;
    console.log(`[Sync-Metrics] Received ${metrics.length} metric records from KWeddingHub.`);

    // 메트릭 데이터를 parsing하여 QVS에 가중치로 업데이트
    let conversionRate = 0.15; // default baseline
    let avgPriceValue = 20000000; // default baseline (20,000,000 KRW)
    let freqCount = 1.0;

    for (const metric of metrics) {
      if (metric.metric_type === "conversion_rate") {
        conversionRate = Number(metric.value) || conversionRate;
      } else if (metric.metric_type === "average_transaction") {
        avgPriceValue = Number(metric.value) || avgPriceValue;
      } else if (metric.metric_type === "question_frequency") {
        freqCount = Number(metric.value) || freqCount;
      }
    }

    // 획득한 실측 메트릭을 기준으로 QVS 점수들을 배치 재계산 실행
    const supabase = getSupabaseAdminClient();
    const { data: predictedList } = await supabase
      .from("predicted_questions")
      .select("id, predicted_intent")
      .eq("workspace_id", workspaceId)
      .eq("industry", "wedding");

    let updatedQvsCount = 0;

    if (predictedList && predictedList.length > 0) {
      for (const pred of predictedList) {
        // 의도(Intent)와 빈도, 객단가(ARPU)를 QVS 환산 변수로 매핑
        // conversion_score: baseline 전환율 * 가중치
        const conversionScore = Number(conversionRate.toFixed(4));
        
        // arpu_score: 실거래 평균 단가 백만원 단위 환산
        const arpuScore = Number((avgPriceValue / 1000000).toFixed(2));
        
        // volume_score: 질문 발생 빈도 가중치 환산 (예: informational=1, transactional=3)
        const volumeScore = pred.predicted_intent === "transactional" ? 3 : pred.predicted_intent === "commercial" ? 2 : 1;

        // QVS 산출 및 DB 갱신 위임 (기존 BSW Actions qvs.ts 호출)
        await scoreQuestionValue(workspaceId, {
          predicted_question_id: pred.id,
          volume_score: volumeScore,
          conversion_score: conversionScore,
          arpu_score: arpuScore,
          competition_score: 0.25, // default
          industry: "wedding",
          scoring_method: "auto",
        });

        updatedQvsCount++;
      }
    }

    return { ok: true, qvsUpdated: updatedQvsCount };
  } catch (err) {
    console.error("[Sync-Metrics] Pulling metrics failed", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
