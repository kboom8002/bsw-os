import { getSupabaseAdminClient } from '../supabase';
import { probePanelSchema, probeQuestionSchema, expectedLayerSchema } from '../schema';
import { INDUSTRY_PANELS_DATA, IndustryType } from '../../db/seed/industry-panels/questions-data';

/**
 * Core DB execution layer for creating an industry-standard Probe Panel.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function createIndustryStandardPanelCore(
  workspaceId: string,
  industry: IndustryType,
  brandKeyword: string,
  competitorKeywords: string[]
): Promise<{ panelId: string; questionCount: number }> {
  const industryData = INDUSTRY_PANELS_DATA[industry];
  if (!industryData) {
    throw new Error(`INVALID_INDUSTRY: Industry "${industry}" is not supported.`);
  }

  const competitor = competitorKeywords[0] || "경쟁사";

  // 1. Generate unique panel slug and name
  const brandSlug = brandKeyword.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  const panelSlug = `${industryData.slug}-${brandSlug}`;
  const panelName = `[${brandKeyword}] ${industryData.panel_name}`;

  const supabase = getSupabaseAdminClient();

  // Check if panel already exists under this workspace to be idempotent
  const { data: existingPanel } = await supabase
    .from("probe_panels")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("slug", panelSlug)
    .eq("version", 1)
    .maybeSingle();

  let panelId = existingPanel?.id;

  if (!panelId) {
    const parsedPanel = probePanelSchema.parse({
      workspace_id: workspaceId,
      panel_name: panelName,
      slug: panelSlug,
      description: `${brandKeyword} 브랜드 맞춤형 ${industry} 업종 표준 AEO 관측 패널`,
      version: 1,
      is_locked: true,
      industry: industry,
      panel_type: "standard",
      sbs_index_target: industryData.sbs_index_target
    });

    const { data: newPanel, error: panelError } = await supabase
      .from("probe_panels")
      .insert(parsedPanel)
      .select("id")
      .single();

    if (panelError || !newPanel) {
      throw new Error(`DB Error creating panel: ${panelError?.message || "Unknown error"}`);
    }

    panelId = newPanel.id;
  }

  // 2. Iterate and seed questions
  let questionCount = 0;
  for (const q of industryData.questions) {
    // Replace place holders in question text
    const processedQuestionText = q.question_text
      .replace(/{brand}/g, brandKeyword)
      .replace(/{competitor}/g, competitor);

    // Check if question already exists in this panel
    const { data: existingQuestion } = await supabase
      .from("probe_questions")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("probe_panel_id", panelId)
      .eq("question_text", processedQuestionText)
      .maybeSingle();

    let questionId = existingQuestion?.id;

    const processedVariants = q.query_variants.map(v =>
      v.replace(/{brand}/g, brandKeyword).replace(/{competitor}/g, competitor)
    );

    if (!questionId) {
      // 시의성 감지: "올해", "최신", "트렌드", "이번" 등 시한부 표현
      const timeSensitivePatterns = ["올해", "최신", "트렌드", "이번", "요즘", "최근"];
      const isTimeSensitive = timeSensitivePatterns.some(p =>
        processedQuestionText.includes(p) || processedVariants.some(v => v.includes(p))
      );

      // TTL: 시의성 질문은 6개월 후 만료, 일반 질문은 null
      const ttlExpiresAt = isTimeSensitive
        ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const parsedQuestion = probeQuestionSchema.parse({
        workspace_id: workspaceId,
        probe_panel_id: panelId,
        question_text: processedQuestionText,
        intent_context: q.intent_context,
        target_keyword: q.target_keyword.replace(/{brand}/g, brandKeyword),
        risk_level: q.risk_level,
        decision_stage: q.decision_stage,
        question_type: q.question_type,
        weight: q.weight,
        query_variants: processedVariants,
        lifecycle_status: 'active',
        is_time_sensitive: isTimeSensitive,
        ttl_expires_at: ttlExpiresAt,
        base_weight: q.weight,
        funnel_stage: 'intake',
      });

      const { data: newQuestion, error: qError } = await supabase
        .from("probe_questions")
        .insert(parsedQuestion)
        .select("id")
        .single();

      if (qError || !newQuestion) {
        throw new Error(`DB Error creating question: ${qError?.message}`);
      }
      questionId = newQuestion.id;
    }

    // Process and seed Expected Layers
    const processedMustInclude = q.must_include.map(v =>
      v.replace(/{brand}/g, brandKeyword).replace(/{competitor}/g, competitor)
    );
    const processedShouldInclude = q.should_include.map(v =>
      v.replace(/{brand}/g, brandKeyword).replace(/{competitor}/g, competitor)
    );
    const processedMustNotDo = q.must_not_do.map(v =>
      v.replace(/{brand}/g, brandKeyword).replace(/{competitor}/g, competitor)
    );

    const parsedExpectedLayer = expectedLayerSchema.parse({
      workspace_id: workspaceId,
      probe_question_id: questionId,
      must_include: processedMustInclude,
      should_include: processedShouldInclude,
      must_not_do: processedMustNotDo,
      expected_layer_version: 1
    });

    const { error: elError } = await supabase
      .from("expected_layers")
      .upsert(parsedExpectedLayer, { onConflict: "workspace_id,probe_question_id" });

    if (elError) {
      throw new Error(`DB Error creating expected layer: ${elError.message}`);
    }

    questionCount++;
  }

  return { panelId, questionCount };
}
