/**
 * lib/golden/section-sequence-detector.ts
 *
 * Detects section types and their sequence from crawled HTML pages.
 * Uses keyword-matching against class, id, and aria-label attributes
 * to classify blocks and maps them to psychology layers.
 */

import { CrawledPage } from '../surface/website-crawler';
import {
  SectionSequenceSnapshot,
  PageSectionAnalysis,
  DetectedSection,
  SectionType,
  PsychologyLayer,
  HomepageSectionData,
} from './types';

// ─── Classification Rules ─────────────────────────────────────────────────────

interface SectionRule {
  type: SectionType;
  keywords: string[];
}

const SECTION_RULES: SectionRule[] = [
  {
    type: 'hero',
    keywords: ['hero', 'banner', 'visual', 'main-visual', 'mainvisual', 'kv', 'key-visual', 'intro-visual', 'top-visual'],
  },
  {
    type: 'trust_strip',
    keywords: ['trust', 'partner', 'logo-strip', 'logostrip', 'logo-wall', 'badge', 'partner-logo', 'media'],
  },
  {
    type: 'partner_logos',
    keywords: ['partner-logos', 'partners', 'partner_logo', 'brand-logo', 'media-logo'],
  },
  {
    type: 'service_grid',
    keywords: ['service', 'treatment', 'menu', 'program', 'lineup', 'procedure'],
  },
  {
    type: 'product_grid',
    keywords: ['product', 'item', 'goods', 'shop', 'product-grid', 'product-list'],
  },
  {
    type: 'before_after_gallery',
    keywords: ['before', 'after', 'result', 'gallery', 'portfolio', 'case', 'transformation', 'before-after'],
  },
  {
    type: 'testimonial_carousel',
    keywords: ['review', 'testimonial', 'client', 'feedback', 'rating', 'voice', 'comment', 'opinion'],
  },
  {
    type: 'team_profiles',
    keywords: ['team', 'doctor', 'staff', 'expert', 'therapist', 'specialist', 'member', 'crew', 'people', 'trainer'],
  },
  {
    type: 'faq_grid',
    keywords: ['faq', 'question', 'answer', 'accordion', 'qa', 'qna', 'q-a', 'frequently'],
  },
  {
    type: 'cta_banner',
    keywords: ['cta', 'contact-cta', 'booking', 'reserve', 'appointment', 'call-to-action', 'book-now'],
  },
  {
    type: 'map_contact',
    keywords: ['map', 'location', 'directions', 'contact', 'access', 'way', 'address', 'direction'],
  },
  {
    type: 'stats_band',
    keywords: ['stats', 'number', 'achievement', 'count', 'counter', 'statistic', 'milestone', 'metric', 'figure'],
  },
  {
    type: 'video_showcase',
    keywords: ['video', 'youtube', 'reel', 'movie', 'film', 'clip', 'media-video', 'embed'],
  },
  {
    type: 'process_steps',
    keywords: ['process', 'step', 'how', 'flow', 'procedure', 'stage', 'journey'],
  },
  {
    type: 'timeline',
    keywords: ['timeline', 'history', 'milestones', 'roadmap', 'chronology'],
  },
  {
    type: 'brand_philosophy',
    keywords: ['story', 'philosophy', 'brand', 'about-us', 'about', 'mission', 'vision', 'value', 'concept', 'identity'],
  },
  {
    type: 'certification_badges',
    keywords: ['cert', 'award', 'license', 'accreditation', 'certified', 'recognition', 'accolade'],
  },
  {
    type: 'newsletter_signup',
    keywords: ['newsletter', 'subscribe', 'signup', 'email-signup', 'mailing', 'subscription'],
  },
  {
    type: 'pricing_table',
    keywords: ['pricing', 'price', 'cost', 'fee', 'plan', 'rate', 'package-price'],
  },
  {
    type: 'comparison_table',
    keywords: ['comparison', 'compare', 'vs', 'versus', 'diff', 'difference'],
  },
  {
    type: 'blog_feed',
    keywords: ['blog', 'post', 'article', 'news', 'journal', 'insight', 'press', 'update'],
  },
];

// ─── Psychology Layer Map ─────────────────────────────────────────────────────

const PSYCHOLOGY_MAP: Partial<Record<SectionType, PsychologyLayer>> = {
  hero: 'attention',
  trust_strip: 'proof',
  partner_logos: 'proof',
  service_grid: 'value',
  product_grid: 'value',
  before_after_gallery: 'proof',
  testimonial_carousel: 'proof',
  team_profiles: 'trust',
  faq_grid: 'value',
  cta_banner: 'action',
  map_contact: 'action',
  stats_band: 'proof',
  video_showcase: 'attention',
  process_steps: 'value',
  timeline: 'trust',
  brand_philosophy: 'trust',
  certification_badges: 'trust',
  newsletter_signup: 'action',
  pricing_table: 'value',
  comparison_table: 'value',
  blog_feed: 'value',
  unknown: 'neutral',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPageRole(url: string): PageSectionAnalysis['pageRole'] {
  const lower = url.toLowerCase();
  if (/\/(about|brand|story|us|company|philosophy)/.test(lower)) return 'about';
  if (/\/(service|treatment|program|menu|procedure|clinic)/.test(lower)) return 'services';
  if (/\/(gallery|portfolio|result|before|after|case)/.test(lower)) return 'gallery';
  if (/\/(review|testimonial|feedback|rating|voice)/.test(lower)) return 'reviews';
  try {
    const u = new URL(url);
    if (u.pathname === '/' || u.pathname === '' || u.pathname === '/index.html') return 'homepage';
  } catch {
    // ignore
  }
  return 'other';
}

function classifySection(attrText: string): { type: SectionType; matchedKeyword: string } {
  const lower = attrText.toLowerCase();
  for (const rule of SECTION_RULES) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        return { type: rule.type, matchedKeyword: keyword };
      }
    }
  }
  return { type: 'unknown', matchedKeyword: '' };
}

function getAttributeValues(attrs: string): string {
  const parts: string[] = [];
  const classM = attrs.match(/class=["']([^"']+)["']/i);
  if (classM) parts.push(classM[1]);
  const idM = attrs.match(/id=["']([^"']+)["']/i);
  if (idM) parts.push(idM[1]);
  const ariaM = attrs.match(/aria-label=["']([^"']+)["']/i);
  if (ariaM) parts.push(ariaM[1]);
  return parts.join(' ');
}

function extractTopLevelBlocks(html: string): { tagName: string; attributes: string }[] {
  const blocks: { tagName: string; attributes: string }[] = [];
  const re = /<(section|article|div)([^>]*)>/gi;
  let m: RegExpExecArray | null;
  let count = 0;
  while ((m = re.exec(html)) !== null && count < 200) {
    const tagName = m[1].toLowerCase();
    const attrs = m[2];
    const hasClass = /class=["'][^"']+["']/i.test(attrs);
    const hasId = /id=["'][^"']+["']/i.test(attrs);
    const hasAria = /aria-label=["'][^"']+["']/i.test(attrs);
    if (hasClass || hasId || hasAria) {
      blocks.push({ tagName, attributes: attrs });
      count++;
    }
  }
  return blocks;
}

// ─── Detector ────────────────────────────────────────────────────────────────

export class SectionSequenceDetector {
  detect(pages: CrawledPage[], brandName: string): SectionSequenceSnapshot {
    if (!pages || pages.length === 0) {
      return this.buildEmpty(brandName);
    }

    // Identify homepage
    const homepage =
      pages.find((p) => {
        try { return new URL(p.url).pathname === '/'; } catch { return false; }
      }) ?? pages[0];

    const pageAnalyses: PageSectionAnalysis[] = pages.map((p) => this.analyzePage(p));

    // Global aggregation
    const globalSectionCounts: Partial<Record<SectionType, number>> = {};
    const psychologyLayerDistribution: Partial<Record<PsychologyLayer, number>> = {};

    for (const pa of pageAnalyses) {
      for (const section of pa.sections) {
        globalSectionCounts[section.type] = (globalSectionCounts[section.type] ?? 0) + 1;
        const layer = section.psychologyLayer;
        psychologyLayerDistribution[layer] = (psychologyLayerDistribution[layer] ?? 0) + 1;
      }
    }

    // Build homepage data
    const homepageAnalysis = pageAnalyses.find((p) => p.pageUrl === homepage.url) ?? pageAnalyses[0];
    const homepageSections = homepageAnalysis?.sections ?? [];

    const homepageData: HomepageSectionData = {
      sections: homepageSections,
      sequence: homepageSections.map((s) => s.type),
    };

    return {
      brandName,
      homepage: homepageData,
      pages: pageAnalyses,
      globalSectionCounts,
      psychologyLayerDistribution,
      homepageSequence: homepageData.sequence,
    };
  }

  private analyzePage(page: CrawledPage): PageSectionAnalysis {
    const html = page.rawHtml ?? '';
    const pageRole = getPageRole(page.url);
    const blocks = extractTopLevelBlocks(html);

    const sections: DetectedSection[] = [];
    const seen = new Map<string, number>();

    for (let i = 0; i < blocks.length; i++) {
      const { tagName, attributes } = blocks[i];
      const attrValues = getAttributeValues(attributes);
      if (!attrValues.trim()) continue;

      const { type, matchedKeyword } = classifySection(attrValues);
      if (type === 'unknown') continue;

      // Allow same type max twice per page
      const typeCount = seen.get(type) ?? 0;
      if (typeCount >= 2) continue;
      seen.set(type, typeCount + 1);

      const psychologyLayer = PSYCHOLOGY_MAP[type] ?? 'neutral';

      sections.push({
        type,
        psychologyLayer,
        order: i,
        matchedAttribute: attrValues.slice(0, 100),
        tagName,
      });
    }

    sections.sort((a, b) => a.order - b.order);
    sections.forEach((s, idx) => { s.order = idx; });

    return {
      pageUrl: page.url,
      pageRole,
      sections,
      sectionSequence: sections.map((s) => s.type),
    };
  }

  private buildEmpty(brandName: string): SectionSequenceSnapshot {
    return {
      brandName,
      homepage: { sections: [], sequence: [] },
      pages: [],
      globalSectionCounts: {},
      psychologyLayerDistribution: {},
      homepageSequence: [],
    };
  }
}
