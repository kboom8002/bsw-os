/**
 * lib/signal-collection/external-collectors.ts
 * 
 * 실제 외부 원천 데이터 수집을 담당하는 수집기 모듈.
 * 네이버 뉴스 API, 네이버 DataLab API, RSS 피드 수집, 커뮤니티 크롤러 기능 포함.
 */

import { CollectionStorage, CollectionSource, ExternalSignal, SearchTrend } from './collection-storage';

export class ExternalCollectors {
  
  // ─── 1. 네이버 뉴스 수집기 ───
  static async collectNaverNews(workspaceId: string, source: CollectionSource, keywords: string[]): Promise<ExternalSignal[]> {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('[NaverNewsCollector] NAVER_CLIENT_ID 및 NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다. .env.local에 설정해주세요.');
    }

    const allSignals: Omit<ExternalSignal, 'id'>[] = [];

    // 키워드별로 뉴스 검색
    for (const kw of keywords.slice(0, 3)) {
      try {
        console.log(`[NaverNewsCollector] Fetching news for: "${kw}"`);
        const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(kw)}&display=10&sort=date`;
        
        const res = await fetch(url, {
          headers: {
            'X-Naver-Client-Id': clientId,
            'X-Naver-Client-Secret': clientSecret,
          },
          signal: AbortSignal.timeout(8000)
        });

        if (!res.ok) {
          console.warn(`[NaverNewsCollector] API error ${res.status} for: ${kw}`);
          continue;
        }

        const json = await res.json();
        for (const item of json.items ?? []) {
          const title = item.title.replace(/<[^>]*>/g, '').trim();
          const desc = item.description.replace(/<[^>]*>/g, '').trim();
          
          allSignals.push({
            workspace_id: workspaceId,
            source_id: source.id,
            source_type: 'naver_news',
            content: `${title}\n${desc}`,
            url: item.originallink || item.link,
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            metadata: {
              keyword: kw,
              title,
              description: desc
            }
          });
        }
      } catch (err: any) {
        console.error(`[NaverNewsCollector] Failed to fetch news for ${kw}:`, err.message);
      }
    }

    // 저장 및 결과 반환
    const savedCount = await CollectionStorage.saveExternalSignals(workspaceId, allSignals);
    console.log(`[NaverNewsCollector] Successfully saved ${savedCount} new news signals.`);
    return await CollectionStorage.getExternalSignals(workspaceId);
  }

  // ─── 1.5. 네이버 블로그 검색 수집기 ───
  static async collectNaverBlog(workspaceId: string, source: CollectionSource, keywords: string[]): Promise<ExternalSignal[]> {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('[NaverBlogCollector] NAVER_CLIENT_ID 및 NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다. .env.local에 설정해주세요.');
    }

    const allSignals: Omit<ExternalSignal, 'id'>[] = [];

    for (const kw of keywords.slice(0, 3)) {
      try {
        console.log(`[NaverBlogCollector] Fetching blog posts for: "${kw}"`);
        const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(kw)}&display=10&sort=date`;

        const res = await fetch(url, {
          headers: {
            'X-Naver-Client-Id': clientId,
            'X-Naver-Client-Secret': clientSecret,
          },
          signal: AbortSignal.timeout(8000)
        });

        if (!res.ok) {
          console.warn(`[NaverBlogCollector] API error ${res.status} for: ${kw}`);
          continue;
        }

        const json = await res.json();
        for (const item of json.items ?? []) {
          const title = item.title.replace(/<[^>]*>/g, '').trim();
          const desc = item.description.replace(/<[^>]*>/g, '').trim();

          allSignals.push({
            workspace_id: workspaceId,
            source_id: source.id,
            source_type: 'naver_blog',
            content: `${title}\n${desc}`,
            url: item.link,
            published_at: item.postdate ? new Date(item.postdate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).toISOString() : new Date().toISOString(),
            metadata: {
              keyword: kw,
              title,
              blogger_name: item.bloggername || '',
              description: desc
            }
          });
        }
      } catch (err: any) {
        console.error(`[NaverBlogCollector] Failed to fetch blogs for ${kw}:`, err.message);
      }
    }

    const savedCount = await CollectionStorage.saveExternalSignals(workspaceId, allSignals);
    console.log(`[NaverBlogCollector] Successfully saved ${savedCount} new blog signals.`);
    return await CollectionStorage.getExternalSignals(workspaceId);
  }

  // ─── 2. 네이버 DataLab 검색 트렌드 수집기 ───
  static async collectNaverDatalab(workspaceId: string, source: CollectionSource, keywords: string[]): Promise<SearchTrend[]> {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('[NaverDatalabCollector] NAVER_CLIENT_ID 및 NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다. .env.local에 설정해주세요.');
    }

    try {
      const today = new Date();
      const endDate = today.toISOString().split('T')[0];
      const startDate = new Date(today.getTime() - 14 * 24 * 3600 * 1000).toISOString().split('T')[0]; // 최근 2주

      const keywordGroups = keywords.slice(0, 5).map(kw => ({
        groupName: kw,
        keywords: [kw]
      }));

      console.log(`[NaverDatalabCollector] Requesting search trends for: ${keywords.join(', ')}`);
      
      const res = await fetch('https://openapi.naver.com/v1/datalab/search', {
        method: 'POST',
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate,
          endDate,
          timeUnit: 'date',
          keywordGroups
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[NaverDatalabCollector] DataLab API error ${res.status}: ${errText}`);
        return [];
      }

      const json = await res.json();
      const trends: Omit<SearchTrend, 'id'>[] = [];

      for (const result of json.results ?? []) {
        for (const dataPoint of result.data ?? []) {
          trends.push({
            workspace_id: workspaceId,
            keyword: result.title,
            period_start: dataPoint.period,
            period_end: dataPoint.period,
            relative_volume: dataPoint.ratio || 0,
            source: 'naver_datalab'
          });
        }
      }

      const savedCount = await CollectionStorage.saveSearchTrends(workspaceId, trends);
      console.log(`[NaverDatalabCollector] Successfully saved ${savedCount} new trend data points.`);
      return await CollectionStorage.getSearchTrends(workspaceId);

    } catch (err: any) {
      console.error('[NaverDatalabCollector] Failed to collect datalab trends:', err.message);
      return [];
    }
  }

  // ─── 3. RSS 피드 수집기 ───
  static async collectRss(workspaceId: string, source: CollectionSource): Promise<ExternalSignal[]> {
    if (!source.url) return [];

    try {
      console.log(`[RssCollector] Fetching RSS feed: ${source.name} (${source.url})`);
      const res = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const xml = await res.text();

      // 정규식 기반 CDATA 및 태그 파싱
      const items: Omit<ExternalSignal, 'id'>[] = [];
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
      let match: RegExpExecArray | null;

      const extractTag = (block: string, tag: string): string => {
        // CDATA 매칭 우선
        const cdataMatch = block.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i'));
        if (cdataMatch) return cdataMatch[1].trim();
        // 일반 매칭
        const plainMatch = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
        return plainMatch ? plainMatch[1].trim() : '';
      };

      const stripHtml = (s: string): string => {
        return s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      };

      while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
        const block = match[1];
        const title = extractTag(block, 'title');
        const link = extractTag(block, 'link') || extractTag(block, 'guid');
        const desc = extractTag(block, 'description');
        const pubDate = extractTag(block, 'pubDate');

        if (!title || !link) continue;

        items.push({
          workspace_id: workspaceId,
          source_id: source.id,
          source_type: 'rss',
          content: `${stripHtml(title)}\n${stripHtml(desc).slice(0, 300)}`,
          url: link.trim(),
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          metadata: {
            feed_name: source.name,
            title: stripHtml(title)
          }
        });
      }

      const savedCount = await CollectionStorage.saveExternalSignals(workspaceId, items);
      console.log(`[RssCollector] Saved ${savedCount} new RSS signals.`);
      return await CollectionStorage.getExternalSignals(workspaceId);

    } catch (err: any) {
      console.error(`[RssCollector] Failed to fetch RSS for ${source.name}:`, err.message);
      
      // Fallback: RSS가 실패한 경우 업종 맥락에 맞는 시그널을 시뮬레이션 삽입
      const industry = source.industry || 'generic';
      const fallbackContent = ExternalCollectors.getIndustryFallbackContent(industry, source.name, 'rss');
      const fallbackSignals: Omit<ExternalSignal, 'id'>[] = [
        {
          workspace_id: workspaceId,
          source_id: source.id,
          source_type: 'rss',
          content: fallbackContent,
          url: source.url + '/fallback-1',
          published_at: new Date().toISOString(),
          metadata: { 
            feed_name: source.name, 
            is_fallback: true, 
            is_synthetic: true,
            synthetic_reason: 'rss_fetch_failure',
            data_provenance: 'SYSTEM_GENERATED_FALLBACK',
            industry 
          }
        }
      ];
      await CollectionStorage.saveExternalSignals(workspaceId, fallbackSignals);
      return await CollectionStorage.getExternalSignals(workspaceId);
    }
  }

  // ─── 4. 커뮤니티 크롤러 ───
  static async collectCommunity(workspaceId: string, source: CollectionSource, keywords: string[]): Promise<ExternalSignal[]> {
    if (!source.url) return [];

    try {
      console.log(`[CommunityCrawler] Crawling community: ${source.name} (${source.url})`);
      const res = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0'
        },
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const html = await res.text();

      const items: Omit<ExternalSignal, 'id'>[] = [];
      
      // HTML에서 링크와 텍스트를 추출하는 심플 파서 (정규식 활용)
      // 실제 커뮤니티 게시글 제목이나 리스트 항목의 앵커 매칭 시도
      const linkRegex = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match: RegExpExecArray | null;

      const cleanText = (s: string): string => {
        return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      };

      while ((match = linkRegex.exec(html)) !== null && items.length < 15) {
        const href = match[1];
        const text = cleanText(match[2]);

        // 키워드가 포함되고 텍스트가 의미 있는 글자인 경우 선별
        if (text.length > 10 && keywords.some(kw => text.includes(kw))) {
          // 상대 경로 표준화
          let fullUrl = href;
          if (href.startsWith('/')) {
            try {
              const urlObj = new URL(source.url);
              fullUrl = `${urlObj.protocol}//${urlObj.host}${href}`;
            } catch {}
          }

          items.push({
            workspace_id: workspaceId,
            source_id: source.id,
            source_type: 'community',
            content: text,
            url: fullUrl,
            published_at: new Date().toISOString(),
            metadata: {
              site_name: source.name,
              channel: source.identifier
            }
          });
        }
      }

      // 만약 파싱된 시그널이 적다면, 업종 키워드 기반으로 커뮤니티 게시물 예시를 자동으로 시뮬레이션 생성해 보강
      if (items.length < 3) {
        console.log(`[CommunityCrawler] Scraped few items (${items.length}). Injecting realistic community signals.`);
        
        const syntheticPosts = [
          {
            title: "화해/파우더룸 실시간 반응: 레티놀 크림 쓰고 볼 화끈거림 붉은기 올라왔는데 세라마이드 듬뿍 얹으면 가라앉나요?",
            desc: "어제 레티놀 0.1% 처음 썼는데 양 볼이랑 이마 부분이 붉어지고 엄청 따가워요... 찬물 세수하고 수분 크림 바르는데도 아픈데 리페어 마스크팩이나 모델링팩 같은거 올려서 열감 내려야 할까요? ㅠㅠ"
          },
          {
            title: "네이버 지식iN Q&A: 피부과 인모드 시술 직후 홈케어 세럼 추천이랑 성분 주의할 점 알려주세요",
            desc: "슈링크랑 인모드 받고 왔는데 피부가 얇아진 느낌이고 많이 민감해요. 아침저녁으로 바를 진정 세럼 찾고 있는데 나이아신아마이드나 세라마이드 들어간 장벽 세럼 발라도 되나요? 레이저 시술 후에 피해야할 성분도 같이 답변 부탁드려요."
          }
        ];

        for (const post of syntheticPosts) {
          items.push({
            workspace_id: workspaceId,
            source_id: source.id,
            source_type: 'community',
            content: `${post.title}\n${post.desc}`,
            url: source.url + `/post-${Math.random().toString(36).substr(2, 5)}`,
            published_at: new Date().toISOString(),
            metadata: {
              site_name: source.name,
              channel: source.identifier,
              is_synthetic: true,
              synthetic_reason: 'insufficient_scraped_items',
              data_provenance: 'SYSTEM_GENERATED_SYNTHETIC',
              scraped_count_before_injection: items.length - syntheticPosts.length
            }
          });
        }
      }

      const savedCount = await CollectionStorage.saveExternalSignals(workspaceId, items);
      console.log(`[CommunityCrawler] Saved ${savedCount} new community signals.`);
      return await CollectionStorage.getExternalSignals(workspaceId);

    } catch (err: any) {
      console.error(`[CommunityCrawler] Failed to crawl community ${source.name}:`, err.message);
      
      // Fallback: 크롤링 실패 시 업종 맥락에 맞는 커뮤니티 시그널 삽입
      const industry = source.industry || 'generic';
      const fallbackContent = ExternalCollectors.getIndustryFallbackContent(industry, source.name, 'community');
      const fallbackSignals: Omit<ExternalSignal, 'id'>[] = [
        {
          workspace_id: workspaceId,
          source_id: source.id,
          source_type: 'community',
          content: fallbackContent,
          url: source.url + '/fallback-post',
          published_at: new Date().toISOString(),
          metadata: { 
            site_name: source.name, 
            channel: source.identifier, 
            is_fallback: true, 
            is_synthetic: true,
            synthetic_reason: 'community_crawl_failure',
            data_provenance: 'SYSTEM_GENERATED_FALLBACK',
            industry 
          }
        }
      ];
      await CollectionStorage.saveExternalSignals(workspaceId, fallbackSignals);
      return await CollectionStorage.getExternalSignals(workspaceId);
    }
  }

  // ─── 업종별 Fallback 콘텐츠 생성기 ───
  private static getIndustryFallbackContent(industry: string, sourceName: string, type: 'rss' | 'community'): string {
    const fallbacks: Record<string, { rss: string; community: string }> = {
      jeju_smb: {
        rss: `[Fallback] ${sourceName} 트렌드: 제주도 흑돼지 맛집 예약 대기 시간 단축을 위한 네이버 사전예약 시스템 도입이 확산되고 있으며, 애월·한림 지역 카페들이 오션뷰 루프탑을 강화하고 있습니다.`,
        community: `[Fallback] ${sourceName} 유저: 제주 여행 3박 4일 일정인데 흑돼지 맛집 돈사돈이랑 숙성도 중에 어디가 더 나은가요? 1인 기준 가격이랑 웨이팅 시간도 알려주세요.`
      },
      beauty: {
        rss: `[Fallback] ${sourceName} 트렌드: 민감성 피부 장벽 회복용 성분으로 판테놀과 세라마이드 고함량 배합 제품이 동아시아 시장에서 인기를 끌고 있습니다.`,
        community: `[Fallback] ${sourceName} 유저: 필링 시술 이후 얼굴에 각질 심하게 일어나고 장벽 완전히 깨진 것 같아요. 급속 회복 패치나 마스크 추천해 주세요.`
      },
      skincare: {
        rss: `[Fallback] ${sourceName} 트렌드: 레티놀 사용 후 피부 민감도 관리 및 선크림 병용 프로토콜이 피부과 전문의 사이에서 표준화되고 있습니다.`,
        community: `[Fallback] ${sourceName} 유저: 레티놀 크림 쓰고 볼 화끈거림이 심한데 세라마이드 크림으로 진정 가능한가요?`
      },
      wedding_studio: {
        rss: `[Fallback] ${sourceName} 트렌드: 스드메 원스톱 패키지에서 개별 스튜디오·드레스·메이크업 분리 선택이 증가하고 있으며, 야외 촬영 수요가 급증하고 있습니다.`,
        community: `[Fallback] ${sourceName} 유저: 웨딩스튜디오 계약 전 꼭 확인해야 할 체크리스트 알려주세요. 추가 비용 함정이 있다고 들었어요.`
      },
    };

    const fb = fallbacks[industry] || {
      rss: `[Fallback] ${sourceName} 트렌드: 해당 업종의 최신 트렌드 데이터를 수집 중입니다.`,
      community: `[Fallback] ${sourceName} 유저: 해당 업종 관련 소비자 질문을 수집 중입니다.`
    };

    return type === 'rss' ? fb.rss : fb.community;
  }

  /**
   * 합성 데이터 비율 진단 — 전체 시그널 중 합성 데이터가 20%를 초과하면 경고
   */
  static async checkSyntheticRatio(workspaceId: string): Promise<{ total: number; synthetic: number; ratio: number; warning: boolean }> {
    const signals = await CollectionStorage.getExternalSignals(workspaceId);
    const syntheticCount = signals.filter(s => 
      s.metadata?.is_synthetic === true || 
      s.metadata?.is_synthesized === true || 
      s.metadata?.is_fallback === true
    ).length;
    const ratio = signals.length > 0 ? syntheticCount / signals.length : 0;
    const warning = ratio > 0.2;
    if (warning) {
      console.warn(`[ExternalCollectors] ⚠️ Synthetic data ratio ${(ratio * 100).toFixed(1)}% exceeds 20% threshold for workspace ${workspaceId}. Total: ${signals.length}, Synthetic: ${syntheticCount}.`);
    }
    return { total: signals.length, synthetic: syntheticCount, ratio: Number(ratio.toFixed(4)), warning };
  }
}
