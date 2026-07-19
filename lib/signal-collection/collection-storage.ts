/**
 * lib/signal-collection/collection-storage.ts
 * 
 * 데이터 수집 소스 및 수집된 시그널을 저장하고 조회하는 서비스.
 * Supabase DB 테이블이 존재하면 DB에 우선적으로 접근하며,
 * 테이블이 존재하지 않거나 DEMO_MODE가 true인 경우 로컬 JSON 파일 시스템에 백업/폴백 저장합니다.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getSupabaseAdminClient } from '../supabase';

export interface CollectionSource {
  id: string;
  workspace_id?: string | null;
  name: string;
  url: string | null;
  source_type: 'rss' | 'community_board' | 'api' | 'crawl';
  identifier: string;
  enabled: boolean;
  industry: string;
  last_fetched_at?: string | null;
  last_fetch_count?: number;
  created_at?: string;
}

export interface ExternalSignal {
  id: string;
  workspace_id?: string | null;
  source_id?: string | null;
  source_type: string; // e.g. 'rss', 'community', 'news', 'naver_news'
  content: string;     // 원문
  url: string | null;
  published_at: string | null;
  metadata?: any;
  collected_at?: string;
}

export interface SearchTrend {
  id: string;
  workspace_id?: string | null;
  keyword: string;
  period_start: string;
  period_end: string;
  relative_volume: number;
  source: string; // 'naver_datalab'
  created_at?: string;
}

// 로컬 파일 저장소 경로 설정
const STORAGE_DIR = path.join(process.cwd(), 'db', 'seed', 'external_data');
const SOURCES_FILE = path.join(STORAGE_DIR, 'collection_sources.json');
const SIGNALS_FILE = path.join(STORAGE_DIR, 'external_signals.json');
const TRENDS_FILE = path.join(STORAGE_DIR, 'search_trends.json');

// 초기 데이터
const INITIAL_SOURCES: CollectionSource[] = [
  {
    id: "cs-beauty-1",
    name: "화해 앱 리뷰 (Hwahae Skincare)",
    url: "https://www.hwahae.co.kr",
    source_type: "crawl",
    identifier: "HWAHAE",
    enabled: true,
    industry: "beauty"
  },
  {
    id: "cs-beauty-2",
    name: "파우더룸 커뮤니티 (Powderroom)",
    url: "https://www.powderroom.co.kr",
    source_type: "crawl",
    identifier: "POWDERROOM",
    enabled: true,
    industry: "beauty"
  },
  {
    id: "cs-beauty-3",
    name: "네이버 지식iN 피부과/스킨케어 Q&A",
    url: "https://kin.naver.com",
    source_type: "crawl",
    identifier: "NAVER_KIN",
    enabled: true,
    industry: "beauty"
  },
  {
    id: "cs-beauty-4",
    name: "네이버 뉴스 API (스킨케어/화장품)",
    url: "https://openapi.naver.com/v1/search/news.json",
    source_type: "api",
    identifier: "NAVER_NEWS",
    enabled: true,
    industry: "beauty"
  },
  {
    id: "cs-beauty-5",
    name: "네이버 DataLab API (스킨케어 트렌드)",
    url: "https://openapi.naver.com/v1/datalab/search",
    source_type: "api",
    identifier: "NAVER_DATALAB",
    enabled: true,
    industry: "beauty"
  },
  {
    id: "cs-beauty-6",
    name: "Cosmetics Design-Asia RSS",
    url: "https://www.cosmeticsdesign-asia.com/service/rss/feed/active",
    source_type: "rss",
    identifier: "COSMETICS_DESIGN",
    enabled: true,
    industry: "beauty"
  },
  {
    id: "cs-beauty-7",
    name: "대한피부과학회 학술소식 RSS",
    url: "http://www.derma.or.kr/rss/dermal.xml",
    source_type: "rss",
    identifier: "DERMATOLOGY_RSS",
    enabled: true,
    industry: "beauty"
  },
  // ── 제주 소상공인 (jeju_smb) 소스 ──
  {
    id: "cs-jeju-1",
    name: "네이버 뉴스 (제주 맛집/카페/소상공인)",
    url: "https://openapi.naver.com/v1/search/news.json",
    source_type: "api",
    identifier: "NAVER_NEWS",
    enabled: true,
    industry: "jeju_smb"
  },
  {
    id: "cs-jeju-2",
    name: "네이버 DataLab (제주 여행/맛집 트렌드)",
    url: "https://openapi.naver.com/v1/datalab/search",
    source_type: "api",
    identifier: "NAVER_DATALAB",
    enabled: true,
    industry: "jeju_smb"
  },
  {
    id: "cs-jeju-3",
    name: "제주관광공사 공식 RSS (Visit Jeju)",
    url: "https://www.visitjeju.net/rss/experience",
    source_type: "rss",
    identifier: "JEJU_VISITJEJU_RSS",
    enabled: true,
    industry: "jeju_smb"
  },
  {
    id: "cs-jeju-4",
    name: "네이버 블로그 검색 (제주 맛집/카페)",
    url: "https://openapi.naver.com/v1/search/blog.json",
    source_type: "api",
    identifier: "NAVER_BLOG",
    enabled: true,
    industry: "jeju_smb"
  },
  {
    id: "cs-jeju-5",
    name: "당근마켓 동네생활 (제주)",
    url: "https://www.daangn.com/region/제주특별자치도",
    source_type: "crawl",
    identifier: "DAANGN_JEJU",
    enabled: true,
    industry: "jeju_smb"
  },
  {
    id: "cs-jeju-6",
    name: "디시인사이드 제주도 갤러리",
    url: "https://gall.dcinside.com/board/lists/?id=jeju",
    source_type: "crawl",
    identifier: "DC_JEJU",
    enabled: true,
    industry: "jeju_smb"
  },
  {
    id: "cs-beauty-8",
    name: "올리브영 온라인몰 리뷰",
    url: "https://www.oliveyoung.co.kr/",
    source_type: "crawl",
    identifier: "OLIVEYOUNG",
    enabled: true,
    industry: "beauty"
  },
  {
    id: "cs-beauty-9",
    name: "Reddit r/SkincareAddiction",
    url: "https://www.reddit.com/r/SkincareAddiction/",
    source_type: "crawl",
    identifier: "REDDIT_SKINCARE",
    enabled: true,
    industry: "beauty"
  },
  // ── 공통 실측 및 VOC 연동 소스 ──
  {
    id: "cs-common-gsc",
    name: "Google Search Console 실측 쿼리",
    url: "https://www.googleapis.com/webmasters/v3/sites",
    source_type: "api",
    identifier: "GOOGLE_SEARCH_CONSOLE",
    enabled: true,
    industry: "beauty"
  },
  {
    id: "cs-common-naver-sa",
    name: "네이버 웹마스터도구 실측 쿼리",
    url: "https://openapi.naver.com/v1/searchadvisor",
    source_type: "api",
    identifier: "NAVER_SEARCH_ADVISOR",
    enabled: true,
    industry: "beauty"
  },
  {
    id: "cs-common-voc-search",
    name: "내부 검색어 로그 VOC",
    url: null,
    source_type: "api",
    identifier: "VOC_SITE_SEARCH",
    enabled: true,
    industry: "beauty"
  },
  {
    id: "cs-common-voc-chat",
    name: "AI 가이드 대화 VOC",
    url: null,
    source_type: "api",
    identifier: "VOC_AI_GUIDE",
    enabled: true,
    industry: "beauty"
  },
  {
    id: "cs-common-voc-inquiry",
    name: "고객 문의 내역 VOC",
    url: null,
    source_type: "api",
    identifier: "VOC_INQUIRY",
    enabled: true,
    industry: "beauty"
  },
  {
    id: "cs-common-voc-review",
    name: "사용자 후기 및 리뷰 VOC",
    url: null,
    source_type: "api",
    identifier: "VOC_REVIEW",
    enabled: true,
    industry: "beauty"
  }
];

// 디렉토리 및 초기 파일 자동 생성
function ensureStorage() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(SOURCES_FILE)) {
    fs.writeFileSync(SOURCES_FILE, JSON.stringify(INITIAL_SOURCES, null, 2), 'utf8');
  }
  if (!fs.existsSync(SIGNALS_FILE)) {
    fs.writeFileSync(SIGNALS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
  if (!fs.existsSync(TRENDS_FILE)) {
    fs.writeFileSync(TRENDS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

export class CollectionStorage {
  private static getUseLocal(): boolean {
    return process.env.DEMO_MODE === 'true';
  }

  // ─── 수집 소스 (Collection Sources) ───
  
  static async getCollectionSources(workspaceId: string): Promise<CollectionSource[]> {
    ensureStorage();

    if (!this.getUseLocal()) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from('collection_sources')
          .select('*')
          .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
          .order('created_at', { ascending: true });

        if (!error && data) {
          // DB 소스에 INITIAL_SOURCES 중 없는 것을 병합 (업종별 기본 소스 보장)
          const dbIds = new Set(data.map((s: any) => s.id));
          const missingSeeds = INITIAL_SOURCES
            .filter(s => !dbIds.has(s.id))
            .map(s => ({ ...s, workspace_id: workspaceId }));
          return [...(data as CollectionSource[]), ...missingSeeds];
        }
        console.warn('[CollectionStorage] Supabase error, falling back to local file:', error?.message);
      } catch (err: any) {
        console.warn('[CollectionStorage] Supabase exception, falling back to local file:', err.message);
      }
    }

    // 로컬 파일에서 읽기
    try {
      const content = fs.readFileSync(SOURCES_FILE, 'utf8');
      const sources = JSON.parse(content) as CollectionSource[];
      return sources.map(s => ({ ...s, workspace_id: workspaceId }));
    } catch (e: any) {
      console.error('[CollectionStorage] Failed to read local sources file:', e.message);
      return INITIAL_SOURCES.map(s => ({ ...s, workspace_id: workspaceId }));
    }
  }

  static async saveCollectionSource(workspaceId: string, source: Omit<CollectionSource, 'id'> & { id?: string }): Promise<CollectionSource> {
    ensureStorage();
    const isNew = !source.id;
    const finalSource: CollectionSource = {
      ...source,
      id: source.id || 'cs-' + Math.random().toString(36).substr(2, 9),
      workspace_id: workspaceId,
      created_at: source.created_at || new Date().toISOString()
    };

    if (!this.getUseLocal()) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from('collection_sources')
          .upsert(finalSource)
          .select()
          .single();

        if (!error && data) {
          return data as CollectionSource;
        }
        console.warn('[CollectionStorage] Supabase upsert error, saving locally:', error?.message);
      } catch (err: any) {
        console.warn('[CollectionStorage] Supabase upsert exception, saving locally:', err.message);
      }
    }

    // 로컬 파일에 저장
    try {
      const content = fs.readFileSync(SOURCES_FILE, 'utf8');
      const sources = JSON.parse(content) as CollectionSource[];
      
      const index = sources.findIndex(s => s.id === finalSource.id);
      if (index !== -1) {
        sources[index] = finalSource;
      } else {
        sources.push(finalSource);
      }
      
      fs.writeFileSync(SOURCES_FILE, JSON.stringify(sources, null, 2), 'utf8');
      return finalSource;
    } catch (e: any) {
      console.error('[CollectionStorage] Failed to save local sources file:', e.message);
      return finalSource;
    }
  }

  static async deleteCollectionSource(workspaceId: string, id: string): Promise<void> {
    ensureStorage();

    if (!this.getUseLocal()) {
      try {
        const supabase = getSupabaseAdminClient();
        const { error } = await supabase
          .from('collection_sources')
          .delete()
          .eq('id', id);

        if (!error) return;
        console.warn('[CollectionStorage] Supabase delete error, updating locally:', error?.message);
      } catch (err: any) {
        console.warn('[CollectionStorage] Supabase delete exception, updating locally:', err.message);
      }
    }

    // 로컬 파일에서 삭제
    try {
      const content = fs.readFileSync(SOURCES_FILE, 'utf8');
      const sources = JSON.parse(content) as CollectionSource[];
      const filtered = sources.filter(s => s.id !== id);
      fs.writeFileSync(SOURCES_FILE, JSON.stringify(filtered, null, 2), 'utf8');
    } catch (e: any) {
      console.error('[CollectionStorage] Failed to delete from local sources file:', e.message);
    }
  }

  // ─── 외부 시그널 (External Signals) ───
  
  static async getExternalSignals(workspaceId: string): Promise<ExternalSignal[]> {
    ensureStorage();

    if (!this.getUseLocal()) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from('external_signals')
          .select('*')
          .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
          .order('collected_at', { ascending: false });

        if (!error && data) {
          return data as ExternalSignal[];
        }
        console.warn('[CollectionStorage] Supabase get signals error, falling back to local file:', error?.message);
      } catch (err: any) {
        console.warn('[CollectionStorage] Supabase get signals exception, falling back to local file:', err.message);
      }
    }

    // 로컬 파일에서 읽기
    try {
      const content = fs.readFileSync(SIGNALS_FILE, 'utf8');
      return JSON.parse(content) as ExternalSignal[];
    } catch (e: any) {
      console.error('[CollectionStorage] Failed to read local signals file:', e.message);
      return [];
    }
  }

  static async saveExternalSignals(workspaceId: string, signals: Omit<ExternalSignal, 'id'>[]): Promise<number> {
    ensureStorage();
    const prepared = signals.map(s => ({
      ...s,
      id: 'sig-' + Math.random().toString(36).substr(2, 9),
      workspace_id: workspaceId,
      collected_at: new Date().toISOString()
    }));

    if (prepared.length === 0) return 0;

    let savedCount = 0;

    if (!this.getUseLocal()) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from('external_signals')
          .insert(prepared)
          .select();

        if (!error && data) {
          return data.length;
        }
        console.warn('[CollectionStorage] Supabase insert signals error, saving locally:', error?.message);
      } catch (err: any) {
        console.warn('[CollectionStorage] Supabase insert signals exception, saving locally:', err.message);
      }
    }

    // 로컬 파일에 추가 및 중복 방지 (URL 기준)
    try {
      const content = fs.readFileSync(SIGNALS_FILE, 'utf8');
      const existing = JSON.parse(content) as ExternalSignal[];
      
      const existingUrls = new Set(existing.map(s => s.url).filter(Boolean));
      const existingContents = new Set(existing.map(s => s.content.trim().slice(0, 100)));
      
      const newSignals = prepared.filter(s => {
        if (s.url && existingUrls.has(s.url)) return false;
        if (existingContents.has(s.content.trim().slice(0, 100))) return false;
        return true;
      });

      const updated = [...newSignals, ...existing].slice(0, 200); // 최대 200개 유지
      fs.writeFileSync(SIGNALS_FILE, JSON.stringify(updated, null, 2), 'utf8');
      savedCount = newSignals.length;
    } catch (e: any) {
      console.error('[CollectionStorage] Failed to save local signals file:', e.message);
      savedCount = prepared.length;
    }

    return savedCount;
  }

  // ─── 검색 트렌드 (Search Trends) ───
  
  static async getSearchTrends(workspaceId: string): Promise<SearchTrend[]> {
    ensureStorage();

    if (!this.getUseLocal()) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from('search_trends')
          .select('*')
          .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`);

        if (!error && data) {
          return data as SearchTrend[];
        }
        console.warn('[CollectionStorage] Supabase get trends error, falling back to local file:', error?.message);
      } catch (err: any) {
        console.warn('[CollectionStorage] Supabase get trends exception, falling back to local file:', err.message);
      }
    }

    // 로컬 파일에서 읽기
    try {
      const content = fs.readFileSync(TRENDS_FILE, 'utf8');
      return JSON.parse(content) as SearchTrend[];
    } catch (e: any) {
      console.error('[CollectionStorage] Failed to read local trends file:', e.message);
      return [];
    }
  }

  static async saveSearchTrends(workspaceId: string, trends: Omit<SearchTrend, 'id'>[]): Promise<number> {
    ensureStorage();
    const prepared = trends.map(t => ({
      ...t,
      id: 'trend-' + Math.random().toString(36).substr(2, 9),
      workspace_id: workspaceId,
      created_at: new Date().toISOString()
    }));

    if (prepared.length === 0) return 0;

    if (!this.getUseLocal()) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from('search_trends')
          .upsert(prepared, { onConflict: 'workspace_id,keyword,period_start,source' })
          .select();

        if (!error && data) {
          return data.length;
        }
        console.warn('[CollectionStorage] Supabase upsert trends error, saving locally:', error?.message);
      } catch (err: any) {
        console.warn('[CollectionStorage] Supabase upsert trends exception, saving locally:', err.message);
      }
    }

    // 로컬 파일에 추가 및 중복 방지
    try {
      const content = fs.readFileSync(TRENDS_FILE, 'utf8');
      const existing = JSON.parse(content) as SearchTrend[];
      
      const keySet = new Set(existing.map(e => `${e.keyword}:${e.period_start}:${e.source}`));
      const newTrends = prepared.filter(t => !keySet.has(`${t.keyword}:${t.period_start}:${t.source}`));
      
      const updated = [...newTrends, ...existing].slice(0, 500); // 최대 500개 유지
      fs.writeFileSync(TRENDS_FILE, JSON.stringify(updated, null, 2), 'utf8');
      return newTrends.length;
    } catch (e: any) {
      console.error('[CollectionStorage] Failed to save local trends file:', e.message);
      return prepared.length;
    }
  }
}
