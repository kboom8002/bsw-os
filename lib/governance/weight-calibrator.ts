import { getSupabaseAdminClient } from "../supabase";

export interface CalibrationResult {
  questionId: string;
  baseWeight: number;
  calibratedWeight: number;
  reason: string;
}

export class WeightCalibrator {
  /**
   * Recalibrates question weights based on observation metrics.
   *
   * 공식: calibrated_weight = base_weight * observation_boost * recency_decay
   *   - observation_boost: 관측 결과 brand_mention_rate > 0.5 → boost 1.15, < 0.2 → decay 0.85
   *   - recency_decay: 30일 이상 관측 미실행 → decay 0.90, 90일 이상 → 0.75
   *
   * [v2.0] 멘션 판정을 응답 텍스트 길이가 아닌 실제 브랜드 엔티티 매칭으로 교체.
   */
  public async calibrateWorkspace(workspaceId: string): Promise<CalibrationResult[]> {
    const supabase = getSupabaseAdminClient();
    const results: CalibrationResult[] = [];

    // Fetch all active questions
    const { data: questions } = await supabase
      .from("probe_questions")
      .select("id, weight, base_weight, calibrated_weight, created_at")
      .eq("workspace_id", workspaceId)
      .eq("lifecycle_status", "active");

    if (!questions || questions.length === 0) return [];

    // 워크스페이스의 브랜드 엔티티 목록을 사전 로딩 (브랜드명 + aliases)
    const brandEntities = await this.loadBrandEntities(workspaceId);

    for (const q of questions) {
      const baseWeight = q.base_weight ?? q.weight ?? 1.0;

      // Check observation metrics for this question
      const { data: runs } = await supabase
        .from("probe_runs")
        .select("created_at, raw_response_text")
        .eq("workspace_id", workspaceId)
        .eq("probe_question_id", q.id)
        .order("created_at", { ascending: false })
        .limit(5);

      let observationBoost = 1.0;
      let recencyDecay = 1.0;
      let reason = "no_change";

      if (runs && runs.length > 0) {
        // [v2.0] 실제 브랜드 엔티티 매칭 기반 멘션율 계산
        // 기존: (r.raw_response_text || "").length > 50 (단순 텍스트 길이 체크 — 부정확)
        // 개선: 브랜드명/aliases가 응답 텍스트에 실제로 등장하는지 정규식 매칭
        const mentionCount = runs.filter(r => 
          this.detectBrandMention(r.raw_response_text || "", brandEntities)
        ).length;
        const mentionRate = mentionCount / runs.length;

        if (mentionRate > 0.5) {
          observationBoost = 1.15;
          reason = "high_brand_mention_rate";
        } else if (mentionRate < 0.2) {
          observationBoost = 0.85;
          reason = "low_brand_mention_rate";
        }

        // Recency decay: days since last observation
        const lastRunDate = new Date(runs[0].created_at);
        const daysSinceRun = (Date.now() - lastRunDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceRun > 90) {
          recencyDecay = 0.75;
          reason += "+stale_90d";
        } else if (daysSinceRun > 30) {
          recencyDecay = 0.90;
          reason += "+aging_30d";
        }
      } else {
        // Never observed — apply mild decay
        recencyDecay = 0.85;
        reason = "never_observed";
      }

      const calibratedWeight = Number((baseWeight * observationBoost * recencyDecay).toFixed(2));

      // Clamp to [0.3, 2.0]
      const clamped = Math.max(0.3, Math.min(2.0, calibratedWeight));

      await supabase
        .from("probe_questions")
        .update({
          calibrated_weight: clamped,
          last_calibrated_at: new Date().toISOString(),
        })
        .eq("id", q.id);

      results.push({
        questionId: q.id,
        baseWeight,
        calibratedWeight: clamped,
        reason,
      });
    }

    return results;
  }

  /**
   * 워크스페이스의 브랜드 엔티티(이름 + aliases) 목록 로딩
   */
  private async loadBrandEntities(workspaceId: string): Promise<string[]> {
    const supabase = getSupabaseAdminClient();
    const { data: brands } = await supabase
      .from("brands")
      .select("name, aliases")
      .eq("workspace_id", workspaceId);

    if (!brands || brands.length === 0) return [];

    const entities: string[] = [];
    for (const brand of brands) {
      if (brand.name) entities.push(brand.name);
      if (Array.isArray(brand.aliases)) {
        entities.push(...brand.aliases.filter((a: string) => a && a.length > 0));
      }
    }
    return entities;
  }

  /**
   * 응답 텍스트에서 브랜드 엔티티가 실제로 언급되었는지 판정
   * 대소문자 무시, 한국어 브랜드명 포함 지원
   */
  private detectBrandMention(responseText: string, brandEntities: string[]): boolean {
    if (!responseText || brandEntities.length === 0) return false;
    const lowerText = responseText.toLowerCase();
    return brandEntities.some(entity => {
      // 정규식 이스케이프 + 대소문자 무시 매칭
      const escaped = entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(escaped, 'i').test(lowerText);
    });
  }
}
