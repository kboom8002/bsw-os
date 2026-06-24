export interface RobotsBotPolicy {
  botName: string;
  allowed: boolean;
  disallowPaths?: string[];
  crawlDelay?: number;
}

export interface TechIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'crawlability' | 'performance' | 'security' | 'structure';
  title: string;
  description: string;
  recommendation: string;
  affectedUrls?: string[];
}

export interface TechInfraAuditResult {
  robotsBotMatrix: RobotsBotPolicy[];
  aiCrawlerAccessScore: number;
  httpsEnabled: boolean;
  sslCertValid: boolean;
  sslCertExpiryDays: number;
  ttfbMs: number;
  ttfbGrade: 'fast' | 'moderate' | 'slow';
  redirectChainDepth: number;
  brokenLinks: { url: string; status: number }[];
  renderingMode: 'ssr' | 'csr' | 'hybrid';
  spaDetected: boolean;
  sitemapExists: boolean;
  sitemapUrlCount: number;
  sitemapFreshnessScore: number;
  llmsTxtExists: boolean;
  llmsTxtContent?: string;
  canonicalConsistency: number;
  hreflangCoverage?: { lang: string; coverage: number }[];
  techInfraScore: number;
  issues: TechIssue[];
}

import { CrawlResult, CrawledPage } from './website-crawler';

export class TechInfraAuditor {
  static audit(crawlResult: CrawlResult): TechInfraAuditResult {
    const issues: TechIssue[] = [];
    const pages = crawlResult.pages || [];

    // 1. Robots.txt AI Bot accessibility matrix (30%)
    const robotsBotMatrix = crawlResult.robotsTxtBotPolicies || [];
    let aiCrawlerAccessScore = 100;
    const targetAiBots = ['OAI-SearchBot', 'GPTBot', 'Google-Extended', 'PerplexityBot', 'Anthropic-AI'];
    let disallowedCount = 0;
    
    for (const bot of targetAiBots) {
      const policy = robotsBotMatrix.find(p => p.botName.toLowerCase() === bot.toLowerCase());
      if (policy && !policy.allowed) {
        disallowedCount++;
        issues.push({
          severity: 'critical',
          category: 'crawlability',
          title: `AI Search Bot ${bot} blocked in robots.txt`,
          description: `The robots.txt file specifically blocks the search bot '${bot}' from crawling content. This will prevent your content from appearing in its AI search responses.`,
          recommendation: `Update your robots.txt to Allow: / for ${bot}.`
        });
      }
    }
    
    // Deduct 20 points per disallowed target bot
    aiCrawlerAccessScore = Math.max(0, 100 - disallowedCount * 20);

    // 2. SSL / HTTPS (15%)
    const httpsEnabled = !!crawlResult.httpsStatus;
    let sslCertValid = httpsEnabled;
    let sslCertExpiryDays = 0;
    
    if (crawlResult.sslCertExpiry) {
      const expiry = new Date(crawlResult.sslCertExpiry);
      const now = new Date();
      const diffMs = expiry.getTime() - now.getTime();
      sslCertExpiryDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (sslCertExpiryDays <= 0) {
        sslCertValid = false;
        issues.push({
          severity: 'critical',
          category: 'security',
          title: 'SSL Certificate expired',
          description: `The SSL certificate for the website expired on ${expiry.toLocaleDateString()}. AI search engines and human users will receive security warnings and may fail to load the site.`,
          recommendation: 'Renew your SSL certificate immediately.'
        });
      } else if (sslCertExpiryDays < 30) {
        issues.push({
          severity: 'warning',
          category: 'security',
          title: `SSL Certificate expiring in ${sslCertExpiryDays} days`,
          description: `The SSL certificate will expire soon. AI crawlers require secure and valid HTTPS endpoints.`,
          recommendation: 'Renew the SSL certificate before expiration.'
        });
      }
    } else if (!httpsEnabled) {
      sslCertValid = false;
      issues.push({
        severity: 'critical',
        category: 'security',
        title: 'HTTPS not enabled',
        description: 'The website is running on insecure HTTP. AI crawlers and modern browsers penalize or refuse to index insecure HTTP websites.',
        recommendation: 'Redirect all HTTP traffic to HTTPS and set up an SSL certificate.'
      });
    }

    // 3. Performance / TTFB (15%)
    const ttfbMs = crawlResult.ttfbMs || 0;
    let ttfbGrade: 'fast' | 'moderate' | 'slow' = 'slow';
    let ttfbScore = 0;
    
    if (ttfbMs > 0) {
      if (ttfbMs < 800) {
        ttfbGrade = 'fast';
        ttfbScore = 100;
      } else if (ttfbMs < 3000) {
        ttfbGrade = 'moderate';
        ttfbScore = 60;
        issues.push({
          severity: 'warning',
          category: 'performance',
          title: `Moderate Response Time (TTFB: ${Math.round(ttfbMs)}ms)`,
          description: 'The time to first byte is moderate. Slow server response times affect bot indexing speeds and conversion rates.',
          recommendation: 'Optimize database queries, leverage edge caching, or upgrade server hosting infrastructure.'
        });
      } else {
        ttfbGrade = 'slow';
        ttfbScore = 20;
        issues.push({
          severity: 'critical',
          category: 'performance',
          title: `Slow Time to First Byte (TTFB: ${Math.round(ttfbMs)}ms)`,
          description: 'The server takes a very long time to return the first byte of response. AI search crawler timeouts can occur.',
          recommendation: 'Implement static site generation (SSG) or configure a CDN for caching.'
        });
      }
    }

    // Broken links and Status codes
    const brokenLinks: { url: string; status: number }[] = [];
    const statusCodes = crawlResult.httpStatusCodes || [];
    for (const item of statusCodes) {
      if (item.status >= 400) {
        brokenLinks.push(item);
      }
    }
    
    if (brokenLinks.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        title: `${brokenLinks.length} Broken pages detected`,
        description: `Found ${brokenLinks.length} internal links returning error status codes (e.g. 404 or 500). AI crawlers will hit dead ends.`,
        recommendation: 'Fix or remove the broken links or add redirects.',
        affectedUrls: brokenLinks.map(b => b.url)
      });
    }

    // 4. Sitemap quality (15%)
    const sitemapExists = (crawlResult.sitemapUrls || []).length > 0;
    const sitemapUrlCount = (crawlResult.sitemapUrls || []).length;
    let sitemapFreshnessScore = 0;
    
    if (sitemapExists) {
      const lastmods = crawlResult.sitemapLastmods || [];
      if (lastmods.length > 0) {
        const now = new Date();
        let freshCount = 0;
        for (const item of lastmods) {
          try {
            const date = new Date(item.lastmod);
            const ageDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
            if (ageDays <= 90) {
              freshCount++;
            }
          } catch (_) {}
        }
        sitemapFreshnessScore = Math.round((freshCount / lastmods.length) * 100);
      } else {
        sitemapFreshnessScore = 50; // Sitemap exists but no lastmod tags
      }
    } else {
      issues.push({
        severity: 'warning',
        category: 'structure',
        title: 'Sitemap.xml not found',
        description: 'Sitemap index file was not discovered. AI crawlers require a sitemap to discover all semantically relevant resources on the site.',
        recommendation: 'Generate a standard sitemap.xml and register it in robots.txt.'
      });
    }
    
    const sitemapScore = sitemapExists ? (50 + sitemapFreshnessScore / 2) : 0;

    // 5. Canonical consistency (15%)
    let canonicalConsistency = 0;
    let pagesWithCanonical = 0;
    const invalidCanonicals: string[] = [];
    
    if (pages.length > 0) {
      for (const page of pages) {
        if (page.canonical) {
          pagesWithCanonical++;
          // check if absolute and matches hostname
          try {
            const pageUrl = new URL(page.url);
            const canonicalUrl = new URL(page.canonical);
            if (pageUrl.host !== canonicalUrl.host) {
              invalidCanonicals.push(page.url);
            }
          } catch (_) {
            invalidCanonicals.push(page.url);
          }
        }
      }
      canonicalConsistency = Math.round((pagesWithCanonical / pages.length) * 100);
    }
    
    if (pages.length > 0 && canonicalConsistency < 90) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        title: `Low Canonical Consistency (${canonicalConsistency}%)`,
        description: `${pages.length - pagesWithCanonical} out of ${pages.length} pages are missing a <link rel="canonical"> tag. AI crawlers may duplicate content indexing.`,
        recommendation: 'Configure canonical tags on all public pages.'
      });
    }
    
    if (invalidCanonicals.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        title: 'Invalid canonical tags detected',
        description: 'Some pages have canonical tags that point to external or malformed URLs.',
        recommendation: 'Audit canonical tag rendering to point to the correct self-referential URL.',
        affectedUrls: invalidCanonicals
      });
    }

    // 6. Rendering Mode & llms.txt (10%)
    const llmsTxtExists = !!crawlResult.llmsTxt;
    if (!llmsTxtExists) {
      issues.push({
        severity: 'info',
        category: 'crawlability',
        title: 'llms.txt file not found',
        description: 'Creating an /llms.txt file provides structured instructions and summaries specifically for LLM search bots in a single clean place.',
        recommendation: 'Create and host /llms.txt summarizing your brand, services, and product offerings.'
      });
    }

    // Check if Jina or headful SPA rendering was fallback-triggered
    let spaDetected = false;
    let ssrPages = 0;
    for (const page of pages) {
      if (page.rawHtml.includes('id="root"') || page.rawHtml.includes('id="app"') || page.rawHtml.includes('__next')) {
        if (page.rawHtml.length < 5000 && page.rawHtml.includes('<script')) {
          spaDetected = true;
        }
      }
      if (!page.rawHtml.includes('r.jina.ai')) {
        ssrPages++;
      }
    }
    
    const renderingMode = spaDetected ? 'csr' : (ssrPages === pages.length ? 'ssr' : 'hybrid');
    if (spaDetected) {
      issues.push({
        severity: 'warning',
        category: 'crawlability',
        title: 'SPA (Client-Side Rendering) detected',
        description: 'Your pages rely heavily on CSR. Although AI search bots can run JS occasionally, static pre-rendering (SSR/SSG) is highly recommended for semantic indexing.',
        recommendation: 'Switch your web framework rendering to SSR or generate static pages.'
      });
    }

    let renderingScore = renderingMode === 'ssr' ? 100 : (renderingMode === 'hybrid' ? 80 : 40);
    if (llmsTxtExists) {
      // Add bonus points for llms.txt
      renderingScore = Math.min(100, renderingScore + 10);
    }

    // Compute Overall techInfraScore
    // 30% AI crawler + 15% SSL + 15% TTFB + 15% Sitemap + 15% Canonical + 10% Rendering
    const sslScore = sslCertValid ? 100 : (httpsEnabled ? 50 : 0);
    
    const techInfraScore = Math.round(
      (aiCrawlerAccessScore * 0.3) +
      (sslScore * 0.15) +
      (ttfbScore * 0.15) +
      (sitemapScore * 0.15) +
      (canonicalConsistency * 0.15) +
      (renderingScore * 0.1)
    );

    return {
      robotsBotMatrix,
      aiCrawlerAccessScore,
      httpsEnabled,
      sslCertValid,
      sslCertExpiryDays,
      ttfbMs,
      ttfbGrade,
      redirectChainDepth: crawlResult.redirectChain?.length || 0,
      brokenLinks,
      renderingMode,
      spaDetected,
      sitemapExists,
      sitemapUrlCount,
      sitemapFreshnessScore,
      llmsTxtExists,
      llmsTxtContent: crawlResult.llmsTxt || undefined,
      canonicalConsistency,
      techInfraScore,
      issues
    };
  }
}
