// lib/pipeline/right-to-answer-router.ts

import { getSupabaseAdminClient } from "../supabase";
import { logger } from "../logger";

export type RightToAnswerAuthority = "hub" | "tenant" | "joint" | "expert_reviewed" | "consult_first" | "none";
export type RouteDestination = "automation" | "human_expert" | "blocked";

export interface RightToAnswerInput {
  workspaceId: string;
  questionId?: string;
  questionText: string;
  brandSlug?: string;
  isHighRisk: boolean;
  hasLineageRecord: boolean;
  category: "skincare" | "travel" | "other";
}

export interface RightToAnswerOutput {
  eligibleAuthority: RightToAnswerAuthority;
  routeDestination: RouteDestination;
  reason: string;
  requiredExpertRole: "dermatologist" | "jeju_safety_officer" | "compliance_officer" | "none";
  onboardingStatus: {
    isOnboarded: boolean;
    onboardingStep: number;
    details: string;
  };
}

export class RightToAnswerRouter {
  // In-memory simulation fallback for brands
  private static inMemoryBrands = new Map<string, { isOnboarded: boolean; onboardingStep: number }>();

  /**
   * Register a brand onboarding status in the in-memory fallback.
   * Useful for testing or local simulation when the DB is not migrated.
   */
  public static setSimulatedBrand(brandSlug: string, isOnboarded: boolean, onboardingStep = 5) {
    RightToAnswerRouter.inMemoryBrands.set(brandSlug, { isOnboarded, onboardingStep });
  }

  /**
   * Evaluates Right-to-Answer eligibility and determines the routing destination.
   */
  public async route(input: RightToAnswerInput): Promise<RightToAnswerOutput> {
    logger.info(`[RightToAnswerRouter] Routing question: "${input.questionText.slice(0, 40)}..."`, {
      correlationId: input.questionId,
    });

    // ── 1. Check Onboarding Status of the Merchant/Brand ──
    const onboarding = await this.checkOnboardingStatus(input.workspaceId, input.brandSlug);

    // ── 2. Evaluation Logic ──
    let eligibleAuthority: RightToAnswerAuthority = "hub";
    let routeDestination: RouteDestination = "automation";
    let requiredExpertRole: "dermatologist" | "jeju_safety_officer" | "compliance_officer" | "none" = "none";
    let reason = "";

    // A. Check for brand-specific query but brand is not onboarded
    const isBrandSpecific = !!input.brandSlug;
    
    if (isBrandSpecific && !onboarding.isOnboarded) {
      // Brand is not onboarded, so tenant cannot answer.
      // Route to Hub authority to prevent unverified brand promotion.
      eligibleAuthority = "hub";
      routeDestination = "automation";
      reason = `Brand '${input.brandSlug}' is not onboarded. Demoted authority to Hub to avoid unverified brand promotion.`;
      
      // If it's high-risk AND lacks lineage, route to human expert
      if (input.isHighRisk && !input.hasLineageRecord) {
        routeDestination = "human_expert";
        eligibleAuthority = "none";
        requiredExpertRole = this.getExpertRoleForCategory(input.category);
        reason = `Brand '${input.brandSlug}' is not onboarded, and high-risk query lacks verified lineage. Routing to human expert.`;
      }
      
      return {
        eligibleAuthority,
        routeDestination,
        reason,
        requiredExpertRole,
        onboardingStatus: onboarding,
      };
    }

    // B. Handle High-Risk Contexts (YMYL, irritation, weather danger)
    if (input.isHighRisk) {
      if (input.hasLineageRecord) {
        // High-risk but has a pre-verified scientific/local registry lineage record
        eligibleAuthority = "expert_reviewed";
        routeDestination = "automation";
        reason = "High-risk query approved for automation via pre-verified expert lineage record.";
      } else {
        // High-risk and lacks pre-verified expert lineage. MUST route to human expert.
        eligibleAuthority = "consult_first";
        routeDestination = "human_expert";
        requiredExpertRole = this.getExpertRoleForCategory(input.category);
        reason = "High-risk query lacks pre-verified lineage. Routed to human expert for manual validation.";
      }
    } else {
      // C. General / Low-Risk Contexts
      if (isBrandSpecific) {
        // Onboarded brand, general topic
        eligibleAuthority = "joint"; // Both hub-level baseline and tenant-level product info allowed
        routeDestination = "automation";
        reason = `Brand '${input.brandSlug}' is fully onboarded. Joint Hub-Tenant automation approved.`;
      } else {
        // General topic, no brand
        eligibleAuthority = "hub";
        routeDestination = "automation";
        reason = "General industry query. Routed to standard Hub automation.";
      }
    }

    return {
      eligibleAuthority,
      routeDestination,
      reason,
      requiredExpertRole,
      onboardingStatus: onboarding,
    };
  }

  /**
   * Helper to check the onboarding status of a brand/workspace.
   * Checks database tables (workspaces, brands) and falls back to simulation.
   */
  private async checkOnboardingStatus(
    workspaceId: string,
    brandSlug?: string
  ): Promise<{ isOnboarded: boolean; onboardingStep: number; details: string }> {
    if (!brandSlug) {
      // No brand slug means this is a general/neutral query, onboarding is not applicable (defaults to true)
      return { isOnboarded: true, onboardingStep: 5, details: "General query, brand onboarding not required." };
    }

    const supabase = getSupabaseAdminClient();

    try {
      // Step 1: Query workspaces table
      const { data: ws, error: wsError } = await supabase
        .from("workspaces")
        .select("onboarding_step, onboarding_completed_at, is_active")
        .eq("id", workspaceId)
        .single();

      if (wsError) throw wsError;

      if (ws) {
        const isOnboarded = ws.onboarding_step === 5 || !!ws.onboarding_completed_at;
        return {
          isOnboarded: isOnboarded && ws.is_active,
          onboardingStep: ws.onboarding_step ?? 0,
          details: `Workspace onboarding verified. Step: ${ws.onboarding_step}.`,
        };
      }
    } catch (err: any) {
      logger.warn(
        `[RightToAnswerRouter] Workspace onboarding check failed: ${err.message}. Checking brands table.`
      );
    }

    try {
      // Step 2: Query brands table if workspaces query failed or was inconclusive
      const { data: brand, error: brandError } = await supabase
        .from("brands")
        .select("is_onboarded, onboarding_status")
        .eq("workspace_id", workspaceId)
        .eq("slug", brandSlug)
        .single();

      if (brandError) throw brandError;

      if (brand) {
        const isOnboarded = brand.is_onboarded === true || brand.onboarding_status === "completed";
        return {
          isOnboarded,
          onboardingStep: isOnboarded ? 5 : 0,
          details: `Brand onboarding verified via brands table. Status: ${brand.onboarding_status}.`,
        };
      }
    } catch (err: any) {
      logger.warn(
        `[RightToAnswerRouter] Brand onboarding check failed: ${err.message}. Checking in-memory simulation.`
      );
    }

    // Step 3: In-memory simulation fallback
    const simulated = RightToAnswerRouter.inMemoryBrands.get(brandSlug);
    if (simulated) {
      return {
        isOnboarded: simulated.isOnboarded,
        onboardingStep: simulated.onboardingStep,
        details: `Brand onboarding resolved via in-memory simulation.`,
      };
    }

    // Default fallback: assume false if brand is specified but we cannot find it anywhere
    return {
      isOnboarded: false,
      onboardingStep: 0,
      details: "Brand not found in database or simulation cache. Assuming not onboarded.",
    };
  }

  /**
   * Map category to the required human expert role.
   */
  private getExpertRoleForCategory(
    category: "skincare" | "travel" | "other"
  ): "dermatologist" | "jeju_safety_officer" | "compliance_officer" {
    if (category === "skincare") return "dermatologist";
    if (category === "travel") return "jeju_safety_officer";
    return "compliance_officer";
  }
}
