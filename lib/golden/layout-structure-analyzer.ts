/**
 * lib/golden/layout-structure-analyzer.ts
 *
 * Analyzes the DOM structure of a crawled HTML page to identify:
 *  - Global Navigation Bar (GNB) style and content
 *  - Shell / layout classification
 *  - Footer composition
 *  - Hero section characteristics
 */

import { CrawledPage } from '../surface/website-crawler';
import {
  LayoutStructureSnapshot,
  GnbAnalysis,
  GnbStyle,
  GnbItem,
  ShellAnalysis,
  FooterAnalysis,
  HeroAnalysis,
} from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractTagContent(html: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}

/** Extract text content of <a> tags within a block of HTML */
function extractLinks(html: string): { text: string; href: string }[] {
  const links: { text: string; href: string }[] = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (text.length > 0 && text.length < 80) links.push({ text, href });
  }
  return links;
}

function extractLinkHrefs(html: string): string[] {
  const hrefs: string[] = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) hrefs.push(m[1]);
  return hrefs;
}

// ─── Analyzer ─────────────────────────────────────────────────────────────────

export class LayoutStructureAnalyzer {
  analyze(page: CrawledPage, brandName: string): LayoutStructureSnapshot {
    const rawHtml = page.rawHtml ?? '';

    return {
      brandName,
      gnb: this.analyzeGnb(rawHtml),
      shell: this.analyzeShell(rawHtml),
      footer: this.analyzeFooter(rawHtml),
      hero: this.analyzeHero(rawHtml),
    };
  }

  // ─── GNB ───────────────────────────────────────────────────────────────────

  private analyzeGnb(html: string): GnbAnalysis {
    const navContent = extractTagContent(html, 'nav') ?? extractTagContent(html, 'header') ?? '';

    const links = extractLinks(navContent).slice(0, 30);
    const hasDropdownMenu = /<ul[^>]*>[\s\S]*?<ul[^>]*>/i.test(navContent);

    // Build GnbItem list: detect dropdown children by looking for <li> containing <ul>
    const items: GnbItem[] = [];
    for (const link of links) {
      items.push({
        label: link.text,
        depth: 0,
        hasDropdown: hasDropdownMenu,
      });
    }

    const hasSearch =
      /<input[^>]+type=["']search["'][^>]*>/i.test(navContent) ||
      /search-icon|icon-search|fa-search|magnif/i.test(navContent);

    const hasCtaButton =
      /class=["'][^"']*\b(btn|button)\b[^"']*["']/i.test(navContent) ||
      /<button[^>]*>/i.test(navContent);

    const style = this.classifyGnbStyle(navContent);

    return {
      style,
      itemCount: items.length,
      items,
      hasSearch,
      hasCtaButton,
      hasDropdownMenu,
    };
  }

  private classifyGnbStyle(navHtml: string): GnbStyle {
    if (!navHtml) return 'unknown';

    if (
      /background\s*:\s*(transparent|none)/i.test(navHtml) ||
      /background-color\s*:\s*transparent/i.test(navHtml) ||
      /position\s*:\s*(fixed|absolute)/i.test(navHtml)
    ) {
      return 'transparent_overlay';
    }

    const hasAnyBg =
      /background(?:-color)?\s*:/i.test(navHtml) ||
      /border\s*:/i.test(navHtml);

    if (!hasAnyBg) return 'minimal_text';
    return 'classic_bordered';
  }

  // ─── Shell ──────────────────────────────────────────────────────────────────

  private analyzeShell(html: string): ShellAnalysis {
    const hasFullscreen = /height\s*:\s*100vh/i.test(html);
    if (hasFullscreen) {
      return { type: 'immersive_fullbleed', maxWidth: null };
    }

    const maxWidthMatch = html.match(/max-width\s*:\s*(\d+)px/i);
    const maxWidth = maxWidthMatch ? parseInt(maxWidthMatch[1], 10) : null;

    if (maxWidth !== null && maxWidth > 1400) {
      return { type: 'immersive_fullbleed', maxWidth };
    }

    const sectionCount = (html.match(/<section[^>]*>/gi) ?? []).length;
    const divCount = (html.match(/<div[^>]*>/gi) ?? []).length;

    if (sectionCount >= 4 && divCount < 300) {
      return { type: 'editorial_atelier', maxWidth };
    }

    if (divCount > 300 || (html.includes('<table') && sectionCount >= 3)) {
      return { type: 'clinical_authority', maxWidth };
    }

    return { type: 'brand_story', maxWidth };
  }

  // ─── Footer ─────────────────────────────────────────────────────────────────

  private analyzeFooter(html: string): FooterAnalysis {
    const footerContent = extractTagContent(html, 'footer') ?? '';
    const hrefs = extractLinkHrefs(footerContent);

    const hasNewsletterForm = /<form[^>]*>/i.test(footerContent);

    const socialPlatforms = ['facebook', 'instagram', 'youtube', 'tiktok', 'twitter', 'linkedin'];
    const socialLinks: { platform: string; href: string }[] = [];
    for (const href of hrefs) {
      for (const platform of socialPlatforms) {
        if (href.toLowerCase().includes(platform)) {
          if (!socialLinks.find((s) => s.platform === platform)) {
            socialLinks.push({ platform, href });
          }
        }
      }
    }

    const hasSitemapLinks = hrefs.some((h) => /sitemap/i.test(h));

    const hasMapEmbed =
      /<iframe[^>]+src=["'][^"']*(?:google\.com\/maps|maps\.googleapis|kakaomap|naver.*map)[^"']*["']/i.test(footerContent) ||
      /<div[^>]+class=["'][^"']*map[^"']*["']/i.test(footerContent);

    const hasCertificationBadges =
      /<img[^>]+(?:class|alt)=["'][^"']*(?:cert|certified|badge|award|license)[^"']*["']/i.test(footerContent);

    return {
      hasNewsletterForm,
      socialLinks,
      hasSitemapLinks,
      hasMapEmbed,
      hasCertificationBadges,
      linkCount: hrefs.length,
    };
  }

  // ─── Hero ────────────────────────────────────────────────────────────────────

  private analyzeHero(html: string): HeroAnalysis {
    const heroCandidate = this.extractFirstHeroBlock(html);

    const hasVideoBackground = /<video[^>]*>/i.test(heroCandidate);
    const hasSlider = /swiper|slick|carousel|slider/i.test(heroCandidate);
    const isFullscreen = /height\s*:\s*100vh/i.test(heroCandidate);
    const hasProductShowcase = /class=["'][^"']*(?:product|showcase|featured|main-product)[^"']*["']/i.test(heroCandidate);

    // Determine hero template type for PatternConsensusEngine
    let type: HeroAnalysis['type'] = 'standard';
    if (hasVideoBackground) type = 'video';
    else if (hasSlider) type = 'slider';
    else if (isFullscreen) type = 'fullscreen';
    else if (hasProductShowcase) type = 'product';

    return {
      type,
      hasVideoBackground,
      hasSlider,
      isFullscreen,
      hasProductShowcase,
    };
  }

  private extractFirstHeroBlock(html: string): string {
    const sectionMatch = html.match(/<section[^>]*>([\s\S]*?)<\/section>/i);
    if (sectionMatch) return sectionMatch[0].slice(0, 5000);

    const divMatch = html.match(/<div[^>]+class=["'][^"']*["'][^>]*>([\s\S]{0,3000})/i);
    if (divMatch) return divMatch[0];

    return html.slice(0, 5000);
  }
}
