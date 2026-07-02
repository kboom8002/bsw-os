/**
 * lib/golden/image-reference-cataloger.ts
 *
 * Catalogs image references from crawled pages:
 *  - Identifies hero/OG image
 *  - Classifies images by type (product, team, space, before-after, etc.)
 *  - Computes aspect ratios
 *  - Extracts dominant container background colors from CSS
 *  - Detects image anti-patterns (no-alt, broken-src, too-small)
 */

import { CrawledPage } from '../surface/website-crawler';
import {
  ImageReferenceSnapshot,
  CatalogedImage,
  ImageAntiPattern,
  ImageType,
} from './types';

// ─── Classification rules ────────────────────────────────────────────────────

interface ImageTypeRule {
  type: ImageType;
  keywords: string[];
}

const IMAGE_TYPE_RULES: ImageTypeRule[] = [
  {
    type: 'before_after',
    keywords: ['before', 'after', 'result', 'transformation', 'compare', 'ba-', '-ba', 'before-after'],
  },
  {
    type: 'team',
    keywords: ['team', 'doctor', 'staff', 'expert', 'therapist', 'specialist', 'member', 'people', 'person', 'portrait', 'trainer', 'physician'],
  },
  {
    type: 'space_interior',
    keywords: ['interior', 'space', 'clinic', 'room', 'facility', 'office', 'studio', 'building', 'store', 'showroom'],
  },
  {
    type: 'product',
    keywords: ['product', 'item', 'goods', 'sku', 'pack', 'bottle', 'tube', 'cream', 'serum', 'ampoule', 'kit'],
  },
  {
    type: 'hero',
    keywords: ['hero', 'banner', 'main', 'visual', 'kv', 'key-visual', 'mainvisual', 'top', 'cover', 'bg'],
  },
  {
    type: 'logo',
    keywords: ['logo', 'brand-mark', 'logotype', 'wordmark'],
  },
  {
    type: 'icon',
    keywords: ['icon', 'ico-', '-ico', 'symbol', 'pictogram', 'badge', 'thumbnail'],
  },
  {
    type: 'background',
    keywords: ['background', 'bg-', '-bg', 'backdrop', 'pattern', 'texture', 'overlay'],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Classify an image by checking src and alt against keyword rules.
 * Returns the first matching type, defaulting to 'other'.
 */
function classifyImage(src: string, alt: string): ImageType {
  const combined = (src + ' ' + alt).toLowerCase();
  for (const rule of IMAGE_TYPE_RULES) {
    for (const keyword of rule.keywords) {
      if (combined.includes(keyword)) {
        return rule.type;
      }
    }
  }
  return 'other';
}

/**
 * Compute aspect ratio from optional string width/height values.
 * Returns null if either dimension is missing or zero.
 */
function computeAspectRatio(width?: string, height?: string): number | null {
  const w = parseInt(width ?? '', 10);
  const h = parseInt(height ?? '', 10);
  if (isNaN(w) || isNaN(h) || w === 0 || h === 0) return null;
  return Math.round((w / h) * 100) / 100;
}

/**
 * Check whether a src looks "broken" — relative without a domain (starts with ./ or ../
 * or no scheme and no leading /).
 * NOTE: plain /path/to/img.jpg is valid (absolute relative to domain).
 */
function isBrokenSrc(src: string): boolean {
  if (!src || src.trim() === '') return true;
  if (/^(https?:)?\/\//i.test(src)) return false; // absolute or protocol-relative
  if (src.startsWith('/')) return false; // absolute path
  if (src.startsWith('data:')) return false; // data URI
  // Relative paths like "./img.png", "../assets/img.png", "img.png"
  return true;
}

/**
 * Extract dominant background colors from CSS inside raw HTML.
 * Specifically looks for background-color or background on elements that
 * contain or wrap images (figure, .img-wrap, etc.).
 */
function extractContainerColors(rawHtml: string): string[] {
  const colors = new Set<string>();

  // Look for image-container-like rules in style tags
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let sm: RegExpExecArray | null;
  while ((sm = styleRe.exec(rawHtml)) !== null) {
    const css = sm[1];
    // Find rules that mention figure, img-wrap, image-container, gallery, etc.
    const ruleRe =
      /(?:figure|\.img|\.image|\.gallery|\.photo|\.picture|\.visual|\.media|\.thumbnail)[^{]*\{([^}]*)\}/gi;
    let rm: RegExpExecArray | null;
    while ((rm = ruleRe.exec(css)) !== null) {
      const declarations = rm[1];
      // Extract hex colors from background or background-color
      const bgColorRe =
        /(?:background(?:-color)?)\s*:\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\))/gi;
      let bgM: RegExpExecArray | null;
      while ((bgM = bgColorRe.exec(declarations)) !== null) {
        colors.add(bgM[1].trim().toLowerCase());
      }
    }
  }

  return Array.from(colors).slice(0, 10);
}

// ─── Cataloger ───────────────────────────────────────────────────────────────

export class ImageReferenceCataloger {
  /**
   * Catalog image references across all crawled pages.
   *
   * @param pages      All crawled pages from the site
   * @param brandName  Brand name for labeling the snapshot
   */
  catalog(pages: CrawledPage[], brandName: string): ImageReferenceSnapshot {
    if (!pages || pages.length === 0) {
      return {
        brandName,
        heroImage: null,
        images: [],
        typeCounts: {},
        dominantContainerColors: [],
        antiPatterns: [],
        totalImages: 0,
      };
    }

    const allCataloged: CatalogedImage[] = [];
    const allAntiPatterns: ImageAntiPattern[] = [];

    // ── Step 1: Collect all images ────────────────────────────────────
    for (const page of pages) {
      const images = page.images ?? [];
      const pageUrl = page.url;

      for (const img of images) {
        const src = img.src ?? '';
        const alt = img.alt ?? '';
        const type = classifyImage(src, alt);
        const aspectRatio = computeAspectRatio(img.width, img.height);
        const widthNum = parseInt(img.width ?? '', 10);
        const heightNum = parseInt(img.height ?? '', 10);

        const cataloged: CatalogedImage = {
          src,
          alt,
          type,
          width: isNaN(widthNum) ? undefined : widthNum,
          height: isNaN(heightNum) ? undefined : heightNum,
          aspectRatio,
          pageUrl,
        };

        allCataloged.push(cataloged);

        // ── Anti-patterns ──────────────────────────────────────────
        // 1. No alt text
        if (!alt || alt.trim() === '') {
          allAntiPatterns.push({ src, pageUrl, issue: 'no-alt' });
        }

        // 2. Broken src
        if (isBrokenSrc(src)) {
          allAntiPatterns.push({ src, pageUrl, issue: 'broken-src' });
        }

        // 3. Very small images (<200px in either dimension)
        if (
          (!isNaN(widthNum) && widthNum < 200) ||
          (!isNaN(heightNum) && heightNum < 200)
        ) {
          allAntiPatterns.push({ src, pageUrl, issue: 'too-small' });
        }
      }

      // ── Also scan rawHtml for inline image contexts we may have missed ──
      // Extract background-image: url(...) from inline styles as 'background' images
      const bgImageRe = /background-image\s*:\s*url\(["']?([^"')]+)["']?\)/gi;
      let bgM: RegExpExecArray | null;
      while ((bgM = bgImageRe.exec(page.rawHtml ?? '')) !== null) {
        const src = bgM[1].trim();
        if (src.startsWith('data:')) continue;
        allCataloged.push({
          src,
          alt: '',
          type: 'background',
          aspectRatio: null,
          pageUrl,
        });
      }
    }

    // ── Step 2: Identify hero image ───────────────────────────────────
    const heroImage = this.findHeroImage(pages, allCataloged);

    // ── Step 3: Type counts ───────────────────────────────────────────
    const typeCounts: Partial<Record<ImageType, number>> = {};
    for (const img of allCataloged) {
      typeCounts[img.type] = (typeCounts[img.type] ?? 0) + 1;
    }

    // ── Step 4: Dominant container colors ────────────────────────────
    const dominantContainerColors: string[] = [];
    const colorSet = new Set<string>();
    for (const page of pages) {
      for (const c of extractContainerColors(page.rawHtml ?? '')) {
        if (!colorSet.has(c)) {
          colorSet.add(c);
          dominantContainerColors.push(c);
        }
      }
    }

    // ── Step 5: Deduplicate anti-patterns ─────────────────────────────
    const antiPatternSet = new Map<string, ImageAntiPattern>();
    for (const ap of allAntiPatterns) {
      const key = `${ap.issue}::${ap.src}`;
      if (!antiPatternSet.has(key)) {
        antiPatternSet.set(key, ap);
      }
    }

    return {
      brandName,
      heroImage,
      images: allCataloged,
      typeCounts,
      dominantContainerColors: dominantContainerColors.slice(0, 10),
      antiPatterns: Array.from(antiPatternSet.values()),
      totalImages: allCataloged.length,
    };
  }

  // ─── Private ─────────────────────────────────────────────────────────

  private findHeroImage(
    pages: CrawledPage[],
    allCataloged: CatalogedImage[]
  ): CatalogedImage | null {
    // Priority 1: og:image from the first page's ogMetadata
    const firstPage = pages[0];
    if (firstPage?.ogMetadata?.['og:image']) {
      const ogSrc = firstPage.ogMetadata['og:image'];
      // Find matching cataloged image or create a synthetic one
      const existing = allCataloged.find((img) => img.src === ogSrc);
      if (existing) return { ...existing, type: 'hero' };

      return {
        src: ogSrc,
        alt: firstPage.ogMetadata['og:image:alt'] ?? '',
        type: 'hero',
        aspectRatio: null,
        pageUrl: firstPage.url,
      };
    }

    // Priority 2: first image with 'hero'/'main'/'visual' in src/alt
    const heroByName = allCataloged.find((img) =>
      /hero|main|visual|banner|kv|key-visual/i.test(img.src + ' ' + img.alt)
    );
    if (heroByName) return { ...heroByName, type: 'hero' };

    // Priority 3: first large image (width > 800)
    const largeImage = allCataloged.find(
      (img) => img.width !== undefined && img.width > 800
    );
    if (largeImage) return { ...largeImage, type: 'hero' };

    // Priority 4: first image overall
    if (allCataloged.length > 0) {
      const first = allCataloged[0];
      // Skip data URIs, icons, and tiny images
      if (
        !first.src.startsWith('data:') &&
        first.src.length > 0 &&
        (first.width === undefined || first.width > 100)
      ) {
        return { ...first, type: 'hero' };
      }
    }

    return null;
  }
}
