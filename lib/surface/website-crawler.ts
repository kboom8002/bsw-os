import { z } from 'zod';
import https from 'https';

export interface RobotsBotPolicy {
  botName: string;           // 'OAI-SearchBot' | 'GPTBot' | 'Google-Extended' | ...
  allowed: boolean;
  disallowPaths?: string[];
  crawlDelay?: number;
}

export interface CrawledPage {
  url: string;
  title: string;
  metaDescription: string;
  ogMetadata: Record<string, string>;
  headings: { level: number; text: string }[];
  schemas: any[];
  bodyText: string;
  rawHtml: string;
  
  // === L1: 기술 인프라 신호 (Phase 1 P0) ===
  canonical?: string;                    // <link rel="canonical"> href
  metaRobots?: string;                   // <meta name="robots"> content
  metaAuthor?: string;                   // <meta name="author"> content
  hreflangTags?: { lang: string; href: string }[];  // hreflang 링크들
  viewport?: string;                     // <meta name="viewport">
  contentLanguage?: string;              // Content-Language 헤더 또는 html lang

  // === L2: 구조화 시맨틱 신호 (Phase 1~2) ===
  twitterCard?: Record<string, string>;  // twitter:* 메타
  datePublished?: string;                // <time> 또는 datePublished
  dateModified?: string;                 // dateModified
  favicon?: string;                      // favicon href

  // === L3: 콘텐츠 시맨틱 신호 (Phase 1~2) ===
  images?: { src: string; alt: string; width?: string; height?: string }[];
  videos?: { src: string; type: string }[];
  tables?: { headers: string[]; rows: string[][] }[];
  lists?: { type: 'ul' | 'ol'; items: string[] }[];
  outboundLinks?: { href: string; text: string; rel?: string }[];
  internalLinks?: { href: string; text: string }[];
  wordCount?: number;

  // === 감사 엔진 보강 (SPA 이중 소스) ===
  trustZoneText?: string;                // nav/footer에서 추출한 Trust 신호 텍스트
  isSpaRendered?: boolean;               // Jina 폴백으로 렌더된 페이지인지
}

export interface CrawlResult {
  pages: CrawledPage[];
  sitemapUrls: string[];
  // === 신규 ===
  robotsTxtRaw?: string;                          // robots.txt 원문
  robotsTxtBotPolicies?: RobotsBotPolicy[];       // 봇별 접근 정책
  llmsTxt?: string | null;                         // /llms.txt 내용 (없으면 null)
  sitemapLastmods?: { url: string; lastmod: string }[];  // lastmod 날짜
  httpsStatus?: boolean;                           // HTTPS 적용 여부
  sslCertExpiry?: string;                          // SSL 인증서 만료일
  ttfbMs?: number;                                 // 첫 페이지 TTFB (ms)
  redirectChain?: { url: string; status: number }[];  // 리다이렉트 체인
  httpStatusCodes?: { url: string; status: number }[]; // 각 페이지 상태 코드
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
 * Helper to recursively find a key in a schema object
 */
function findInSchema(schema: any, key: string): string | null {
  if (!schema) return null;
  if (typeof schema === 'object') {
    if (schema[key] && typeof schema[key] === 'string') {
      return schema[key];
    }
    if (Array.isArray(schema)) {
      for (const item of schema) {
        const found = findInSchema(item, key);
        if (found) return found;
      }
    } else {
      for (const prop in schema) {
        const found = findInSchema(schema[prop], key);
        if (found) return found;
      }
    }
  }
  return null;
}

/**
 * Custom RegExp HTML Parser
 * @param url 페이지 URL
 * @param html 원본 SSR HTML
 * @param jinaHtml Jina 렌더링 HTML (SPA 이중 소스 — optional)
 */
export function parseHtml(url: string, html: string, jinaHtml?: string): CrawledPage {
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

  // 6. Trust Zone 텍스트 보존 (nav/footer에서 E-E-A-T Trust 신호 추출)
  const trustZoneParts: string[] = [];
  const footerMatches = html.match(/<footer[\s\S]*?<\/footer>/gi) || [];
  const navMatches = html.match(/<nav[\s\S]*?<\/nav>/gi) || [];
  for (const zone of [...footerMatches, ...navMatches]) {
    const zoneText = decodeHtmlEntities(zone.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (zoneText.length > 10) trustZoneParts.push(zoneText);
  }
  const trustZoneText = trustZoneParts.join(' ').substring(0, 5000);

  // 7. Body Text extraction — Jina 이중 소스가 있으면 Jina HTML에서 bodyText 추출
  const bodySource = jinaHtml || html;
  let bodyContent = bodySource;
  bodyContent = bodyContent.replace(/<head\b[\s\S]*?<\/head>/i, '');
  bodyContent = bodyContent.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  bodyContent = bodyContent.replace(/<style\b[\s\S]*?<\/style>/gi, '');
  bodyContent = bodyContent.replace(/<nav\b[\s\S]*?<\/nav>/gi, '');
  bodyContent = bodyContent.replace(/<footer\b[\s\S]*?<\/footer>/gi, '');
  let bodyText = bodyContent.replace(/<[^>]+>/g, ' ');
  bodyText = decodeHtmlEntities(bodyText)
    .replace(/\s+/g, ' ')
    .trim();

  if (bodyText.length > 50000) {
    bodyText = bodyText.substring(0, 50000) + '... [truncated]';
  }

  // Jina 이중 소스가 있으면 headings도 Jina HTML에서 추출 보강
  if (jinaHtml && headings.length === 0) {
    const jinaHeadingRegex = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
    let jh;
    while ((jh = jinaHeadingRegex.exec(jinaHtml)) !== null) {
      const level = parseInt(jh[1], 10);
      const text = decodeHtmlEntities(jh[2].replace(/<[^>]+>/g, '').trim());
      if (text) headings.push({ level, text });
    }
  }

  // Extended Parse Items
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) ||
                         html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i);
  const authorMatch = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']*)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']author["']/i);
  const viewportMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']viewport["']/i);
  const langMatch = html.match(/<html[^>]+lang=["']([^"']*)["']/i);
  const faviconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]+href=["']([^"']*)["']/i) ||
                       html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/i);

  // Twitter Card
  const twitterCard: Record<string, string> = {};
  const twitterRegex = /<meta[^>]+(?:name|property)=["']twitter:([^"']+)["'][^>]+content=["']([^"']*)["']/gi;
  let twMatch;
  while ((twMatch = twitterRegex.exec(html)) !== null) {
    twitterCard[twMatch[1]] = decodeHtmlEntities(twMatch[2].trim());
  }
  const twitterRegexAlt = /<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']twitter:([^"']+)["']/gi;
  while ((twMatch = twitterRegexAlt.exec(html)) !== null) {
    twitterCard[twMatch[2]] = decodeHtmlEntities(twMatch[1].trim());
  }

  // Hreflang Tags
  const hreflangTags: { lang: string; href: string }[] = [];
  const hreflangRegex = /<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']*)["']/gi;
  let hrMatch;
  while ((hrMatch = hreflangRegex.exec(html)) !== null) {
    hreflangTags.push({ lang: hrMatch[1], href: hrMatch[2] });
  }

  // Dates
  const pubDateMatch = html.match(/<meta[^>]+(?:property|name)=["'](?:article:published_time|pubdate|publishdate|datepublished)["'][^>]+content=["']([^"']*)["']/i);
  const modDateMatch = html.match(/<meta[^>]+(?:property|name)=["'](?:article:modified_time|lastmod|lastmodified|datemodified)["'][^>]+content=["']([^"']*)["']/i);
  let datePublished = pubDateMatch ? pubDateMatch[1] : undefined;
  let dateModified = modDateMatch ? modDateMatch[1] : undefined;

  for (const s of schemas) {
    if (!datePublished) {
      const d = findInSchema(s, 'datePublished');
      if (d) datePublished = d;
    }
    if (!dateModified) {
      const d = findInSchema(s, 'dateModified');
      if (d) dateModified = d;
    }
  }

  // Images
  const images: { src: string; alt: string; width?: string; height?: string }[] = [];
  const imgRegex = /<img\b([^>]*)/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const attrs = imgMatch[1];
    const srcMatch = attrs.match(/src=["']([^"']*)["']/i);
    const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
    const widthMatch = attrs.match(/width=["']([^"']*)["']/i);
    const heightMatch = attrs.match(/height=["']([^"']*)["']/i);
    if (srcMatch && srcMatch[1]) {
      images.push({
        src: srcMatch[1],
        alt: altMatch ? decodeHtmlEntities(altMatch[1].trim()) : '',
        width: widthMatch ? widthMatch[1] : undefined,
        height: heightMatch ? heightMatch[1] : undefined,
      });
    }
  }

  // Videos
  const videos: { src: string; type: string }[] = [];
  const videoRegex = /<video\b([^>]*)/gi;
  let videoMatch;
  while ((videoMatch = videoRegex.exec(html)) !== null) {
    const attrs = videoMatch[1];
    const srcMatch = attrs.match(/src=["']([^"']*)["']/i);
    if (srcMatch && srcMatch[1]) {
      videos.push({ src: srcMatch[1], type: 'video' });
    }
  }
  const iframeRegex = /<iframe\b([^>]*)/gi;
  let iframeMatch;
  while ((iframeMatch = iframeRegex.exec(html)) !== null) {
    const attrs = iframeMatch[1];
    const srcMatch = attrs.match(/src=["']([^"']*(?:youtube|vimeo|dailymotion)[^"']*)["']/i);
    if (srcMatch && srcMatch[1]) {
      videos.push({ src: srcMatch[1], type: 'iframe' });
    }
  }

  // Tables
  const tables: { headers: string[]; rows: string[][] }[] = [];
  const tableRegex = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableContent = tableMatch[1];
    const headers: string[] = [];
    const thRegex = /<th\b[^>]*>([\s\S]*?)<\/th>/gi;
    let thMatch;
    while ((thMatch = thRegex.exec(tableContent)) !== null) {
      headers.push(decodeHtmlEntities(thMatch[1].replace(/<[^>]+>/g, '').trim()));
    }
    
    const rows: string[][] = [];
    const trRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(tableContent)) !== null) {
      const rowContent = trMatch[1];
      const tdRegex = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
      let tdMatch;
      const row: string[] = [];
      while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
        row.push(decodeHtmlEntities(tdMatch[1].replace(/<[^>]+>/g, '').trim()));
      }
      if (row.length > 0) {
        rows.push(row);
      }
    }
    tables.push({ headers, rows });
  }

  // Lists
  const lists: { type: 'ul' | 'ol'; items: string[] }[] = [];
  const listRegex = /<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let listMatch;
  while ((listMatch = listRegex.exec(html)) !== null) {
    const type = listMatch[1].toLowerCase() as 'ul' | 'ol';
    const listContent = listMatch[2];
    const items: string[] = [];
    const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    let liMatch;
    while ((liMatch = liRegex.exec(listContent)) !== null) {
      items.push(decodeHtmlEntities(liMatch[1].replace(/<[^>]+>/g, '').trim()));
    }
    if (items.length > 0) {
      lists.push({ type, items });
    }
  }

  // Links
  const outboundLinks: { href: string; text: string; rel?: string }[] = [];
  const internalLinks: { href: string; text: string }[] = [];
  const aRegex = /<a\b([^>]*?)>([\s\S]*?)<\/a>/gi;
  let aMatch;
  try {
    const baseUriObj = new URL(url);
    const origin = baseUriObj.origin;
    while ((aMatch = aRegex.exec(html)) !== null) {
      const attrs = aMatch[1];
      const text = decodeHtmlEntities(aMatch[2].replace(/<[^>]+>/g, '').trim());
      const hrefMatch = attrs.match(/href=["']([^"']*)["']/i);
      const relMatch = attrs.match(/rel=["']([^"']*)["']/i);
      if (hrefMatch && hrefMatch[1]) {
        let href = hrefMatch[1].trim();
        if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
          continue;
        }
        
        if (href.startsWith('//')) {
          href = baseUriObj.protocol + href;
        } else if (href.startsWith('/')) {
          href = origin + href;
        } else if (!href.startsWith('http://') && !href.startsWith('https://')) {
          const basePath = baseUriObj.pathname.endsWith('/') 
            ? baseUriObj.pathname 
            : baseUriObj.pathname.substring(0, baseUriObj.pathname.lastIndexOf('/') + 1);
          href = origin + basePath + href;
        }
        
        try {
          const urlObj = new URL(href);
          const rel = relMatch ? relMatch[1] : undefined;
          if (urlObj.host === baseUriObj.host) {
            if (!internalLinks.some(l => l.href === href)) {
              internalLinks.push({ href, text });
            }
          } else {
            if (!outboundLinks.some(l => l.href === href)) {
              outboundLinks.push({ href, text, rel });
            }
          }
        } catch (_) {}
      }
    }
  } catch (_) {}

  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

  return {
    url,
    title,
    metaDescription,
    ogMetadata,
    headings,
    schemas,
    bodyText,
    rawHtml: html.substring(0, 50000),
    trustZoneText,
    isSpaRendered: !!jinaHtml,
    canonical: canonicalMatch ? canonicalMatch[1] : undefined,
    metaRobots: robotsMatch ? robotsMatch[1] : undefined,
    metaAuthor: authorMatch ? authorMatch[1] : undefined,
    hreflangTags,
    viewport: viewportMatch ? viewportMatch[1] : undefined,
    contentLanguage: langMatch ? langMatch[1] : undefined,
    twitterCard,
    datePublished,
    dateModified,
    favicon: faviconMatch ? faviconMatch[1] : undefined,
    images,
    videos,
    tables,
    lists,
    outboundLinks,
    internalLinks,
    wordCount
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
      
      if (link.startsWith('//')) {
        link = baseUriObj.protocol + link;
      } else if (link.startsWith('/')) {
        link = origin + link;
      } else if (!link.startsWith('http://') && !link.startsWith('https://')) {
        const basePath = baseUriObj.pathname.endsWith('/') 
          ? baseUriObj.pathname 
          : baseUriObj.pathname.substring(0, baseUriObj.pathname.lastIndexOf('/') + 1);
        link = origin + basePath + link;
      }
      
      try {
        const linkUrl = new URL(link);
        if (linkUrl.host === baseUriObj.host) {
          linkUrl.hash = '';
          const normalized = linkUrl.toString();
          if (!links.includes(normalized)) {
            links.push(normalized);
          }
        }
      } catch (_) {}
    }
  } catch (e) {}
  
  return links;
}

export function parseRobotsTxt(robotsTxt: string): RobotsBotPolicy[] {
  const bots = ['OAI-SearchBot', 'GPTBot', 'Google-Extended', 'PerplexityBot', 'Anthropic-AI', 'Bingbot', '*'];
  const policies: Record<string, RobotsBotPolicy> = {};
  
  for (const bot of bots) {
    policies[bot] = { botName: bot, allowed: true, disallowPaths: [] };
  }

  const lines = robotsTxt.split(/\r?\n/);
  let currentAgents: string[] = [];

  for (const line of lines) {
    const cleanLine = line.split('#')[0].trim();
    if (!cleanLine) continue;

    const parts = cleanLine.split(':');
    if (parts.length < 2) continue;

    const key = parts[0].trim().toLowerCase();
    const value = parts.slice(1).join(':').trim();

    if (key === 'user-agent') {
      const agent = value.toLowerCase();
      currentAgents = [];
      for (const bot of bots) {
        if (agent === bot.toLowerCase()) {
          currentAgents.push(bot);
        }
      }
    } else if (key === 'disallow' && currentAgents.length > 0) {
      for (const agent of currentAgents) {
        if (value === '/' || value === '') {
          policies[agent].allowed = (value === '');
        }
        if (value) {
          policies[agent].disallowPaths = policies[agent].disallowPaths || [];
          if (!policies[agent].disallowPaths.includes(value)) {
            policies[agent].disallowPaths.push(value);
          }
        }
      }
    } else if (key === 'allow' && currentAgents.length > 0) {
      for (const agent of currentAgents) {
        if (value === '/') {
          policies[agent].allowed = true;
        }
      }
    } else if (key === 'crawl-delay' && currentAgents.length > 0) {
      const delay = parseFloat(value);
      if (!isNaN(delay)) {
        for (const agent of currentAgents) {
          policies[agent].crawlDelay = delay;
        }
      }
    }
  }

  const defaultPolicy = policies['*'];
  for (const bot of bots) {
    if (bot !== '*') {
      if (policies[bot].disallowPaths?.length === 0 && policies[bot].allowed === true) {
        policies[bot].allowed = defaultPolicy.allowed;
        policies[bot].disallowPaths = [...(defaultPolicy.disallowPaths || [])];
      }
    }
  }

  return Object.values(policies);
}

async function getSslDetails(urlStr: string): Promise<{ enabled: boolean; expiry?: string }> {
  try {
    const urlObj = new URL(urlStr);
    if (urlObj.protocol !== 'https:') {
      return { enabled: false };
    }
    
    return new Promise((resolve) => {
      const req = https.request({
        host: urlObj.hostname,
        port: 443,
        method: 'GET',
        agent: false,
        rejectUnauthorized: false
      }, (res) => {
        const socket = res.socket as any;
        if (socket && typeof socket.getPeerCertificate === 'function') {
          const cert = socket.getPeerCertificate();
          if (cert && cert.valid_to) {
            resolve({ enabled: true, expiry: new Date(cert.valid_to).toISOString() });
            return;
          }
        }
        resolve({ enabled: true });
      });
      
      req.on('error', () => {
        resolve({ enabled: false });
      });
      
      req.end();
    });
  } catch (_) {
    return { enabled: false };
  }
}

/**
 * Website crawler class
 */
export class WebsiteCrawler {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (BSW-AEO-Bot/1.0)';

  async fetchPage(url: string, isSpaFallback = false): Promise<{ content: string; status: number; ttfb?: number; jinaHtml?: string; isSpaRendered?: boolean }> {
    const startTime = performance.now();
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      const ttfb = performance.now() - startTime;
      
      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }
      
      const content = await res.text();
      
      // SPA 감지: HTML이 매우 짧고 JS 렌더링 마커가 있는 경우
      const isSpa = content.length < 2000 && (
        content.includes('id="root"') || content.includes('id="app"') ||
        content.includes('id="__next"') || content.includes('__NEXT_DATA__')
      );
      
      if (isSpa) {
        console.warn(`[Crawler] SPA detected for ${url}. Fetching Jina rendered HTML...`);
        try {
          const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
            headers: {
              'User-Agent': this.userAgent,
              'Accept': 'text/html',  // HTML 형태로 요청
              'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            signal: AbortSignal.timeout(15000)
          });
          if (jinaRes.ok) {
            const jinaContent = await jinaRes.text();
            // 이중 소스: 원본 HTML(head) + Jina HTML(body)
            return { content, status: res.status, ttfb, jinaHtml: jinaContent, isSpaRendered: true };
          }
        } catch (jinaErr: any) {
          console.warn(`[Crawler] Jina fallback failed for ${url}: ${jinaErr.message}`);
        }
        // Jina도 실패하면 원본 HTML이라도 반환
        return { content, status: res.status, ttfb, isSpaRendered: true };
      }
      
      return { content, status: res.status, ttfb };
    } catch (e: any) {
      // 원본 fetch 자체가 실패하면 Jina로 단독 시도
      console.warn(`[Crawler] Initial fetch failed for ${url}, trying Jina fallback...`);
      try {
        const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'text/html',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
          },
          signal: AbortSignal.timeout(15000)
        });
        if (jinaRes.ok) {
          const jinaContent = await jinaRes.text();
          return { content: jinaContent, status: jinaRes.status, isSpaRendered: true };
        }
      } catch (_) {}
      throw new Error(`Failed to fetch ${url}: ${e.message}`);
    }
  }

  async checkRobotsTxt(rootUrl: string): Promise<{ raw: string; policies: RobotsBotPolicy[]; allowed: boolean }> {
    try {
      const u = new URL(rootUrl);
      const robotsUrl = `${u.origin}/robots.txt`;
      const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const text = await res.text();
        const policies = parseRobotsTxt(text);
        const allowed = !policies.some(p => p.botName === '*' && !p.allowed);
        return { raw: text, policies, allowed };
      }
      return { raw: '', policies: [], allowed: true };
    } catch (e) {
      return { raw: '', policies: [], allowed: true };
    }
  }

  async tryGetSitemapUrls(rootUrl: string): Promise<{ urls: string[]; lastmods: { url: string; lastmod: string }[] }> {
    const urls: string[] = [];
    const lastmods: { url: string; lastmod: string }[] = [];
    const root = rootUrl.endsWith('/') ? rootUrl.slice(0, -1) : rootUrl;
    const sitemapCandidates = [
      `${root}/sitemap.xml`,
      `${root}/sitemap_index.xml`,
      `${root}/sitemap-pages.xml`
    ];

    for (const sitemapUrl of sitemapCandidates) {
      try {
        const { content } = await this.fetchPage(sitemapUrl);
        const locMatches = content.match(/<loc>\s*(https?:\/\/[^\s<]+)\s*<\/loc>/gi);
        if (locMatches) {
          const lastmodMatches = content.match(/<lastmod>\s*([^\s<]+)\s*<\/lastmod>/gi) || [];
          
          for (let i = 0; i < locMatches.length; i++) {
            const cleanUrl = locMatches[i].replace(/<\/?loc>/g, '').trim();
            const cleanLastmod = lastmodMatches[i] ? lastmodMatches[i].replace(/<\/?lastmod>/g, '').trim() : '';
            
            try {
              if (new URL(cleanUrl).host === new URL(rootUrl).host) {
                if (!urls.includes(cleanUrl) && !cleanUrl.endsWith('.xml') && !cleanUrl.endsWith('.png') && !cleanUrl.endsWith('.jpg')) {
                  urls.push(cleanUrl);
                  if (cleanLastmod) {
                    lastmods.push({ url: cleanUrl, lastmod: cleanLastmod });
                  }
                }
              }
            } catch (_) {}
          }
        }
        if (urls.length > 0) {
          break;
        }
      } catch (_) {}
    }

    return { urls, lastmods };
  }

  async crawl(rootUrl: string, maxPages = 20): Promise<CrawlResult> {
    const crawled: CrawledPage[] = [];
    const visited = new Set<string>();
    const httpStatusCodes: { url: string; status: number }[] = [];
    
    let normalizedRoot = rootUrl;
    try {
      const u = new URL(rootUrl);
      normalizedRoot = u.origin + u.pathname;
    } catch (_) {}

    // L1 Details
    const { raw: robotsTxtRaw, policies: robotsTxtBotPolicies, allowed: isAllowed } = await this.checkRobotsTxt(normalizedRoot);
    const sslDetails = await getSslDetails(normalizedRoot);
    const llmsTxt = await this.fetchLlmsTxt(normalizedRoot);
    
    if (!isAllowed) {
      console.warn(`[Crawler] Aborting crawl due to robots.txt restrictions.`);
      return {
        pages: [],
        sitemapUrls: [],
        robotsTxtRaw,
        robotsTxtBotPolicies,
        llmsTxt,
        httpsStatus: sslDetails.enabled,
        sslCertExpiry: sslDetails.expiry,
        httpStatusCodes
      };
    }

    // TTFB for the first page
    let firstPageTtfb: number | undefined;
    
    // Sitemap
    console.log(`[Crawler] Attempting to parse sitemap for ${normalizedRoot}`);
    const { urls: targetUrls, lastmods: sitemapLastmods } = await this.tryGetSitemapUrls(normalizedRoot);
    
    if (targetUrls.length > 0) {
      console.log(`[Crawler] Found ${targetUrls.length} URLs from sitemap.`);
      const activeUrls = targetUrls.slice(0, maxPages);
      for (let i = 0; i < activeUrls.length; i++) {
        const url = activeUrls[i];
        try {
          console.log(`[Crawler] Fetching sitemap URL: ${url}`);
          const { content: html, status, ttfb, jinaHtml } = await this.fetchPage(url);
          if (i === 0) firstPageTtfb = ttfb;
          httpStatusCodes.push({ url, status });
          crawled.push(parseHtml(url, html, jinaHtml));
        } catch (e: any) {
          console.warn(`[Crawler] Skip ${url}: ${e.message}`);
          httpStatusCodes.push({ url, status: 500 });
        }
      }
      return {
        pages: crawled,
        sitemapUrls: targetUrls,
        robotsTxtRaw,
        robotsTxtBotPolicies,
        llmsTxt,
        sitemapLastmods,
        httpsStatus: sslDetails.enabled,
        sslCertExpiry: sslDetails.expiry,
        ttfbMs: firstPageTtfb,
        httpStatusCodes
      };
    }

    // Fallback Link Spider
    console.log(`[Crawler] Sitemap not found or empty. Using spider crawler for ${normalizedRoot}`);
    const queue: string[] = [normalizedRoot];
    
    while (queue.length > 0 && crawled.length < maxPages) {
      const url = queue.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);

      try {
        console.log(`[Crawler] Fetching: ${url} (${crawled.length + 1}/${maxPages})`);
        const { content: html, status, ttfb, jinaHtml } = await this.fetchPage(url);
        if (crawled.length === 0) firstPageTtfb = ttfb;
        httpStatusCodes.push({ url, status });
        const parsed = parseHtml(url, html, jinaHtml);
        crawled.push(parsed);

        const discovered = discoverLinks(url, html);
        for (const link of discovered) {
          if (!visited.has(link) && !queue.includes(link)) {
            queue.push(link);
          }
        }
      } catch (e: any) {
        console.warn(`[Crawler] Spider skip ${url}: ${e.message}`);
        httpStatusCodes.push({ url, status: 500 });
      }
    }

    return {
      pages: crawled,
      sitemapUrls: [],
      robotsTxtRaw,
      robotsTxtBotPolicies,
      llmsTxt,
      httpsStatus: sslDetails.enabled,
      sslCertExpiry: sslDetails.expiry,
      ttfbMs: firstPageTtfb,
      httpStatusCodes
    };
  }

  async fetchLlmsTxt(rootUrl: string): Promise<string | null> {
    try {
      const u = new URL(rootUrl);
      const llmsUrl = `${u.origin}/llms.txt`;
      const res = await fetch(llmsUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const text = await res.text();
        return text;
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}
