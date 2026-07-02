/**
 * lib/golden/content-template-harvester.ts
 *
 * Harvests content templates (hero copy, FAQ items, trust elements, tone)
 * from crawled page HTML without AI calls — pure regex/heuristic analysis.
 */

import { CrawledPage } from '../surface/website-crawler';
import {
  ContentTemplateSnapshot,
  HeroCopy,
  FaqItem,
  TrustElement,
  ContentTone,
} from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip all HTML tags from a string and collapse whitespace */
function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract text of the first matching tag in HTML */
function extractFirstTagText(html: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = html.match(re);
  return m ? stripTags(m[1]).substring(0, 300) : null;
}

/** Extract all tag contents */
function extractAllTagContents(html: string, tag: string): string[] {
  const results: string[] = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = stripTags(m[1]).trim();
    if (text.length > 0) results.push(text);
  }
  return results;
}

/** Check if string contains Korean characters */
function containsKorean(text: string): boolean {
  return /[\uAC00-\uD7A3]/.test(text);
}

// ─── Hero copy extraction ────────────────────────────────────────────────────

function extractHeroCopy(pages: CrawledPage[]): HeroCopy {
  // Use first page (homepage) for hero copy
  const page = pages[0];
  if (!page) return { heading: null, subheading: null, ctaText: null };

  const html = page.rawHtml ?? '';

  // H1: first H1 tag text
  const heading = extractFirstTagText(html, 'h1');

  // Subheading: look near the hero section for a significant paragraph
  // Strategy: find first <p> that is non-trivial (>20 chars) after a hero-like block
  let subheading: string | null = null;

  // First try: look in hero-candidate area (first 20% of HTML)
  const heroChunk = html.slice(0, Math.floor(html.length * 0.25));
  const paras = extractAllTagContents(heroChunk, 'p');
  for (const p of paras) {
    if (p.length >= 20 && p.length <= 400) {
      subheading = p;
      break;
    }
  }

  // Second try: h2 near hero area
  if (!subheading) {
    const h2 = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (h2) subheading = stripTags(h2[1]).substring(0, 200);
  }

  // CTA text: first button or <a class="btn/button"> text in early HTML
  let ctaText: string | null = null;
  const ctaRe = /<(?:button|a)[^>]+class=["'][^"']*\b(btn|button|cta|cta-btn)\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:button|a)>/i;
  const ctaM = heroChunk.match(ctaRe);
  if (ctaM) {
    ctaText = stripTags(ctaM[2]).substring(0, 80);
  }

  // Fallback: first <button> text anywhere in hero chunk
  if (!ctaText) {
    const btnM = heroChunk.match(/<button[^>]*>([\s\S]*?)<\/button>/i);
    if (btnM) ctaText = stripTags(btnM[1]).substring(0, 80);
  }

  return { heading, subheading, ctaText };
}

// ─── FAQ extraction ──────────────────────────────────────────────────────────

function extractFaqs(pages: CrawledPage[]): FaqItem[] {
  const faqs: FaqItem[] = [];

  for (const page of pages) {
    const html = page.rawHtml ?? '';

    // Source 1: JSON-LD FAQPage schemas
    if (page.schemas && Array.isArray(page.schemas)) {
      for (const schema of page.schemas) {
        if (schema?.['@type'] === 'FAQPage' && Array.isArray(schema?.mainEntity)) {
          for (const entity of schema.mainEntity) {
            const q = entity?.name ?? entity?.question ?? '';
            const a =
              typeof entity?.acceptedAnswer === 'string'
                ? entity.acceptedAnswer
                : entity?.acceptedAnswer?.text ?? '';
            if (q && a) {
              faqs.push({
                question: stripTags(String(q)).substring(0, 300),
                answer: stripTags(String(a)).substring(0, 500),
                source: 'json-ld',
              });
            }
          }
        }
      }
    }

    // Source 2: <dl>/<dt>/<dd> patterns
    const dlRe = /<dl[^>]*>([\s\S]*?)<\/dl>/gi;
    let dlM: RegExpExecArray | null;
    while ((dlM = dlRe.exec(html)) !== null) {
      const dlContent = dlM[1];
      const dts = extractAllTagContents(dlContent, 'dt');
      const dds = extractAllTagContents(dlContent, 'dd');
      const count = Math.min(dts.length, dds.length);
      for (let i = 0; i < count; i++) {
        if (dts[i].length > 5 && dds[i].length > 5) {
          faqs.push({
            question: dts[i].substring(0, 300),
            answer: dds[i].substring(0, 500),
            source: 'dl-dt-dd',
          });
        }
      }
    }

    // Source 3: Heading + paragraph pattern (h3/h4 followed by p in FAQ-like sections)
    const faqSectionRe =
      /<(?:section|div)[^>]+(?:class|id)=["'][^"']*(?:faq|accordion|question|qa)[^"']*["'][^>]*>([\s\S]*?)<\/(?:section|div)>/gi;
    let faqM: RegExpExecArray | null;
    while ((faqM = faqSectionRe.exec(html)) !== null) {
      const block = faqM[1];
      // Find heading+paragraph pairs
      const pairRe = /<h[34][^>]*>([\s\S]*?)<\/h[34]>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi;
      let pairM: RegExpExecArray | null;
      while ((pairM = pairRe.exec(block)) !== null) {
        const q = stripTags(pairM[1]).trim();
        const a = stripTags(pairM[2]).trim();
        if (q.length > 5 && a.length > 10) {
          faqs.push({
            question: q.substring(0, 300),
            answer: a.substring(0, 500),
            source: 'heading-paragraph',
          });
        }
      }
    }
  }

  // Deduplicate by question text
  const seen = new Set<string>();
  return faqs.filter((f) => {
    const key = f.question.toLowerCase().slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Trust element extraction ────────────────────────────────────────────────

/**
 * Extract numeric trust statistics, certifications, disclaimers, awards.
 * Looks for:
 *   - Korean number patterns: 숫자 + 년/개/명/건/회/가지/종
 *   - "N+ years" / "N,000+" English patterns
 *   - Keywords: ISO, 인증, certified, 특허, 수상, award, ©, disclaimer
 */
function extractTrustElements(pages: CrawledPage[]): TrustElement[] {
  const elements: TrustElement[] = [];
  const seen = new Set<string>();

  const addElement = (text: string, type: TrustElement['type']) => {
    const key = text.slice(0, 40).toLowerCase();
    if (!seen.has(key) && text.length > 3) {
      seen.add(key);
      elements.push({ text, type });
    }
  };

  for (const page of pages) {
    const bodyText = page.bodyText ?? '';
    const html = page.rawHtml ?? '';

    // ── Statistics: Korean numeric patterns ──────────────────────────
    // e.g. "10,000건", "20년 이상", "5,000명"
    const korStatRe =
      /(\d[\d,]*(?:\.\d+)?\s*(?:년|개|명|건|회|가지|종|배|호)[\s\S]{0,30})/g;
    let m: RegExpExecArray | null;
    while ((m = korStatRe.exec(bodyText)) !== null) {
      addElement(m[1].trim().substring(0, 100), 'statistic');
    }

    // English numeric patterns: "10,000+", "20+ years", "1M+", "Over 5,000"
    const engStatRe =
      /(?:over\s+|more\s+than\s+|[\d,]+\+)[\d,]+(?:\+)?\s+(?:years?|clients?|customers?|cases?|reviews?)/gi;
    while ((m = engStatRe.exec(bodyText)) !== null) {
      addElement(m[0].trim().substring(0, 100), 'statistic');
    }

    // ── Certifications ────────────────────────────────────────────────
    const certRe =
      /(?:ISO\s*\d+|KS\s*\w+|CE\s*인증|FDA|[가-힣]+\s*인증|[가-힣]+\s*등록|certified|accredited|licensed)/gi;
    while ((m = certRe.exec(bodyText)) !== null) {
      addElement(m[0].trim().substring(0, 100), 'certification');
    }

    // ── Awards ────────────────────────────────────────────────────────
    const awardRe = /(?:수상|award|prize|winner|gold|silver|대상|최우수|우수상)/gi;
    const footerChunk = html.slice(html.lastIndexOf('</main>') || 0);
    while ((m = awardRe.exec(bodyText)) !== null) {
      // Get context around the match
      const start = Math.max(0, m.index - 20);
      const end = Math.min(bodyText.length, m.index + 60);
      addElement(bodyText.slice(start, end).trim().substring(0, 100), 'award');
    }

    // ── Disclaimers ───────────────────────────────────────────────────
    // Typically near footer: copyright, legal, medical disclaimers
    const disclaimerRe =
      /(?:©|\(c\)|copyright|\*\s*개인차|※|본\s*시술|의료법인|의료광고|주의사항|면책|본 결과는|results\s+may\s+vary)/gi;
    while ((m = disclaimerRe.exec(bodyText)) !== null) {
      const start = Math.max(0, m.index - 10);
      const end = Math.min(bodyText.length, m.index + 80);
      addElement(bodyText.slice(start, end).trim().substring(0, 120), 'disclaimer');
    }
  }

  return elements;
}

// ─── Tone classification ─────────────────────────────────────────────────────

function classifyTone(pages: CrawledPage[]): ContentTone {
  const allText = pages
    .map((p) => (p.bodyText ?? '') + (p.title ?? ''))
    .join(' ')
    .substring(0, 20000);

  const clinicalKeywords =
    /clinical|과학|성분|임상|efficacy|dermatologist|dermatology|clinical\s*trial|연구결과|논문|특허|성분표/i;
  const warmKeywords =
    /따뜻|자연|pure|organic|natural|gentle|soft|nurture|holistic|식물성|천연|무해/i;
  const sciKeywords =
    /scientific|technology|innovation|mechanism|formula|clinical\s*proof|bio|nano|peptide/i;

  const clinicalScore = (allText.match(clinicalKeywords) ?? []).length;
  const warmScore = (allText.match(warmKeywords) ?? []).length;
  const sciScore = (allText.match(sciKeywords) ?? []).length;

  // Count total matches for each category
  let clinicalCount = 0;
  let warmCount = 0;
  let sciCount = 0;

  const clinicalGlobal = new RegExp(clinicalKeywords.source, 'gi');
  const warmGlobal = new RegExp(warmKeywords.source, 'gi');
  const sciGlobal = new RegExp(sciKeywords.source, 'gi');

  let m: RegExpExecArray | null;
  while ((m = clinicalGlobal.exec(allText)) !== null) clinicalCount++;
  while ((m = warmGlobal.exec(allText)) !== null) warmCount++;
  while ((m = sciGlobal.exec(allText)) !== null) sciCount++;

  const max = Math.max(clinicalCount, warmCount, sciCount);
  if (max === 0) return 'scientific_authoritative';
  if (warmCount === max) return 'warm_professional';
  if (clinicalCount >= sciCount) return 'clinical_confident';
  return 'scientific_authoritative';
}

// ─── Harvester ───────────────────────────────────────────────────────────────

export class ContentTemplateHarvester {
  /**
   * Harvest content templates from crawled pages.
   *
   * @param pages      All crawled pages from the site
   * @param brandName  Brand name for labeling the snapshot
   */
  harvest(pages: CrawledPage[], brandName: string): ContentTemplateSnapshot {
    if (!pages || pages.length === 0) {
      return {
        brandName,
        heroCopy: { heading: null, subheading: null, ctaText: null },
        faqItems: [],
        trustElements: [],
        contentTone: 'scientific_authoritative',
        pagesAnalyzed: 0,
      };
    }

    const heroCopy = extractHeroCopy(pages);
    const faqItems = extractFaqs(pages);
    const trustElements = extractTrustElements(pages);
    const contentTone = classifyTone(pages);

    return {
      brandName,
      heroCopy,
      faqItems,
      trustElements,
      contentTone,
      pagesAnalyzed: pages.length,
    };
  }
}
