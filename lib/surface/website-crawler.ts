import { z } from 'zod';

export interface CrawledPage {
  url: string;
  title: string;
  metaDescription: string;
  ogMetadata: Record<string, string>;
  headings: { level: number; text: string }[];
  schemas: any[];
  bodyText: string;
  rawHtml: string;
}

/**
 * Clean HTML entity characters
 */
function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®');
}

/**
 * Custom RegExp HTML Parser
 */
export function parseHtml(url: string, html: string): CrawledPage {
  // 1. Title
  let title = '';
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = decodeHtmlEntities(titleMatch[1].trim());
  }

  // 2. Meta description
  let metaDescription = '';
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  if (descMatch) {
    metaDescription = decodeHtmlEntities(descMatch[1].trim());
  }

  // 3. OG Metadata
  const ogMetadata: Record<string, string> = {};
  const ogRegex = /<meta[^>]+property=["']og:([^"']+)["'][^>]+content=["']([^"']*)["']/gi;
  let match;
  while ((match = ogRegex.exec(html)) !== null) {
    ogMetadata[match[1]] = decodeHtmlEntities(match[2].trim());
  }
  
  // Alternative og order
  const ogRegexAlt = /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:([^"']+)["']/gi;
  while ((match = ogRegexAlt.exec(html)) !== null) {
    ogMetadata[match[2]] = decodeHtmlEntities(match[1].trim());
  }

  // 4. Headings
  const headings: { level: number; text: string }[] = [];
  const headingRegex = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    // Strip nested tags from within heading
    const text = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, '').trim());
    if (text) {
      headings.push({ level, text });
    }
  }

  // 5. JSON-LD Schemas
  const schemas: any[] = [];
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const cleanJson = match[1].replace(/<!--[\s\S]*?-->/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      schemas.push(parsed);
    } catch (e) {
      // Ignore invalid JSON
    }
  }

  // 6. Body Text extraction (strip head, scripts, styles, header, nav, footer, etc.)
  let bodyContent = html;
  
  // Strip head
  bodyContent = bodyContent.replace(/<head\b[\s\S]*?<\/head>/i, '');
  // Strip scripts & styles
  bodyContent = bodyContent.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  bodyContent = bodyContent.replace(/<style\b[\s\S]*?<\/style>/gi, '');
  // Strip nav & footer if possible to focus on main content
  bodyContent = bodyContent.replace(/<nav\b[\s\S]*?<\/nav>/gi, '');
  bodyContent = bodyContent.replace(/<footer\b[\s\S]*?<\/footer>/gi, '');
  // Strip all other HTML tags
  let bodyText = bodyContent.replace(/<[^>]+>/g, ' ');
  // Clean whitespace
  bodyText = decodeHtmlEntities(bodyText)
    .replace(/\s+/g, ' ')
    .trim();

  // Limit body text to 50k chars to avoid token blows
  if (bodyText.length > 50000) {
    bodyText = bodyText.substring(0, 50000) + '... [truncated]';
  }

  return {
    url,
    title,
    metaDescription,
    ogMetadata,
    headings,
    schemas,
    bodyText,
    rawHtml: html.substring(0, 10000) // Keep preview
  };
}

/**
 * Discover internal links on a page
 */
function discoverLinks(baseUrl: string, html: string): string[] {
  const links: string[] = [];
  const hrefRegex = /href=["'](https?:\/\/[^"']+|[^"']+)["']/gi;
  let match;
  
  try {
    const baseUriObj = new URL(baseUrl);
    const origin = baseUriObj.origin;
    
    while ((match = hrefRegex.exec(html)) !== null) {
      let link = match[1].trim();
      if (link.startsWith('#') || link.startsWith('javascript:') || link.startsWith('mailto:') || link.startsWith('tel:')) {
        continue;
      }
      
      // Resolve relative URLs
      if (link.startsWith('//')) {
        link = baseUriObj.protocol + link;
      } else if (link.startsWith('/')) {
        link = origin + link;
      } else if (!link.startsWith('http://') && !link.startsWith('https://')) {
        // relative to path
        const basePath = baseUriObj.pathname.endsWith('/') 
          ? baseUriObj.pathname 
          : baseUriObj.pathname.substring(0, baseUriObj.pathname.lastIndexOf('/') + 1);
        link = origin + basePath + link;
      }
      
      // Filter out external links
      try {
        const linkUrl = new URL(link);
        if (linkUrl.host === baseUriObj.host) {
          // Remove hash & query to normalize
          linkUrl.hash = '';
          const normalized = linkUrl.toString();
          if (!links.includes(normalized)) {
            links.push(normalized);
          }
        }
      } catch (_) {}
    }
  } catch (e) {
    // If baseUrl invalid
  }
  
  return links;
}

/**
 * Website crawler class
 */
export class WebsiteCrawler {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (BSW-AEO-Bot/1.0)';

  async fetchPage(url: string): Promise<string> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });
      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }
      return await res.text();
    } catch (e: any) {
      throw new Error(`Failed to fetch ${url}: ${e.message}`);
    }
  }

  /**
   * Try to fetch and parse sitemap URLs
   */
  async tryGetSitemapUrls(rootUrl: string): Promise<string[]> {
    const urls: string[] = [];
    const root = rootUrl.endsWith('/') ? rootUrl.slice(0, -1) : rootUrl;
    const sitemapCandidates = [
      `${root}/sitemap.xml`,
      `${root}/sitemap_index.xml`,
      `${root}/sitemap-pages.xml`
    ];

    for (const sitemapUrl of sitemapCandidates) {
      try {
        const content = await this.fetchPage(sitemapUrl);
        const locMatches = content.match(/<loc>\s*(https?:\/\/[^\s<]+)\s*<\/loc>/gi);
        if (locMatches) {
          for (const locMatch of locMatches) {
            const cleanUrl = locMatch.replace(/<\/?loc>/g, '').trim();
            // Verify same domain
            try {
              if (new URL(cleanUrl).host === new URL(rootUrl).host) {
                if (!urls.includes(cleanUrl) && !cleanUrl.endsWith('.xml') && !cleanUrl.endsWith('.png') && !cleanUrl.endsWith('.jpg')) {
                  urls.push(cleanUrl);
                }
              }
            } catch (_) {}
          }
        }
        if (urls.length > 0) {
          break; // Found working sitemap
        }
      } catch (_) {
        // Continue to next sitemap candidate
      }
    }

    return urls;
  }

  /**
   * Crawl a website up to maxPages
   */
  async crawl(rootUrl: string, maxPages = 20): Promise<CrawledPage[]> {
    const crawled: CrawledPage[] = [];
    const visited = new Set<string>();
    
    // Normalize rootUrl
    let normalizedRoot = rootUrl;
    try {
      const u = new URL(rootUrl);
      normalizedRoot = u.origin + u.pathname;
    } catch (_) {}

    // Step 1: Try sitemap
    console.log(`[Crawler] Attempting to parse sitemap for ${normalizedRoot}`);
    let targetUrls = await this.tryGetSitemapUrls(normalizedRoot);
    
    if (targetUrls.length > 0) {
      console.log(`[Crawler] Found ${targetUrls.length} URLs from sitemap.`);
      // Limit list
      targetUrls = targetUrls.slice(0, maxPages);
      for (const url of targetUrls) {
        try {
          console.log(`[Crawler] Fetching sitemap URL: ${url}`);
          const html = await this.fetchPage(url);
          crawled.push(parseHtml(url, html));
        } catch (e: any) {
          console.warn(`[Crawler] Skip ${url}: ${e.message}`);
        }
      }
      return crawled;
    }

    // Step 2: Fallback to link spider crawling
    console.log(`[Crawler] Sitemap not found or empty. Using spider crawler for ${normalizedRoot}`);
    const queue: string[] = [normalizedRoot];
    
    while (queue.length > 0 && crawled.length < maxPages) {
      const url = queue.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);

      try {
        console.log(`[Crawler] Fetching: ${url} (${crawled.length + 1}/${maxPages})`);
        const html = await this.fetchPage(url);
        const parsed = parseHtml(url, html);
        crawled.push(parsed);

        // Discover and add links
        const discovered = discoverLinks(url, html);
        for (const link of discovered) {
          if (!visited.has(link) && !queue.includes(link)) {
            queue.push(link);
          }
        }
      } catch (e: any) {
        console.warn(`[Crawler] Spider skip ${url}: ${e.message}`);
      }
    }

    return crawled;
  }
}
