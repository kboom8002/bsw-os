import { SurfaceEntity } from '../schema';
import crypto from 'crypto';

export interface CacheEntry {
  hash: string;
  entities: SurfaceEntity[];
  lastUpdated: string;
}

/**
 * Mock In-Memory Cache for Incremental Auditing (S-19)
 * In production, this would be stored in Supabase or Redis
 */
export class IncrementalCache {
  private static cache: Map<string, CacheEntry> = new Map();

  /**
   * Create SHA-256 hash of the page text
   */
  static hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get cached entities if the content hash matches
   */
  static get(url: string, content: string): SurfaceEntity[] | null {
    const entry = this.cache.get(url);
    if (!entry) return null;

    const currentHash = this.hashContent(content);
    if (entry.hash === currentHash) {
      console.log(`[IncrementalCache] Cache HIT for ${url}`);
      return entry.entities;
    }
    
    console.log(`[IncrementalCache] Cache MISS (changed) for ${url}`);
    return null;
  }

  /**
   * Save entities to cache
   */
  static set(url: string, content: string, entities: SurfaceEntity[]) {
    this.cache.set(url, {
      hash: this.hashContent(content),
      entities,
      lastUpdated: new Date().toISOString()
    });
  }
}
