"use server";

import { CollectionStorage, CollectionSource } from "../../lib/signal-collection/collection-storage";
import { ExternalCollectors } from "../../lib/signal-collection/external-collectors";
import { requireAuthOrDemo, checkWorkspacePermissionOrDemo } from "../../lib/auth";

const DEFAULT_KEYWORDS = ['브랜드 추천', '업체 비교', '후기'];

// 업종별 기본 키워드 레지스트리
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  skincare: ['스킨케어 부작용', '민감성 피부 화장품', '피부과 시술 후 홈케어', '피부 장벽 회복', '세럼 추천', '레티놀'],
  jeju_smb: ['제주 맛집', '제주 카페', '제주 흑돼지', '제주 횟집', '제주 여행', '애월 카페', '제주 소상공인'],
  wedding_studio: ['웨딩 촬영', '웨딩스튜디오', '드레스 추천', '웨딩 컨설팅', '스드메'],
  kpop_idol_ko: ['케이팝', '아이돌', '컴백', '팬덤', '음반'],
  seoul_district_ko: ['서울 맛집', '서울 카페', '서울 핫플', '서울 여행'],
  generic: ['브랜드 추천', '업체 비교', '후기'],
};

// 업종 키워드 해석 헬퍼
function resolveKeywords(industryKey?: string, customKeywords?: string[]): string[] {
  if (customKeywords && customKeywords.length > 0) return customKeywords;
  if (industryKey && INDUSTRY_KEYWORDS[industryKey]) return INDUSTRY_KEYWORDS[industryKey];
  return DEFAULT_KEYWORDS;
}

/**
 * 1. 수집 소스 조회
 */
export async function getCollectionSourcesAction(workspaceId: string) {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to view collection sources.");
  }
  return await CollectionStorage.getCollectionSources(workspaceId);
}

/**
 * 2. 수집 소스 추가 / 수정
 */
export async function saveCollectionSourceAction(workspaceId: string, data: Omit<CollectionSource, 'id'> & { id?: string }) {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to manage collection sources.");
  }
  return await CollectionStorage.saveCollectionSource(workspaceId, data);
}

/**
 * 3. 수집 소스 삭제
 */
export async function deleteCollectionSourceAction(workspaceId: string, id: string) {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to delete collection sources.");
  }
  await CollectionStorage.deleteCollectionSource(workspaceId, id);
  return { success: true };
}

/**
 * 4. 수집 소스 활성화 / 비활성화 토글
 */
export async function toggleCollectionSourceAction(workspaceId: string, id: string, enabled: boolean) {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify collection sources.");
  }
  
  const sources = await CollectionStorage.getCollectionSources(workspaceId);
  const target = sources.find(s => s.id === id);
  if (!target) throw new Error("Collection source not found.");

  target.enabled = enabled;
  await CollectionStorage.saveCollectionSource(workspaceId, target);
  return { success: true };
}

/**
 * 5. 특정 소스 즉시 수집 트리거
 */
export async function triggerCollectionAction(workspaceId: string, id: string, customKeywords?: string[], industryKey?: string) {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to trigger collection.");
  }

  const sources = await CollectionStorage.getCollectionSources(workspaceId);
  const source = sources.find(s => s.id === id);
  if (!source) throw new Error("Collection source not found.");

  const keywords = resolveKeywords(industryKey, customKeywords);
  let countBefore = 0;
  let countAfter = 0;

  console.log(`[triggerCollectionAction] Running collector for source: ${source.name} (${source.source_type})`);

  if (source.source_type === 'api' && source.identifier === 'NAVER_NEWS') {
    const before = await CollectionStorage.getExternalSignals(workspaceId);
    countBefore = before.length;
    await ExternalCollectors.collectNaverNews(workspaceId, source, keywords);
    const after = await CollectionStorage.getExternalSignals(workspaceId);
    countAfter = after.length;
  } else if (source.source_type === 'api' && source.identifier === 'NAVER_DATALAB') {
    const before = await CollectionStorage.getSearchTrends(workspaceId);
    countBefore = before.length;
    await ExternalCollectors.collectNaverDatalab(workspaceId, source, keywords);
    const after = await CollectionStorage.getSearchTrends(workspaceId);
    countAfter = after.length;
  } else if (source.source_type === 'api' && source.identifier === 'NAVER_BLOG') {
    const before = await CollectionStorage.getExternalSignals(workspaceId);
    countBefore = before.length;
    await ExternalCollectors.collectNaverBlog(workspaceId, source, keywords);
    const after = await CollectionStorage.getExternalSignals(workspaceId);
    countAfter = after.length;
  } else if (source.source_type === 'api' && source.identifier === 'GOOGLE_SEARCH_CONSOLE') {
    const before = await CollectionStorage.getExternalSignals(workspaceId);
    countBefore = before.length;
    const { GSCConnector } = await import('../../lib/signal-collection/connectors/gsc-connector');
    const rows = await GSCConnector.fetchQueryData({ siteUrl: source.url || 'sc-domain:example.com' });
    const filtered = GSCConnector.filterQuestionQueries(rows);
    await GSCConnector.convertToSignals(workspaceId, source.id, filtered);
    await GSCConnector.recordSamplingMetadata(workspaceId, {
      collected_at: new Date().toISOString(),
      total_gsc_rows_fetched: rows.length,
      filtered_question_signals: filtered.length,
      start_date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
      end_date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
    });
    const after = await CollectionStorage.getExternalSignals(workspaceId);
    countAfter = after.length;
  } else if (source.source_type === 'api' && source.identifier === 'NAVER_SEARCH_ADVISOR') {
    const before = await CollectionStorage.getExternalSignals(workspaceId);
    countBefore = before.length;
    const { NaverSAConnector } = await import('../../lib/signal-collection/connectors/naver-sa-connector');
    const rows = await NaverSAConnector.fetchQueryData({ targetUrl: source.url || 'example.com' });
    const filtered = NaverSAConnector.filterQuestionQueries(rows);
    await NaverSAConnector.convertToSignals(workspaceId, source.id, filtered);
    const after = await CollectionStorage.getExternalSignals(workspaceId);
    countAfter = after.length;
  } else if (source.source_type === 'api' && source.identifier.startsWith('VOC_')) {
    const before = await CollectionStorage.getExternalSignals(workspaceId);
    countBefore = before.length;
    const { VOCConnector } = await import('../../lib/signal-collection/connectors/voc-connector');
    let type: 'site_search' | 'ai_guide' | 'inquiry' | 'review' = 'site_search';
    if (source.identifier === 'VOC_AI_GUIDE') type = 'ai_guide';
    else if (source.identifier === 'VOC_INQUIRY') type = 'inquiry';
    else if (source.identifier === 'VOC_REVIEW') type = 'review';
    
    const rows = await VOCConnector.fetchVOCData(workspaceId, { sourceType: type });
    await VOCConnector.convertToSignals(workspaceId, source.id, rows, type); // Store all redacted VOC items (not just questions, as bridge filters them or uses them as context)
    const after = await CollectionStorage.getExternalSignals(workspaceId);
    countAfter = after.length;
  } else if (source.source_type === 'rss') {
    const before = await CollectionStorage.getExternalSignals(workspaceId);
    countBefore = before.length;
    await ExternalCollectors.collectRss(workspaceId, source);
    const after = await CollectionStorage.getExternalSignals(workspaceId);
    countAfter = after.length;
  } else if (source.source_type === 'crawl') {
    const before = await CollectionStorage.getExternalSignals(workspaceId);
    countBefore = before.length;
    await ExternalCollectors.collectCommunity(workspaceId, source, keywords);
    const after = await CollectionStorage.getExternalSignals(workspaceId);
    countAfter = after.length;
  } else {
    console.warn(`[triggerCollectionAction] Unhandled source_type/identifier: ${source.source_type}/${source.identifier} for source "${source.name}". Skipping.`);
  }

  // 통계 업데이트
  const fetchedCount = Math.max(0, countAfter - countBefore);
  source.last_fetched_at = new Date().toISOString();
  source.last_fetch_count = fetchedCount;
  await CollectionStorage.saveCollectionSource(workspaceId, source);

  return { 
    success: true, 
    fetchedCount,
    lastFetchedAt: source.last_fetched_at 
  };
}

/**
 * 6. 모든 활성화 소스 전체 수집 트리거
 */
export async function triggerAllCollectionsAction(workspaceId: string, customKeywords?: string[], industryKey?: string) {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to trigger collection.");
  }

  const sources = await CollectionStorage.getCollectionSources(workspaceId);
  // 업종 필터: industryKey에 매칭되는 소스만 사용 (beauty ↔ skincare 호환)
  const INDUSTRY_ALIASES: Record<string, string[]> = {
    skincare: ['beauty', 'skincare'],
    jeju_smb: ['jeju_smb', 'jeju'],
    wedding_studio: ['wedding_studio', 'wedding'],
    kpop_idol_ko: ['kpop_idol_ko', 'kpop'],
    seoul_district_ko: ['seoul_district_ko', 'seoul'],
  };
  const matchIndustries = industryKey ? (INDUSTRY_ALIASES[industryKey] || [industryKey]) : [];
  const enabledSources = sources.filter(s => {
    if (!s.enabled) return false;
    // industryKey가 없으면 전체 소스 사용 (하위 호환)
    if (matchIndustries.length === 0) return true;
    return matchIndustries.includes(s.industry);
  });
  const keywords = resolveKeywords(industryKey, customKeywords);

  let totalFetched = 0;

  for (const source of enabledSources) {
    try {
      const res = await triggerCollectionAction(workspaceId, source.id, keywords, industryKey);
      if (res.success) {
        totalFetched += res.fetchedCount;
      }
    } catch (err: any) {
      console.error(`[triggerAllCollectionsAction] Failed to trigger ${source.name}:`, err.message);
    }
  }

  return { success: true, totalFetched, sourcesCount: enabledSources.length };
}

/**
 * 7. 수집된 시그널 및 트렌드 데이터 조회
 */
export async function getExternalSignalsAction(workspaceId: string) {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to view signals.");
  }
  return await CollectionStorage.getExternalSignals(workspaceId);
}

export async function getSearchTrendsAction(workspaceId: string) {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to view trends.");
  }
  return await CollectionStorage.getSearchTrends(workspaceId);
}
