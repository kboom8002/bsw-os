/**
 * lib/aihompy-pack/naver-place-client.ts
 *
 * 네이버 플레이스 실 크롤링 클라이언트
 *
 * 접근 방식:
 *  1. Naver Search API (공식) — NAVER_CLIENT_ID + NAVER_CLIENT_SECRET 환경변수
 *  2. OpenGraph/메타태그 파싱 fallback — public URL 크롤링
 *
 * 제한사항: 네이버 검색 API는 플레이스 상세 정보를 직접 제공하지 않으므로
 * 검색 결과에서 기본 정보를 추출하고, 상세 페이지 OG 태그를 보조로 파싱합니다.
 */

export interface NaverPlaceRawData {
  place_id: string;
  business_name: string;
  category: string;
  address: string;
  phone?: string;
  business_hours?: string;
  description?: string;
  map_url: string;
  /** 네이버 플레이스 공식 URL */
  naver_url: string;
}

export class NaverPlaceClient {
  private static readonly NAVER_API_BASE = 'https://openapi.naver.com/v1/search/local.json';

  /**
   * 네이버 플레이스 ID 또는 URL에서 플레이스 ID 추출
   */
  static extractPlaceId(input: string): string | null {
    if (/^\d{10,}$/.test(input.trim())) return input.trim();
    const patterns = [
      /\/p\/entry\/place\/(\d+)/,         // 새 형식: map.naver.com/p/entry/place/1173076105
      /\/v5\/entry\/place\/(\d+)/,        // 구 형식: map.naver.com/v5/entry/place/...
      /\/entry\/place\/(\d+)/,            // 경로 내 entry/place
      /place\/(\d+)/,                     // place/숫자 범용
      /naver\.me\/[\w]+/,                 // 단축 URL (ID 직접 추출 불가 → 리다이렉트 필요)
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  /**
   * 네이버 검색 API로 업체명 검색 후 기본 정보 추출
   * 환경변수 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 필요
   */
  static async searchByName(query: string): Promise<NaverPlaceRawData | null> {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.warn('[NaverPlaceClient] NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET 미설정');
      return null;
    }

    try {
      const url = `${this.NAVER_API_BASE}?query=${encodeURIComponent(query)}&display=1&sort=random`;
      const res = await fetch(url, {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      });

      if (!res.ok) {
        console.error('[NaverPlaceClient] API 오류:', res.status, res.statusText);
        return null;
      }

      const json = await res.json();
      const item = json.items?.[0];
      if (!item) return null;

      // HTML 태그 제거
      const cleanTitle = item.title.replace(/<[^>]+>/g, '');
      const cleanAddress = (item.address || item.roadAddress || '').replace(/<[^>]+>/g, '');
      const cleanCategory = (item.category || '').replace(/<[^>]+>/g, '');
      const telephone = (item.telephone || '').replace(/-/g, '-');

      return {
        place_id: this.extractPlaceId(item.link || '') || `search-${Date.now()}`,
        business_name: cleanTitle,
        category: cleanCategory,
        address: cleanAddress,
        phone: telephone || undefined,
        description: item.description?.replace(/<[^>]+>/g, '') || undefined,
        map_url: item.mapx
          ? `https://map.naver.com/?lng=${item.mapx / 10000000}&lat=${item.mapy / 10000000}`
          : '',
        naver_url: item.link || '',
      };
    } catch (err) {
      console.error('[NaverPlaceClient] searchByName 오류:', err);
      return null;
    }
  }

  /**
   * 네이버 플레이스 상세 페이지 OG 메타태그 파싱 (공개 URL 기반)
   * - place_id를 알고 있을 때 사용
   */
  static async fetchPlaceMetadata(placeId: string): Promise<Partial<NaverPlaceRawData>> {
    // 새 형식 URL 우선 시도, 실패 시 구 형식 fallback
    const urls = [
      `https://map.naver.com/p/entry/place/${placeId}`,
      `https://map.naver.com/v5/entry/place/${placeId}`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; AnswerHub-Bot/1.0; +https://answerhub.kr)',
            Accept: 'text/html',
          },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) continue; // 다음 URL 시도

        const html = await res.text();

        // OG 메타태그 파싱
        const extractMeta = (property: string): string | undefined => {
          const m = html.match(new RegExp(`<meta[^>]+(?:property|name)="${property}"[^>]+content="([^"]+)"`, 'i'))
            || html.match(new RegExp(`<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="${property}"`, 'i'));
          return m ? m[1] : undefined;
        };

        const ogTitle = extractMeta('og:title');
        const ogDescription = extractMeta('og:description');
        const ogAddress = extractMeta('place:location:address');

        // OG 데이터가 하나라도 있으면 유효한 응답
        if (ogTitle || ogDescription) {
          return {
            place_id: placeId,
            business_name: ogTitle,
            description: ogDescription,
            address: ogAddress,
            map_url: url,
            naver_url: url,
          };
        }
      } catch (err) {
        console.warn(`[NaverPlaceClient] fetchPlaceMetadata ${url} 실패:`, err);
        continue; // 다음 URL 시도
      }
    }

    // 모든 URL 실패 시 기본 반환
    const fallbackUrl = urls[0];
    return { place_id: placeId, naver_url: fallbackUrl, map_url: fallbackUrl };
  }

  /**
   * 플레이스 URL/ID에서 최대한 많은 정보를 추출합니다.
   * 1. OG 태그 파싱 시도
   * 2. 이름을 알 경우 검색 API 보완
   */
  static async fetchByUrlOrId(input: string): Promise<NaverPlaceRawData | null> {
    const placeId = this.extractPlaceId(input);
    if (!placeId) {
      console.warn('[NaverPlaceClient] 유효한 네이버 플레이스 ID/URL 아님:', input);
      return null;
    }

    const meta = await this.fetchPlaceMetadata(placeId);

    // 이름이 파싱됐으면 검색 API로 전화번호 등 보완
    let searchResult: NaverPlaceRawData | null = null;
    if (meta.business_name) {
      searchResult = await this.searchByName(meta.business_name);
    }

    return {
      place_id: placeId,
      business_name: meta.business_name || searchResult?.business_name || '알 수 없음',
      category: searchResult?.category || '',
      address: meta.address || searchResult?.address || '',
      phone: searchResult?.phone,
      business_hours: searchResult?.business_hours,
      description: meta.description || searchResult?.description,
      map_url: meta.map_url || `https://map.naver.com/v5/entry/place/${placeId}`,
      naver_url: meta.naver_url || `https://map.naver.com/v5/entry/place/${placeId}`,
    };
  }
}
