import { getSupabaseAdminClient } from '../supabase';

export interface VolatilityConfidenceMetrics {
  confidence: number;
  volatility: number | null;
  confidencePenalty: number;
  volatilityPenalty: number;
  warning: string | null;
}

export async function calculateVolatilityAndConfidence(
  workspaceId: string,
  currentRunId: string,
  currentArs: number
): Promise<VolatilityConfidenceMetrics> {
  const supabase = getSupabaseAdminClient();

  // 1. Fetch previous completed runs of this workspace to measure volatility
  const { data: runs } = await supabase
    .from('ai_observation_runs')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('run_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(10);

  const runIds = (runs || []).map(r => r.id);

  // Load ARS snapshots for these runs
  let arsValues: number[] = [currentArs];
  if (runIds.length > 0) {
    const { data: snaps } = await supabase
      .from('metric_snapshots')
      .select('metric_value')
      .in('ai_observation_run_id', runIds)
      .eq('metric_name', 'ARS');

    if (snaps && snaps.length > 0) {
      arsValues = snaps.map(s => Number(s.metric_value));
    }
  }

  // 2. Compute metrics
  const sampleSize = arsValues.length;
  let confidence = 0.60;
  let volatility: number | null = null;
  let warning: string | null = null;

  if (sampleSize >= 5) {
    confidence = 0.95;
    
    // Compute Standard Deviation for volatility
    const avg = arsValues.reduce((sum, val) => sum + val, 0) / sampleSize;
    const sqDiffSum = arsValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0);
    const variance = sqDiffSum / sampleSize;
    const stdDev = Math.sqrt(variance);
    volatility = Number(stdDev.toFixed(2));
  } else {
    warning = "Insufficient data: Volatility calculations require at least 5 snapshots to avoid statistical artifacts.";
  }

  const confidencePenalty = Number(((1 - confidence) * 0.10).toFixed(4));
  const volatilityPenalty = volatility !== null ? Number(((volatility / 100) * 0.10).toFixed(4)) : 0.0;

  return {
    confidence,
    volatility,
    confidencePenalty,
    volatilityPenalty,
    warning
  };
}
