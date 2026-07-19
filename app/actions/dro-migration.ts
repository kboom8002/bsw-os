"use server";

import { DROMigrationPipeline } from "../../lib/answer-supply/dro-migration";
import { checkWorkspacePermission, requireAuth } from "../../lib/auth";

/**
 * Server action to run the DR.O legacy Q&A migration pipeline.
 */
export async function runDROMigrationAction(
  workspaceId: string,
  domainKey: string,
  legacyRecords: any[]
) {
  const userId = await requireAuth();

  // Validate permission
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to trigger DR.O migration.");
  }

  if (!workspaceId) {
    throw new Error("workspaceId is required");
  }
  if (!domainKey) {
    throw new Error("domainKey is required");
  }
  if (!Array.isArray(legacyRecords)) {
    throw new Error("legacyRecords must be an array");
  }

  const pipeline = new DROMigrationPipeline();
  const result = await pipeline.migrate(workspaceId, domainKey, legacyRecords);

  return {
    success: result.failed === 0 && result.succeeded > 0,
    processed: result.processed,
    succeeded: result.succeeded,
    failed: result.failed,
    errors: result.errors,
    assetsCount: result.assets.length
  };
}
