/**
 * BSW-OS Structured Error Logging and Audit Monitoring Contract
 */

export interface AuditEvent {
  workspaceId: string;
  actorId: string;
  actionType: string; // e.g. 'APPROVE_PATCH', 'PURGE_SEED', 'GATE_OVERRIDE'
  targetEntity: string; // e.g. 'patch_tickets', 'representation_objects'
  targetId: string;
  timestamp: string;
  metadata?: any;
}

/**
 * Sends a structured payload to the configured enterprise audit webhook.
 */
async function dispatchWebhook(payload: any) {
  const url = process.env.AUDIT_WEBHOOK_URL;
  if (!url) return;

  try {
    // Non-blocking fire-and-forget fetch call to avoid latency in business transactions
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.warn(`[Enterprise Logging Webhook Failed]: ${err.message}`);
    });
  } catch (err: any) {
    // Prevent logging failures from throwing and breaking the primary business transaction
    console.warn(`[Enterprise Logging Webhook Dispatch Exception]: ${err.message}`);
  }
}

/**
 * 1. logAuditMutation
 * Logs critical strategists or admin mutative actions for safety audit.
 */
export function logAuditMutation(event: AuditEvent) {
  const logPayload = {
    level: "AUDIT",
    message: `[BSW-OS AUDIT] Actor "${event.actorId}" executed mutation "${event.actionType}" on "${event.targetEntity}" (ID: ${event.targetId})`,
    workspaceId: event.workspaceId,
    timestamp: event.timestamp || new Date().toISOString(),
    metadata: event.metadata || {}
  };
  
  // Console logging
  console.log(JSON.stringify(logPayload));
  
  // Non-blocking Enterprise Webhook dispatch
  dispatchWebhook(logPayload);

  return logPayload;
}

/**
 * 2. logExceptionError
 * Implements a structured error handler mapping to observation run system exceptions.
 */
export function logExceptionError(workspaceId: string, error: Error, context: string, runId?: string) {
  const errorPayload = {
    level: "ERROR",
    message: `[BSW-OS EXCEPTION] Error in context "${context}": ${error.message}`,
    workspaceId,
    runId: runId || null,
    exceptionName: error.name,
    stackTrace: error.stack || null,
    timestamp: new Date().toISOString()
  };

  // Console logging
  console.error(JSON.stringify(errorPayload));
  
  // Non-blocking Enterprise Webhook dispatch
  dispatchWebhook(errorPayload);

  return errorPayload;
}

/**
 * Computes difference (delta) between two records.
 */
export function computeDelta(oldObj: any, newObj: any): any {
  if (!oldObj) return newObj || {};
  if (!newObj) return {};

  const delta: any = {};
  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

  for (const key of allKeys) {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      delta[key] = {
        from: oldObj[key],
        to: newObj[key]
      };
    }
  }
  return delta;
}

/**
 * Logs a full mutation to console/webhook and writes delta payload to DB audit_events table.
 */
export async function logDeltaAuditEvent(
  workspaceId: string,
  userId: string,
  action: string,
  targetType: string,
  targetId: string,
  oldRecord: any,
  newRecord: any
) {
  const delta = computeDelta(oldRecord, newRecord);
  const { getSupabaseAdminClient } = await import("./supabase");
  const supabase = getSupabaseAdminClient();

  logAuditMutation({
    workspaceId,
    actorId: userId,
    actionType: action,
    targetEntity: targetType,
    targetId,
    timestamp: new Date().toISOString(),
    metadata: { delta, newRecord }
  });

  const { error } = await supabase.from("audit_events").insert({
    workspace_id: workspaceId,
    user_id: userId,
    action,
    target_type: targetType,
    target_id: targetId,
    payload: newRecord || {},
    delta_payload: delta || {}
  });

  if (error) {
    console.error(`[logDeltaAuditEvent DB Error]: ${error.message}`);
  }
}

