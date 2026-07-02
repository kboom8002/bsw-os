/**
 * lib/golden/design-token-extractor.ts
 *
 * Extracts CSS design tokens (colors, fonts, spacing, animations, CSS variables)
 * from crawled HTML pages. Works fully offline using regex-based CSS parsing;
 * will attempt to fetch external stylesheets but degrades gracefully on failure.
 */

import { CrawledPage } from '../surface/website-crawler';
import {
  DesignTokenSnapshot,
  ColorTokens,
  RawColorToken,
  ComputedColorPalette,
  Typography,
  FontFamily,
  FontWeight,
  FontSize,
  LineHeight,
  ShapeTokens,
  BorderRadius,
  BoxShadow,
  MotionTokens,
  AnimationEntry,
  TransitionEntry,
  CSSCustomProperty,
} from './types';

// ─── Color helpers ────────────────────────────────────────────────────────────

function normalizeHex(raw: string): string {
  const cleaned = raw.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(cleaned)) return cleaned;
  if (/^#[0-9a-f]{3}$/.test(cleaned)) {
    const [, r, g, b] = cleaned.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/)!;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return cleaned;
}

function rgbToHex(raw: string): string | null {
  const m = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return null;
  const r = parseInt(m[1], 10);
  const g = parseInt(m[2], 10);
  const b = parseInt(m[3], 10);
  if (r > 255 || g > 255 || b > 255) return null;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hslToHex(raw: string): string | null {
  const m = raw.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i);
  if (!m) return null;
  const h = parseFloat(m[1]) / 360;
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    const hex = val.toString(16).padStart(2, '0');
    return `#${hex}${hex}${hex}`;
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const r = Math.round(hue2rgb(h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(h) * 255);
  const b = Math.round(hue2rgb(h - 1 / 3) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function toHex(raw: string): string | null {
  const t = raw.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return normalizeHex(t);
  if (/^rgba?\(/i.test(t)) return rgbToHex(t);
  if (/^hsla?\(/i.test(t)) return hslToHex(t);
  return null;
}

function isNeutralColor(hex: string): boolean {
  if (!/^#[0-9a-f]{6}$/.test(hex)) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const isWhite = r >= 0xee && g >= 0xee && b >= 0xee;
  const isBlack = r <= 0x11 && g <= 0x11 && b <= 0x11;
  const isGray = Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(r - b) < 15;
  return isWhite || isBlack || (isGray && r > 0x33 && r < 0xcc);
}

function isLikelyBackground(hex: string): boolean {
  if (!/^#[0-9a-f]{6}$/.test(hex)) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r >= 0xcc && g >= 0xcc && b >= 0xcc;
}

function isLikelyText(hex: string): boolean {
  if (!/^#[0-9a-f]{6}$/.test(hex)) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r <= 0x55 && g <= 0x55 && b <= 0x55;
}

/** Fetch a single external CSS URL with a 5s timeout and 100KB limit */
async function fetchCss(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const text = await resp.text();
    return text.slice(0, 102_400); // 100 KB cap
  } catch {
    return null;
  }
}

// ─── Extractor ────────────────────────────────────────────────────────────────

export class DesignTokenExtractor {
  async extract(page: CrawledPage, brandName: string): Promise<DesignTokenSnapshot> {
    const rawHtml = page.rawHtml ?? '';

    // Step 1: Inline <style> contents
    const inlineStyles: string[] = [];
    const styleTagRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let sm: RegExpExecArray | null;
    while ((sm = styleTagRe.exec(rawHtml)) !== null) {
      inlineStyles.push(sm[1]);
    }

    // Step 2: External <link rel="stylesheet"> hrefs (max 3)
    const externalHrefs: string[] = [];
    for (const re of [
      /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']stylesheet["'][^>]*>/gi,
    ]) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(rawHtml)) !== null) externalHrefs.push(m[1]);
    }

    const base = this.getBaseUrl(page.url);
    const resolvedHrefs = [
      ...new Set(
        externalHrefs.map((href) => {
          if (/^https?:\/\//i.test(href)) return href;
          if (href.startsWith('//')) return `https:${href}`;
          if (href.startsWith('/')) return `${base}${href}`;
          return `${base}/${href}`;
        })
      ),
    ].slice(0, 3);

    // Step 3: Fetch external CSS
    const fetchedCss: string[] = [];
    for (const href of resolvedHrefs) {
      const css = await fetchCss(href);
      if (css) fetchedCss.push(css);
    }

    // Step 4: Combine all CSS
    const allCss = [...inlineStyles, ...fetchedCss].join('\n');

    return {
      brandName,
      cssVariables: this.extractCssVariables(allCss),
      colors: this.extractColors(allCss),
      typography: this.extractTypography(allCss, rawHtml),
      shape: this.extractShape(allCss),
      motion: this.extractMotion(allCss),
      totalCssLength: allCss.length,
      externalCssFilesFetched: fetchedCss.length,
    };
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private getBaseUrl(url: string): string {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.host}`;
    } catch {
      return '';
    }
  }

  private extractCssVariables(css: string): CSSCustomProperty[] {
    const map = new Map<string, string>();
    const re = /--([\w-]+)\s*:\s*([^;]+);/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(css)) !== null) {
      const name = m[1].trim();
      if (!map.has(name)) map.set(name, m[2].trim());
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }

  private extractColors(css: string): ColorTokens {
    // Map: hex → { raw, frequency, context }
    const colorMap = new Map<string, { raw: string; frequency: number; context: string }>();

    const colorPropRe = /(color|background-color|background|border-color|fill|stroke)\s*:\s*([^;}{]+);/gi;
    let m: RegExpExecArray | null;
    while ((m = colorPropRe.exec(css)) !== null) {
      const prop = m[1].toLowerCase();
      const rawValue = m[2];
      const colorTokenRe = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g;
      let cm: RegExpExecArray | null;
      while ((cm = colorTokenRe.exec(rawValue)) !== null) {
        const hex = toHex(cm[1]);
        if (!hex || !/^#[0-9a-f]{6}$/.test(hex)) continue;
        const context =
          prop === 'color' ? 'color'
          : prop === 'background-color' ? 'background-color'
          : prop === 'background' ? 'background'
          : prop === 'border-color' ? 'border-color'
          : 'other';
        const existing = colorMap.get(hex);
        if (existing) {
          existing.frequency++;
        } else {
          colorMap.set(hex, { raw: cm[1], frequency: 1, context });
        }
      }
    }

    const rawColors: RawColorToken[] = Array.from(colorMap.entries())
      .map(([hex, d]) => ({ hex, raw: d.raw, frequency: d.frequency, context: d.context }))
      .sort((a, b) => b.frequency - a.frequency);

    // Find primary (most frequent non-neutral)
    const primaryColor = rawColors.find((c) => !isNeutralColor(c.hex))?.hex ?? null;

    // Build computed palette
    const bgColors = rawColors
      .filter((c) => c.context === 'background' || c.context === 'background-color')
      .filter((c) => isLikelyBackground(c.hex))
      .map((c) => c.hex);
    const textColors = rawColors
      .filter((c) => c.context === 'color')
      .filter((c) => isLikelyText(c.hex))
      .map((c) => c.hex);
    const primaryColors = rawColors.filter((c) => !isNeutralColor(c.hex)).map((c) => c.hex);
    const accentColors = primaryColors.filter((h) => !bgColors.includes(h) && !textColors.includes(h));
    // Secondary: 2nd–4th most frequent non-neutral colors (different from primary)
    const secondaryColors = accentColors.slice(1, 4);
    // Border: colors found in border-color context
    const borderColors = rawColors
      .filter((c) => c.context === 'border-color')
      .map((c) => c.hex);

    const computedPalette: ComputedColorPalette = {
      primary: primaryColors.slice(0, 5),
      secondary: secondaryColors,
      background: bgColors.slice(0, 5),
      text: textColors.slice(0, 5),
      accent: accentColors.slice(0, 5),
      border: borderColors.slice(0, 5),
    };

    return { rawColors, computedPalette, primaryColor };
  }

  private extractTypography(css: string, rawHtml: string): Typography {
    const fontFamilies: FontFamily[] = [];
    const fontWeights: FontWeight[] = [];
    const fontSizes: FontSize[] = [];
    const lineHeights: LineHeight[] = [];

    // Font families from CSS rules
    const familyFreq = new Map<string, { usage: 'heading' | 'body' | 'other'; frequency: number }>();
    const ruleSplitter = /([^{}]+)\{([^{}]*)\}/g;
    let rm: RegExpExecArray | null;
    while ((rm = ruleSplitter.exec(css)) !== null) {
      const selector = rm[1].trim().toLowerCase();
      const decls = rm[2];

      const fontRe = /font-family\s*:\s*([^;]+);/gi;
      let fm: RegExpExecArray | null;
      while ((fm = fontRe.exec(decls)) !== null) {
        const families = fm[1]
          .split(',')
          .map((f) => f.trim().replace(/^['"]|['"]$/g, '').trim())
          .filter((f) => f.length > 0 && !['inherit', 'sans-serif', 'serif', 'monospace', 'initial'].includes(f.toLowerCase()));

        const isHeading = /\bh[1-6]\b/.test(selector);
        const isBody = /\b(body|p|\.body|\.text|\.content)\b/.test(selector);
        const usage: 'heading' | 'body' | 'other' = isHeading ? 'heading' : isBody ? 'body' : 'other';

        for (const family of families) {
          const key = family.toLowerCase();
          const existing = familyFreq.get(key);
          if (existing) {
            existing.frequency++;
            // Promote usage if more specific
            if (usage !== 'other') existing.usage = usage;
          } else {
            familyFreq.set(key, { usage, frequency: 1 });
          }
        }
      }

      // Font weights
      const wRe = /font-weight\s*:\s*([^;]+);/gi;
      let wm: RegExpExecArray | null;
      while ((wm = wRe.exec(decls)) !== null) {
        const weight = wm[1].trim();
        const ctx: 'heading' | 'body' | 'other' = /\bh[1-6]\b/.test(selector) ? 'heading'
          : /\b(body|p)\b/.test(selector) ? 'body' : 'other';
        fontWeights.push({ weight, frequency: 1, context: ctx });
      }

      // Font sizes
      const sRe = /font-size\s*:\s*([^;]+);/gi;
      let szm: RegExpExecArray | null;
      while ((szm = sRe.exec(decls)) !== null) {
        const size = szm[1].trim();
        const ctx: FontSize['context'] = /\bh1\b/.test(selector) ? 'h1'
          : /\bh2\b/.test(selector) ? 'h2'
          : /\bh3\b/.test(selector) ? 'h3'
          : /\b(body|p)\b/.test(selector) ? 'body'
          : /small|\.xs|\.sm/.test(selector) ? 'small' : 'other';
        fontSizes.push({ size, frequency: 1, context: ctx });
      }

      // Line heights
      const lhRe = /line-height\s*:\s*([^;]+);/gi;
      let lhm: RegExpExecArray | null;
      while ((lhm = lhRe.exec(decls)) !== null) {
        lineHeights.push({ value: lhm[1].trim(), frequency: 1 });
      }
    }

    // Convert family map to array
    for (const [family, data] of familyFreq.entries()) {
      fontFamilies.push({ family, usage: data.usage, frequency: data.frequency });
    }
    fontFamilies.sort((a, b) => b.frequency - a.frequency);

    // Aggregate fontWeights by (weight + context)
    const weightMap = new Map<string, FontWeight>();
    for (const fw of fontWeights) {
      const key = `${fw.weight}::${fw.context}`;
      const ex = weightMap.get(key);
      if (ex) ex.frequency++;
      else weightMap.set(key, { ...fw });
    }

    // Aggregate fontSizes
    const sizeMap = new Map<string, FontSize>();
    for (const fs of fontSizes) {
      const key = `${fs.size}::${fs.context}`;
      const ex = sizeMap.get(key);
      if (ex) ex.frequency++;
      else sizeMap.set(key, { ...fs });
    }

    // Aggregate lineHeights
    const lhMap = new Map<string, LineHeight>();
    for (const lh of lineHeights) {
      const ex = lhMap.get(lh.value);
      if (ex) ex.frequency++;
      else lhMap.set(lh.value, { ...lh });
    }

    // Google Fonts
    const combined = css + rawHtml;
    const usesGoogleFonts = combined.includes('fonts.googleapis.com');
    const googleFontFamilies: string[] = [];
    if (usesGoogleFonts) {
      const gfRe = /fonts\.googleapis\.com\/css[^"'\s]*[?&]family=([^"'\s&]+)/gi;
      let gm: RegExpExecArray | null;
      while ((gm = gfRe.exec(combined)) !== null) {
        for (const fam of decodeURIComponent(gm[1]).split('|')) {
          const name = fam.split(':')[0].replace(/\+/g, ' ').trim();
          if (name && !googleFontFamilies.includes(name)) googleFontFamilies.push(name);
        }
      }
    }

    return {
      fontFamilies,
      fontWeights: Array.from(weightMap.values()).sort((a, b) => b.frequency - a.frequency),
      fontSizes: Array.from(sizeMap.values()).sort((a, b) => b.frequency - a.frequency),
      lineHeights: Array.from(lhMap.values()).sort((a, b) => b.frequency - a.frequency),
      usesGoogleFonts,
      googleFontFamilies,
    };
  }

  private extractShape(css: string): ShapeTokens {
    const radiusMap = new Map<string, number>();
    const shadowMap = new Map<string, number>();

    const brRe = /border-radius\s*:\s*([^;}{]+);/gi;
    let m: RegExpExecArray | null;
    while ((m = brRe.exec(css)) !== null) {
      const v = m[1].trim();
      radiusMap.set(v, (radiusMap.get(v) ?? 0) + 1);
    }

    const bsRe = /box-shadow\s*:\s*([^;}{]+);/gi;
    while ((m = bsRe.exec(css)) !== null) {
      const v = m[1].trim();
      if (v === 'none' || v === 'inherit') continue;
      shadowMap.set(v, (shadowMap.get(v) ?? 0) + 1);
    }

    const borderRadius: BorderRadius[] = Array.from(radiusMap.entries())
      .map(([value, frequency]) => ({ value, frequency }))
      .sort((a, b) => b.frequency - a.frequency);

    const boxShadow: BoxShadow[] = Array.from(shadowMap.entries())
      .map(([value, frequency]) => ({ value, frequency }))
      .sort((a, b) => b.frequency - a.frequency);

    return { borderRadius, boxShadow };
  }

  private extractMotion(css: string): MotionTokens {
    const animMap = new Map<string, { type: string; value: string; frequency: number }>();
    const transMap = new Map<string, { duration: string; easing: string; frequency: number }>();

    // Transitions
    const trRe = /transition\s*:\s*([^;}{]+);/gi;
    let m: RegExpExecArray | null;
    while ((m = trRe.exec(css)) !== null) {
      const value = m[1].trim();
      if (value === 'none') continue;
      // Parse duration and easing
      const durationM = value.match(/(\d+(?:\.\d+)?(?:ms|s))/);
      const duration = durationM ? durationM[1] : '0.3s';
      const easingM = value.match(/(ease|ease-in|ease-out|ease-in-out|linear|cubic-bezier\([^)]+\))/i);
      const easing = easingM ? easingM[1] : 'ease';
      const key = `${duration}::${easing}`;
      const ex = transMap.get(key);
      if (ex) ex.frequency++;
      else transMap.set(key, { duration, easing, frequency: 1 });
    }

    // Animations
    const animRe = /animation\s*(?:-name)?\s*:\s*([^;}{]+);/gi;
    while ((m = animRe.exec(css)) !== null) {
      const value = m[1].trim();
      if (value === 'none') continue;
      // Infer type from animation name
      const type = /fade/i.test(value) ? 'fadeUp'
        : /slide/i.test(value) ? 'slide'
        : /scale|zoom/i.test(value) ? 'scale'
        : /spin|rotate/i.test(value) ? 'rotate'
        : 'custom';
      const ex = animMap.get(value);
      if (ex) ex.frequency++;
      else animMap.set(value, { type, value, frequency: 1 });
    }

    const hasParallax = /parallax|data-parallax|parallax-speed/i.test(css);
    const hasStagger = /stagger|delay.*calc|animation-delay/i.test(css);

    const animations: AnimationEntry[] = Array.from(animMap.values())
      .sort((a, b) => b.frequency - a.frequency);

    const transitions: TransitionEntry[] = Array.from(transMap.values())
      .sort((a, b) => b.frequency - a.frequency);

    return { animations, transitions, hasParallax, hasStagger };
  }
}
