"use server";

import crypto from "crypto";
import { getSupabaseAdminClient } from "../../lib/supabase";
import { getAIProvider } from "../../lib/ai/ai-provider";
import { runUpstreamPipeline } from "./semantic";
import { requireAuthOrDemo } from "../../lib/auth";

interface BrandProfileInput {
  name: string;
  slug: string;
  industry_slug: string;
  brand_url: string;
  brand_description: string;
  primary_keywords: string[];
}

export async function createBrandWorkspace(input: BrandProfileInput) {
  const userId = await requireAuthOrDemo();
  const { name, slug, industry_slug, brand_url, brand_description, primary_keywords } = input;

  const adminClient = getSupabaseAdminClient();

  // Create Workspace
  const { data: ws, error: wsError } = await adminClient
    .from('workspaces')
    .insert({
      name,
      slug,
      industry_slug,
      brand_url,
      brand_description,
      primary_keywords,
      onboarding_step: 1
    })
    .select('id, slug')
    .single();

  if (wsError || !ws) {
    console.error("Workspace creation error:", wsError);
    return { success: false, error: wsError?.message || "Failed to create workspace." };
  }

  // Create Membership
  const { error: memError } = await adminClient
    .from('workspace_memberships')
    .insert({
      workspace_id: ws.id,
      user_id: userId,
      role: 'owner'
    });

  if (memError) {
    console.error("Membership creation error:", memError);
    return { success: false, error: memError.message };
  }

  // Create Domain for the workspace
  const { data: domain } = await adminClient
    .from('domains')
    .insert({
      workspace_id: ws.id,
      name: `${name} Domain`,
      slug: `${slug}-domain`,
      description: `${name} primary domain tracking`
    })
    .select('id')
    .single();

  // Create Brand Entity
  if (domain) {
    await adminClient
      .from('brand_entities')
      .insert({
        workspace_id: ws.id,
        name: name,
        slug: slug,
        domain_id: domain.id
      });
  }

  // Create Tenant Workspace Bridge
  await adminClient
    .from('tenant_workspace_bridge')
    .insert({
      aihompy_tenant_id: crypto.randomUUID(),
      aihompy_tenant_slug: slug,
      aihompy_industry: industry_slug,
      bsw_workspace_id: ws.id,
      sync_status: 'active'
    });

  return { success: true, workspaceSlug: ws.slug, workspaceId: ws.id };
}

export async function updateOnboardingStep(wsId: string, step: number) {
  const adminClient = getSupabaseAdminClient();
  const updateData: any = { onboarding_step: step };
  if (step === 4) {
    updateData.onboarding_completed_at = new Date().toISOString();
  }
  const { error } = await adminClient
    .from('workspaces')
    .update(updateData)
    .eq('id', wsId);
  
  if (error) {
    console.error("Failed to update onboarding step:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function generateBrandTruthSuggestion(url: string) {
  try {
    const ai = getAIProvider();
    const prompt = `You are a branding expert. Analyze this brand URL: "${url}".
    Generate a strategic statement, vision, and 3 core brand pillars.
    Provide the response in the specified JSON format.
    Keep the statement and vision under 2 sentences each. Make the pillars represent clinical/operational strength.`;

    const schema = {
      type: "OBJECT",
      properties: {
        statement: { type: "STRING" },
        vision: { type: "STRING" },
        core_pillars: {
          type: "ARRAY",
          items: { type: "STRING" }
        }
      },
      required: ["statement", "vision", "core_pillars"]
    };

    const result = await ai.generateStructuredOutput<{
      statement: string;
      vision: string;
      core_pillars: string[];
    }>(prompt, schema);

    return { success: true, data: result };
  } catch (err: any) {
    console.error("AI suggestion failed, using fallback:", err);
    return {
      success: false,
      error: err.message,
      data: {
        statement: "우리는 투명한 임상 추적을 통해 세계에서 가장 과학적으로 엄격한 활성 화합물 솔루션을 제공합니다.",
        vision: "검증된 임상 증거를 제시하여 뷰티 및 헬스케어 검색 답변의 잘못된 정보를 제거합니다.",
        core_pillars: ["100% 검증된 과학적 증거", "임상 실험실 직접 인저스티드", "제로 AI 환각 가드레일"]
      }
    };
  }
}

export async function seedInitialQuestions(wsId: string, keywords: string[], brandName: string, industrySlug?: string) {
  try {
    const keywordSeed = keywords[0] || "skincare";
    const result = await runUpstreamPipeline(wsId, keywordSeed, brandName, {
      brandUSP: industrySlug ? `industry:${industrySlug}` : undefined
    });
    return { success: true, result };
  } catch (err: any) {
    console.error("Failed to seed initial questions:", err);
    return { success: false, error: err.message };
  }
}
