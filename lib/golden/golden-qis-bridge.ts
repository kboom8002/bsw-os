import { getSupabaseAdminClient } from '../supabase';

export interface ContentConsensus {
  id?: string;
  pattern_name?: string;
  consensus_pattern?: string;
  required_by_percent?: number;
  section_name?: string;
}

export class GoldenQisBridge {
  /**
   * feedConsensusToQisScenes
   * Updates existing QIS scenes with content consensus patterns.
   */
  static async feedConsensusToQisScenes(
    workspaceId: string,
    consensus: {
      content_templates?: ContentConsensus[];
      section_sequences?: ContentConsensus[];
      quality_benchmarks?: any[];
    },
    industryKey?: string
  ): Promise<{ updatedScenes: number; newMustIncludes: number }> {
    const supabase = getSupabaseAdminClient();
    
    // 1. Extract must_include candidates from consensus templates
    const mustIncludes: string[] = [];
    
    if (consensus.content_templates && Array.isArray(consensus.content_templates)) {
      for (const tmpl of consensus.content_templates) {
        if (tmpl.consensus_pattern) {
          mustIncludes.push(tmpl.consensus_pattern);
        }
      }
    }
    
    if (consensus.section_sequences && Array.isArray(consensus.section_sequences)) {
      for (const section of consensus.section_sequences) {
        const percent = section.required_by_percent ?? 0;
        if (section.section_name && percent >= 70) {
          mustIncludes.push(`Section: ${section.section_name} (${percent}% consensus)`);
        }
      }
    }
    
    if (mustIncludes.length === 0) {
      return { updatedScenes: 0, newMustIncludes: 0 };
    }
    
    // 2. Fetch QIS scenes in workspace
    const { data: scenes, error: fetchErr } = await supabase
      .from('qis_scenes')
      .select('id, must_include')
      .eq('workspace_id', workspaceId);
      
    if (fetchErr || !scenes) {
      console.warn('[GoldenQisBridge] Failed to fetch QIS scenes:', fetchErr?.message);
      return { updatedScenes: 0, newMustIncludes: mustIncludes.length };
    }
    
    let updatedCount = 0;
    for (const scene of scenes) {
      const existing = scene.must_include || [];
      // Merge unique entries
      const merged = Array.from(new Set([...existing, ...mustIncludes]));
      
      const { error: updateErr } = await supabase
        .from('qis_scenes')
        .update({
          must_include: merged,
          updated_at: new Date().toISOString()
        })
        .eq('id', scene.id);
        
      if (!updateErr) {
        updatedCount++;
      } else {
        console.warn(`[GoldenQisBridge] Failed to update scene ${scene.id}:`, updateErr.message);
      }
    }
    
    return { updatedScenes: updatedCount, newMustIncludes: mustIncludes.length };
  }

  /**
   * feedDesignTokensToSurfaceContracts
   * Placeholder to link design tokens to surface contract validations.
   */
  static async feedDesignTokensToSurfaceContracts(
    workspaceId: string,
    designTokens: any
  ): Promise<{ updatedContracts: number }> {
    console.log(`[GoldenQisBridge] Design tokens processed for workspace ${workspaceId}:`, designTokens);
    return { updatedContracts: 0 };
  }
}
