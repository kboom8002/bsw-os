import { getSupabaseAdminClient } from '../supabase';
import { createIndustryStandardPanel } from '../../app/actions/probe-panel-factory';
import { syncTenantContent } from '../../app/actions/sync';
import { IndustryType } from '../../db/seed/industry-panels/questions-data';

export type SyncEvent =
  | { type: 'TENANT_ONBOARDED'; tenantId: string; tenantSlug: string; industry: IndustryType; workspaceId: string }
  | { type: 'ANSWER_CARD_PUBLISHED'; tenantId: string; cardId: string; workspaceId: string }
  | { type: 'BRAND_PROFILE_UPDATED'; tenantId: string; workspaceId: string }
  | { type: 'TAXONOMY_CHANGED'; tenantId: string; workspaceId: string };

export interface EventHubResponse {
  status: 'dispatched' | 'ignored' | 'error';
  details: string;
  payload?: any;
}

export class SyncEventHub {
  /**
   * Dispatches and handles external SaaS integration events.
   */
  public async dispatch(event: SyncEvent): Promise<EventHubResponse> {
    const supabase = getSupabaseAdminClient();

    try {
      switch (event.type) {
        case 'TENANT_ONBOARDED': {
          // 1. Establish database link in tenant_workspace_bridge
          const { data: bridge, error: bridgeErr } = await supabase
            .from('tenant_workspace_bridge')
            .upsert({
              aihompy_tenant_id: event.tenantId,
              aihompy_tenant_slug: event.tenantSlug,
              aihompy_industry: event.industry,
              bsw_workspace_id: event.workspaceId,
              sync_status: 'pending'
            }, { onConflict: 'aihompy_tenant_id' })
            .select()
            .single();

          if (bridgeErr || !bridge) {
            throw new Error(`Failed to establish tenant workspace bridge: ${bridgeErr?.message}`);
          }

          // 2. Proactively deploy industry standard Probe Panel with brand keyword
          const brandKeyword = event.tenantSlug.replace(/-/g, ' ');
          const panelMeta = await createIndustryStandardPanel(
            event.workspaceId,
            event.industry,
            brandKeyword,
            ['경쟁사']
          );

          // 3. Schedule baseline observation run in background
          const { data: run } = await supabase
            .from('ai_observation_runs')
            .insert({
              workspace_id: event.workspaceId,
              run_name: `[Baseline] ${brandKeyword} Onboarding Audit`,
              probe_panel_id: panelMeta.panelId,
              run_status: 'candidate',
              run_metadata: { onboardingTrigger: true }
            })
            .select()
            .single();

          return {
            status: 'dispatched',
            details: `Tenant onboarding fully synchronized. Standard panel deployed with ${panelMeta.questionCount} questions.`,
            payload: { bridgeId: bridge.id, panelId: panelMeta.panelId, runId: run?.id }
          };
        }

        case 'ANSWER_CARD_PUBLISHED': {
          // Find the bridge associated with this tenant
          const { data: bridge } = await supabase
            .from('tenant_workspace_bridge')
            .select('id')
            .eq('aihompy_tenant_id', event.tenantId)
            .single();

          if (!bridge) {
            return { status: 'ignored', details: 'No active bridge found for tenant.' };
          }

          // 1. Execute sync action
          const syncSummary = await syncTenantContent(bridge.id);

          // 2. Schedule retest observation run
          const { data: panel } = await supabase
            .from('probe_panels')
            .select('id')
            .eq('workspace_id', event.workspaceId)
            .eq('industry', syncSummary.status === 'success' ? 'beauty' : 'unknown') // soft mapped
            .limit(1)
            .maybeSingle();

          let retestRunId = "";
          if (panel) {
            const { data: run } = await supabase
              .from('ai_observation_runs')
              .insert({
                workspace_id: event.workspaceId,
                run_name: `[Auto-Retest] Answer Card #${event.cardId} Publish Event`,
                probe_panel_id: panel.id,
                run_status: 'candidate',
                run_metadata: { triggerCardId: event.cardId }
              })
              .select()
              .single();
            if (run) retestRunId = run.id;
          }

          return {
            status: 'dispatched',
            details: `Answer card published event handled. Content synced. Retest scheduled.`,
            payload: { syncSummary, retestRunId }
          };
        }

        case 'BRAND_PROFILE_UPDATED':
        case 'TAXONOMY_CHANGED': {
          const { data: bridge } = await supabase
            .from('tenant_workspace_bridge')
            .select('id')
            .eq('aihompy_tenant_id', event.tenantId)
            .single();

          if (!bridge) {
            return { status: 'ignored', details: 'No active bridge found for tenant.' };
          }

          const syncSummary = await syncTenantContent(bridge.id);

          return {
            status: 'dispatched',
            details: `General update event dispatched and synced successfully.`,
            payload: { syncSummary }
          };
        }

        default:
          return { status: 'ignored', details: 'Unknown event type.' };
      }
    } catch (err: any) {
      console.error('Event Hub dispatch failed:', err);
      return {
        status: 'error',
        details: `Event dispatch aborted: ${err.message}`
      };
    }
  }
}
