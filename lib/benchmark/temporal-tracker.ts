import { EntityReflectionSnapshot } from '../schema';

export interface TemporalTrend {
  snapshot_id: string;
  measured_at: string;
  aepi_score: number;
  err_factoid: number;
  err_procedural: number;
}

export class TemporalTracker {
  async getTrends(websiteUrl: string, currentSnapshot: EntityReflectionSnapshot): Promise<TemporalTrend[]> {
    // In a real implementation, query the database for this website_url
    // For now, we mock historical data to demonstrate the temporal ERR tracking (S-09)
    const trends: TemporalTrend[] = [];
    
    // T-3 (90 days ago)
    const t3 = new Date();
    t3.setDate(t3.getDate() - 90);
    trends.push({
      snapshot_id: 'mock-t3',
      measured_at: t3.toISOString(),
      aepi_score: Math.max(0, currentSnapshot.aepi_score - 15),
      err_factoid: Math.max(0, currentSnapshot.err_factoid - 20),
      err_procedural: Math.max(0, currentSnapshot.err_procedural - 15)
    });

    // T-2 (60 days ago)
    const t2 = new Date();
    t2.setDate(t2.getDate() - 60);
    trends.push({
      snapshot_id: 'mock-t2',
      measured_at: t2.toISOString(),
      aepi_score: Math.max(0, currentSnapshot.aepi_score - 8),
      err_factoid: Math.max(0, currentSnapshot.err_factoid - 12),
      err_procedural: Math.max(0, currentSnapshot.err_procedural - 10)
    });

    // T-1 (30 days ago)
    const t1 = new Date();
    t1.setDate(t1.getDate() - 30);
    trends.push({
      snapshot_id: 'mock-t1',
      measured_at: t1.toISOString(),
      aepi_score: Math.max(0, currentSnapshot.aepi_score - 3),
      err_factoid: Math.max(0, currentSnapshot.err_factoid - 5),
      err_procedural: Math.max(0, currentSnapshot.err_procedural - 3)
    });

    // Current
    trends.push({
      snapshot_id: currentSnapshot.id || 'current',
      measured_at: currentSnapshot.measured_at,
      aepi_score: currentSnapshot.aepi_score,
      err_factoid: currentSnapshot.err_factoid,
      err_procedural: currentSnapshot.err_procedural
    });

    return trends;
  }
}
