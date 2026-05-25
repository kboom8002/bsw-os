import { getSupabaseAdminClient } from '../../lib/supabase';

/**
 * Shared seed utilities and idempotent wrappers
 */

export const SIMULATED_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Standard observed proxy caveats disclaimer text
 */
export const MOCK_PROXY_CAVEAT = "BSW-OS Standard Caveat: Report scores are based on observed panel-based proxies and do not represent internal, proprietary LLM weighting systems.";

/**
 * Helper to securely upsert a record with conflict resolutions
 */
export async function upsertRecord(table: string, payload: any, conflictKeys: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(table)
    .upsert(payload, { onConflict: conflictKeys })
    .select()
    .single();

  if (error) {
    console.error(`SEED ERROR: Failed upserting into "${table}": ${error.message}`);
    throw new Error(`DB Error: ${error.message}`);
  }
  return data;
}

/**
 * Helper to log seeded artifacts
 */
export function logSeeded(table: string, id: string, name: string) {
  console.log(`  [SEEDED] Table "${table}" -> ID: ${id} (${name})`);
}
