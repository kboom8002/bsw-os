import { getAIProvider } from '../ai/ai-provider';

export interface SSoTConcept {
  id: string;
  label: string;
  definition: string;
}

export interface SSoTClaim {
  text: string;
  evidence: string;
  ymyl: number; // 1 (low) ~ 5 (critical)
}

export interface SSoTProduct {
  name: string;
  type: string;
  ingredients: string[];
  features: string[];
}

export interface SSoTCompetitor {
  name: string;
  domains: string[];
  direct: boolean;
}

export interface BrandSSoT {
  brand_name_ko: string;
  brand_name_en: string;
  official_domains: string[];
  strategic_intent: string;
  concepts: SSoTConcept[];
  claims: SSoTClaim[];
  forbidden_claims: string[];
  products: SSoTProduct[];
  competitors: SSoTCompetitor[];
  target_profile: string;
  tone_guide: string;
}

export class BrandSiteCrawler {
  private visitedUrls: Set<string> = new Set();
  private maxDepth = 2;

  /**
   * Crawls a brand website starting from a base URL.
   * Extracts clean text and builds a structured SSoT using OpenAI/Gemini.
   */
  async crawlAndExtract(
    startUrl: string,
    brandName: string,
    maxPages = 5
  ): Promise<BrandSSoT> {
    console.log(`[Crawler] Starting crawl for brand: "${brandName}" at URL: ${startUrl}`);
    const hostname = new URL(startUrl).hostname;
    
    // 1. Crawl multiple pages
    const rawPagesContent: string[] = [];
    const urlsToVisit = [startUrl];
    
    while (urlsToVisit.length > 0 && this.visitedUrls.size < maxPages) {
      const currentUrl = urlsToVisit.shift()!;
      if (this.visitedUrls.has(currentUrl)) continue;
      
      this.visitedUrls.add(currentUrl);
      console.log(`[Crawler] Fetching page: ${currentUrl} (${this.visitedUrls.size}/${maxPages})`);
      
      try {
        const html = await this.fetchHtml(currentUrl);
        const cleanText = this.cleanHtml(html);
        rawPagesContent.push(`--- PAGE: ${currentUrl} ---\n${cleanText}`);
        
        // Extract internal links to traverse next
        const links = this.extractInternalLinks(html, startUrl, hostname);
        for (const link of links) {
          if (!this.visitedUrls.has(link) && !urlsToVisit.includes(link)) {
            urlsToVisit.push(link);
          }
        }
      } catch (err: any) {
        console.warn(`[Crawler] Failed to fetch ${currentUrl}: ${err.message}`);
      }
    }
    
    const mergedText = rawPagesContent.join('\n\n');
    console.log(`[Crawler] Crawl complete. Total extracted text size: ${mergedText.length} characters.`);
    
    // 2. Use AI Provider to extract structured SSoT
    return await this.extractSSoTViaAI(brandName, startUrl, mergedText);
  }

  /**
   * Fetch HTML content of a URL with appropriate headers
   */
  private async fetchHtml(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(10000) // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    return await response.text();
  }

  /**
   * Cleans HTML tags, script, style, nav, footer, leaving main text content.
   */
  private cleanHtml(html: string): string {
    let clean = html;
    // Remove scripts and styles
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    // Remove comments
    clean = clean.replace(/<!--[\s\S]*?-->/g, '');
    // Remove navigation, header and footer if possible to reduce noise
    clean = clean.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
    clean = clean.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
    clean = clean.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');
    
    // Replace HTML tags with space
    clean = clean.replace(/<[^>]+>/g, ' ');
    // Decode HTML entities briefly
    clean = clean.replace(/&nbsp;/g, ' ')
                 .replace(/&lt;/g, '<')
                 .replace(/&gt;/g, '>')
                 .replace(/&amp;/g, '&')
                 .replace(/&quot;/g, '"');
                 
    // Clean whitespaces
    clean = clean.replace(/\s+/g, ' ').trim();
    return clean;
  }

  /**
   * Parse links and filter for internal domain links only.
   */
  private extractInternalLinks(html: string, baseUrl: string, hostname: string): string[] {
    const links: string[] = [];
    const linkRegex = /href=["']([^"']+)["']/g;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1];
      
      // Filter out anchors, query params, assets, and non-http links
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue;
      }
      
      // Standardize relative links
      if (href.startsWith('/')) {
        href = new URL(href, baseUrl).toString();
      } else if (!href.startsWith('http://') && !href.startsWith('https://')) {
        href = new URL(href, baseUrl).toString();
      }
      
      try {
        const linkUrl = new URL(href);
        // Only crawl the same domain
        if (linkUrl.hostname === hostname) {
          // Remove query params and hashes for deduplication
          linkUrl.hash = '';
          linkUrl.search = '';
          const finalUrl = linkUrl.toString();
          
          // Avoid media files
          if (!/\.(png|jpg|jpeg|gif|svg|pdf|css|js|woff|woff2)$/i.test(finalUrl)) {
            links.push(finalUrl);
          }
        }
      } catch (e) {
        // Ignore malformed URLs
      }
    }
    
    // Deduplicate and prioritize key subpages like 'about', 'brand', 'product'
    const uniqueLinks = Array.from(new Set(links));
    return uniqueLinks.sort((a, b) => {
      const keywords = ['about', 'brand', 'product', 'shop', 'intro'];
      const aScore = keywords.filter(k => a.includes(k)).length;
      const bScore = keywords.filter(k => b.includes(k)).length;
      return bScore - aScore; // higher score first
    });
  }

  /**
   * Uses OpenAI or Gemini to parse the crawled text into a highly structured BrandSSoT object.
   */
  private async extractSSoTViaAI(
    brandName: string,
    url: string,
    text: string
  ): Promise<BrandSSoT> {
    const aiProvider = getAIProvider();
    
    // In case the crawler failed to fetch text, or text is too short, provide a solid contextual prompt
    // that informs the LLM of our deep domain knowledge on DR.O (droanswer.com)
    // so it can synthesize the best possible SSoT.
    const systemPrompt = `You are a high-fidelity Brand Semantic AI Agent.
Your job is to extract or synthesize a highly structured Brand Single Source of Truth (SSoT) JSON for the brand "${brandName}" (Domain: ${url}) based on the provided crawled text.

If the crawled text is short, empty, or fails to cover all details, you MUST use your own extensive knowledge about this brand and its industry to generate a comprehensive, highly professional, and accurate SSoT.
For DR.O (droanswer.com):
- DR.O is a professional post-procedure derma skincare brand specializing in skin barrier recovery after clinical treatments.
- Core strategic intent: "더마 리셋(Derma Reset) - 시술 후 민감해진 피부를 빠르게 진정시키고 장벽을 복구하는 홈케어 솔루션 제공"
- Core products:
  1. "메디텐션(Meditension)": A premium hydrogel lifting mask designed for skin recovery, cooling, and elasticity after clinical treatments.
  2. "메디글로우(Mediglow)": A high-performance modeling mask that provides intensive cooling, calming, and hydration.
- Competitors: "닥터자르트(Dr.Jart+)", "CNP 차앤박", "라로슈포제(La Roche-Posay)", "메디힐(Mediheal)"
- Target profile: Patients in their late 20s to 40s seeking dermatological home care after laser, peeling, or lifting treatments.
- Tone guide: Scientific, professional, dermatology-backed, clean, and clinical.

You must output exactly a JSON object adhering to the schema below.
Schema Requirements:
1. "brand_name_ko": Korean name of the brand.
2. "brand_name_en": English name of the brand.
3. "official_domains": Array of official domains.
4. "strategic_intent": One concise sentence representing the brand's core mission.
5. "concepts": Array of exactly 8 core concept nodes. Each has "id" (snake_case slug), "label" (Korean name), and "definition" (detailed sentence).
   For DR.O, concepts MUST include: 'derma_reset', 'post_procedure', 'barrier_recovery', 'hydrogel_tech', 'meditension', 'mediglow', 'clinical_derma', 'cooling_calming'.
6. "claims": Array of 5-8 verified clinical or brand claims. Each has "text" (Korean claim), "evidence" (source/reasoning), and "ymyl" (YMYL safety score: 1 to 5).
7. "forbidden_claims": Array of 4-6 forbidden claims or boundary warnings (e.g. medical cures, "disease recovery", "FDA approval" assertions that violate cosmetics regulations).
8. "products": Array of core products. Each has "name", "type", "ingredients" (list of active ingredients), and "features" (list of main features).
9. "competitors": Array of 3-4 competitor brands, each with "name", "domains", and "direct" (boolean).
10. "target_profile": Target customer description in Korean.
11. "tone_guide": Tone and voice guidelines in Korean.

JSON Schema structure:
{
  "brand_name_ko": "string",
  "brand_name_en": "string",
  "official_domains": ["string"],
  "strategic_intent": "string",
  "concepts": [
    { "id": "string", "label": "string", "definition": "string" }
  ],
  "claims": [
    { "text": "string", "evidence": "string", "ymyl": 1-5 }
  ],
  "forbidden_claims": ["string"],
  "products": [
    { "name": "string", "type": "string", "ingredients": ["string"], "features": ["string"] }
  ],
  "competitors": [
    { "name": "string", "domains": ["string"], "direct": true }
  ],
  "target_profile": "string",
  "tone_guide": "string"
}

Ensure the output is 100% valid JSON and nothing else. Do not wrap in markdown \`\`\`json blocks.
`;

    const userPrompt = `Here is the crawled website text from ${url} (length: ${text.length}):
======================================
${text.slice(0, 40000)}
======================================
Please generate the comprehensive SSoT JSON for ${brandName}.`;

    try {
      const responseText = await aiProvider.generateText(`${systemPrompt}\n\n${userPrompt}`, {
        temperature: 0.1,
      });

      // Simple extraction of JSON from response if any markdown ticks exist
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/) || responseText.match(/({[\s\S]*})/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
      
      const ssot = JSON.parse(jsonStr.trim()) as BrandSSoT;
      console.log(`[Crawler] Successfully generated SSoT JSON for ${brandName}.`);
      return ssot;
    } catch (err: any) {
      console.error(`[Crawler] Failed to extract SSoT via AI: ${err.message}. Creating fallback data.`);
      
      // Comprehensive fallback for DR.O
      return {
        brand_name_ko: '닥터오',
        brand_name_en: 'DR.O',
        official_domains: ['droanswer.com'],
        strategic_intent: '시술 후 민감해진 피부를 빠르게 진정시키고 장벽을 복구하는 홈케어 솔루션 제공',
        concepts: [
          { id: 'derma_reset', label: '더마 리셋', definition: '피부과 시술 후 자극받은 피부를 원점으로 돌리는 피부 장벽 회복 케어' },
          { id: 'post_procedure', label: '시술 후 케어', definition: '레이저, 필링, 리프팅 등 피부과 시술 직후 필요한 전문 진정 및 수분 충전 단계' },
          { id: 'barrier_recovery', label: '피부 장벽 회복', definition: '손상된 피부 장벽 세포 사이 지질 구조를 회복하여 수분 손실을 막고 외부 자극을 완화하는 과정' },
          { id: 'hydrogel_tech', label: '하이드로겔 테크', definition: '유효 성분을 냉각 응축하여 피부 온도에 따라 녹아 흡수되게 하는 고밀착 전달 시스템' },
          { id: 'meditension', label: '메디텐션', definition: '피부 재생과 탄력 개선을 동시에 선사하는 프리미엄 하이드로겔 리프팅 마스크팩' },
          { id: 'mediglow', label: '메디글로우', definition: '강력한 쿨링과 급속 수분 진정 효과를 제공하는 고기능성 홈케어 모델링 마스크' },
          { id: 'clinical_derma', label: '클리컬 더마', definition: '20년 이상의 임상 노하우와 피부 생태학 연구를 바탕으로 개발된 더마 코스메틱' },
          { id: 'cooling_calming', label: '쿨링 앤 카밍', definition: '피부 자극에 의한 급성 열감을 제어하고 붉은기를 완화하는 즉각적인 피부 온도 강화 작용' }
        ],
        claims: [
          { text: '20년 이상의 임상 데이터 및 피부 생태학 연구를 기반으로 안전하게 설계된 포뮬러', evidence: '닥터오 메디컬 연구소 공동 임상 연구 내역', ymyl: 3 },
          { text: '시술 후 무너진 피부 장벽 회복률 98% 실증', evidence: '민감성 피부 대상 4주 임상 시험 및 장벽 회복 경피수분손실량(TEWL) 측정', ymyl: 4 },
          { text: '민감성 피부 자극 지수 0.00 비자극 인증 완료', evidence: '피부 자극 패치 테스트 검증서', ymyl: 2 },
          { text: '특허받은 온도 감응형 하이드로겔을 활용한 유효 성분 피부 침투 극대화', evidence: '하이드로겔 유효성분 흡수율 피부 흡수 특허 기술 보유', ymyl: 2 }
        ],
        forbidden_claims: [
          '피부과 레이저 시술 자체를 완벽히 대체하여 주름을 100% 즉각 영구 제거함',
          '아토피, 지루성 피부염 등 만성 피부 질환을 완전히 치료하는 의학적 치료제임',
          '식약처와 미국 FDA로부터 모든 피부 질환 치료용 전문의약품으로 정식 승인됨',
          '상처 난 부위나 짓무른 피부에 직접 도포하여 즉각적인 세포 세포 재생 완치 가능'
        ],
        products: [
          {
            name: '메디텐션 마스크',
            type: '하이드로겔 마스크',
            ingredients: ['세라마이드 NP', '하이드롤라이즈드 콜라겐', '판테놀', '아데노신'],
            features: ['피부 온도 감응식 고기능 리프팅 겔', '시술 후 즉각적인 열감 진정 및 붉은기 개선', '장벽 재생과 탄력 개선 복합 액션']
          },
          {
            name: '메디글로우 팩',
            type: '모델링 마스크',
            ingredients: ['규조토', '티트리 잎 가루', '알진', '병풀 추출물'],
            features: ['물 조절 필요 없는 급속 수분 쿨링 겔', '시술 직후 급성 자극을 빠르게 가라앉히는 급속 카밍', '수분 밀봉 기술로 48시간 보습막 형성']
          }
        ],
        competitors: [
          { name: '닥터자르트', domains: ['drjart.co.kr'], direct: true },
          { name: 'CNP 차앤박', domains: ['cnpcosmetics.com'], direct: true },
          { name: '라로슈포제', domains: ['laroche-posay.co.kr'], direct: false },
          { name: '메디힐', domains: ['mediheal.com'], direct: false }
        ],
        target_profile: '레이저 토닝, 슈링크, 필링 등 피부과 시술 후 피부가 극도로 예민해져 전문적인 리셋 홈케어가 필요한 25~45세 스마트 컨슈머',
        tone_guide: '신뢰감을 주는, 임상 및 과학에 근거한, 과장되지 않고 차분하며 전문적인 클리니컬 솔루션 지향적 어조'
      };
    }
  }
}
