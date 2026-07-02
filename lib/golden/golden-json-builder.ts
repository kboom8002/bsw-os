// lib/golden/golden-json-builder.ts
// 골든 레퍼런스 6종 JSON 산출물 빌더
// GoldenJsonBuilder — builds all 6 deliverables from consensus data

import type {
  VisualAnalysisSnapshot,
  SubIndustryKey,
  SectionType,
  PsychologyLayer,
  ColorConsensusEntry,
  GoldenColorConsensus,
  GoldenTypographyConsensus,
  FontPairConsensus,
  GoldenGnbConsensus,
  GnbMenuItemFrequency,
  GoldenSectionConsensus,
  SectionFrequencyEntry,
  GoldenTokensOutput,
  GoldenLayoutsOutput,
  GoldenSectionsOutput,
  GoldenContentOutput,
  GoldenImagesOutput,
  GoldenQualityOutput,
  GoldenReferenceOutput,
  GnbStyle,
  ImageType,
  TrustElement,
  PageSectionAnalysis,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Helper utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Counts item frequencies in an array, returns a Map<value, count>.
 */
function countFrequency<T extends string | number>(items: T[]): Map<T, number> {
  const map = new Map<T, number>();
  for (const item of items) {
    map.set(item, (map.get(item) ?? 0) + 1);
  }
  return map;
}

/**
 * Returns the mode (most frequent element) from a frequency map.
 * On tie, returns the first entry inserted (Map preserves insertion order).
 */
function getMode<T extends string | number>(freq: Map<T, number>): T | undefined {
  let maxCount = 0;
  let mode: T | undefined;
  for (const [value, count] of freq) {
    if (count > maxCount) {
      maxCount = count;
      mode = value;
    }
  }
  return mode;
}

/**
 * Sorts a frequency map into an array of [value, count] pairs, descending by count.
 */
function sortedEntries<T extends string | number>(
  freq: Map<T, number>
): Array<{ value: T; frequency: number }> {
  return [...freq.entries()]
    .map(([value, frequency]) => ({ value, frequency }))
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Builds a ColorConsensusEntry for a single semantic color position
 * by scanning all snapshots' primaryColor-equivalent field.
 */
function buildColorConsensus(
  hexValues: string[],
  total: number
): ColorConsensusEntry {
  const normalized = hexValues
    .map((h) => h.trim().toLowerCase())
    .filter((h) => /^#[0-9a-f]{3,8}$/.test(h));

  const freq = countFrequency(normalized);
  const sorted = sortedEntries(freq);

  const winner = sorted[0] ?? { value: '#ffffff', frequency: 0 };
  const alternatives = sorted
    .slice(1, 4)
    .map((e) => ({ value: String(e.value), frequency: e.frequency }));

  return {
    value: String(winner.value),
    frequency: winner.frequency,
    ratio: total > 0 ? winner.frequency / total : 0,
    alternatives,
  };
}

/**
 * Average a numeric array, returns 0 for empty arrays.
 */
function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Parses a CSS transition value (e.g. "0.3s ease") and returns duration in ms.
 */
function parseTransitionMs(raw: string): number {
  const match = raw.match(/([\d.]+)(ms|s)/);
  if (!match) return 300;
  const val = parseFloat(match[1]);
  return match[2] === 's' ? val * 1000 : val;
}

/**
 * Classifies a motion level from the dominant transition duration.
 */
function classifyMotionLevel(avgMs: number): 'minimal' | 'subtle' | 'expressive' {
  if (avgMs < 200) return 'minimal';
  if (avgMs < 500) return 'subtle';
  return 'expressive';
}

/**
 * Normalizes a GNB menu label to a canonical Korean string.
 * E.g. "About Us" → "소개", "Service" → "서비스"
 */
function normalizeMenuLabel(raw: string): string {
  const normalized = raw.trim().toLowerCase();
  const mappings: Record<string, string> = {
    about: '소개',
    'about us': '소개',
    소개: '소개',
    service: '서비스',
    services: '서비스',
    서비스: '서비스',
    review: '후기',
    reviews: '후기',
    후기: '후기',
    contact: '연락처',
    '문의하기': '연락처',
    연락처: '연락처',
    blog: '블로그',
    블로그: '블로그',
    portfolio: '포트폴리오',
    포트폴리오: '포트폴리오',
    gallery: '갤러리',
    갤러리: '갤러리',
    price: '가격',
    pricing: '가격',
    가격: '가격',
    faq: 'FAQ',
    team: '팀소개',
    팀소개: '팀소개',
    'our team': '팀소개',
    home: '홈',
    홈: '홈',
    news: '뉴스',
    뉴스: '뉴스',
  };
  return mappings[normalized] ?? raw.trim();
}

/**
 * Maps a SectionType to its most common PsychologyLayer.
 * This is the canonical mapping used by BSW-OS Cold Start strategy.
 */
function sectionTypeToPsychologyLayer(type: SectionType): PsychologyLayer {
  const map: Partial<Record<SectionType, PsychologyLayer>> = {
    hero: 'attention',
    trust_strip: 'trust',
    service_grid: 'value',
    before_after_gallery: 'proof',
    testimonial_carousel: 'proof',
    team_profiles: 'trust',
    faq_grid: 'trust',
    cta_banner: 'action',
    map_contact: 'action',
    stats_band: 'value',
    video_showcase: 'proof',
    process_steps: 'value',
    brand_philosophy: 'trust',
    certification_badges: 'trust',
    product_grid: 'value',
    pricing_table: 'value',
    blog_feed: 'trust',
    newsletter_signup: 'action',
    partner_logos: 'trust',
    timeline: 'trust',
    comparison_table: 'value',
  };
  return map[type] ?? 'attention';
}

/**
 * Derives the PsychologyLayer sequence from a list of homepage section sequences.
 * Returns the most common layer ordering (consensus flow).
 */
function deriveConsensusFlow(sequences: SectionType[][]): PsychologyLayer[] {
  // Map each sequence to its psychology layer sequence
  const layerSeqs = sequences.map((seq) =>
    seq.map((t) => sectionTypeToPsychologyLayer(t))
  );

  // Serialize to string for frequency counting
  const serialized = layerSeqs.map((ls) => {
    // Deduplicate consecutive duplicate layers (keep first occurrence per layer group)
    const deduped: PsychologyLayer[] = [];
    for (const l of ls) {
      if (deduped[deduped.length - 1] !== l) deduped.push(l);
    }
    return deduped.join('→');
  });

  const freq = countFrequency(serialized);
  const winner = getMode(freq);
  return winner ? (winner.split('→') as PsychologyLayer[]) : ['attention', 'value', 'trust', 'proof', 'action'];
}

// ─────────────────────────────────────────────────────────────────────────────
// Industry-specific quality defaults
// Used when sample count is too small to derive thresholds from data
// ─────────────────────────────────────────────────────────────────────────────

interface IndustryQualityDefaults {
  minSectionCount: number;
  minFaqCount: number;
  minImageCount: number;
  minTrustElements: number;
  safetyGate: GoldenQualityOutput['safetyGate'];
  mustInclude: string[];
  mustNotDo: string[];
}

const INDUSTRY_QUALITY_DEFAULTS: Record<SubIndustryKey, IndustryQualityDefaults> = {
  skincare: {
    minSectionCount: 7,
    minFaqCount: 5,
    minImageCount: 8,
    minTrustElements: 3,
    safetyGate: 'medical',
    mustInclude: [
      '성분 정보 포함',
      '피부 타입별 추천 명시',
      '개인차 있을 수 있음 면책 문구',
    ],
    mustNotDo: [
      '의학적 효능 과대 광고',
      '부작용 완전 부재 주장',
      '개인 맞춤 처방 표시',
    ],
  },
  wedding: {
    minSectionCount: 8,
    minFaqCount: 6,
    minImageCount: 12,
    minTrustElements: 3,
    safetyGate: 'standard',
    mustInclude: [
      '포트폴리오 갤러리',
      '촬영/서비스 시간 명시',
      '보정본 납기 기간 명시',
    ],
    mustNotDo: [
      '추가 비용 숨김',
      '가격 완전 미표기',
    ],
  },
  medical_clinic: {
    minSectionCount: 8,
    minFaqCount: 8,
    minImageCount: 6,
    minTrustElements: 4,
    safetyGate: 'medical',
    mustInclude: [
      '전문의 자격 표시',
      '전문의 상담 권고 문구',
      '의료 행위 설명 포함',
    ],
    mustNotDo: [
      '치료 결과 100% 보장',
      '의사 자격 미표기',
      '가격 단독 강조 (의료법 위반 소지)',
    ],
  },
  restaurant_cafe: {
    minSectionCount: 6,
    minFaqCount: 4,
    minImageCount: 10,
    minTrustElements: 2,
    safetyGate: 'standard',
    mustInclude: [
      '메뉴 및 가격 표기',
      '영업시간 및 위치',
      '알레르기 유발 성분 안내',
    ],
    mustNotDo: [
      '사진과 실제 다른 음식 표기',
    ],
  },
  hotel: {
    minSectionCount: 9,
    minFaqCount: 6,
    minImageCount: 15,
    minTrustElements: 3,
    safetyGate: 'standard',
    mustInclude: [
      '객실 유형 및 가격 명시',
      '체크인/체크아웃 시간',
      '취소/환불 정책',
    ],
    mustNotDo: [
      '실제 시설과 다른 이미지',
      '가격 외 필수 항목 숨김',
    ],
  },
  place_brand: {
    minSectionCount: 6,
    minFaqCount: 4,
    minImageCount: 8,
    minTrustElements: 2,
    safetyGate: 'standard',
    mustInclude: [
      '위치 및 접근성 안내',
      '운영 시간 명시',
      '대표 콘텐츠/프로그램 소개',
    ],
    mustNotDo: [
      '과도한 광고성 문구',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GoldenJsonBuilder — main class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GoldenJsonBuilder
 *
 * Builds the 6 Golden Reference JSON deliverables from an array of
 * VisualAnalysisSnapshot objects collected for a single sub-industry.
 *
 * All methods are pure static functions — no external dependencies.
 * Input data comes from the golden_visual_snapshots table (DB) or in-memory.
 */
export class GoldenJsonBuilder {
  // ───────────────────────────────────────────────────────────────────────────
  // Deliverable 1: Design Tokens
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Builds the tokens deliverable by aggregating color, typography, shape,
   * and motion data across all snapshots.
   */
  static buildTokens(
    snapshots: VisualAnalysisSnapshot[],
    subIndustryKey: SubIndustryKey
  ): GoldenTokensOutput {
    const n = snapshots.length;
    const now = new Date().toISOString();

    // ── Colors ────────────────────────────────────────────────────────────────
    // DesignTokenSnapshot.colors is a ColorTokens object with:
    //   .primaryColor: string | null
    //   .computedPalette: { primary, secondary, bg, text, accent, border }: string[]
    //   .rawColors: RawColorToken[]
    const colorBuckets: Record<string, string[]> = {
      primary: [],
      secondary: [],
      bg: [],
      text: [],
      accent: [],
      border: [],
    };

    for (const snap of snapshots) {
      const tokens = snap.design_tokens;
      if (!tokens?.colors) continue;

      const { primaryColor, computedPalette, rawColors } = tokens.colors;

      // Primary color
      if (primaryColor) colorBuckets.primary.push(primaryColor.toLowerCase());
      else if (computedPalette.primary[0]) colorBuckets.primary.push(computedPalette.primary[0].toLowerCase());

      // Palette positions
      for (const c of (computedPalette.background ?? []).slice(0, 2)) colorBuckets.bg.push(c.toLowerCase());
      for (const c of (computedPalette.text ?? []).slice(0, 2)) colorBuckets.text.push(c.toLowerCase());
      for (const c of (computedPalette.accent ?? []).slice(0, 2)) colorBuckets.accent.push(c.toLowerCase());
      for (const c of (computedPalette.secondary ?? []).slice(0, 2)) colorBuckets.secondary.push(c.toLowerCase());
      for (const c of (computedPalette.border ?? []).slice(0, 2)) colorBuckets.border.push(c.toLowerCase());

      // Secondary from rawColors (2nd most frequent non-neutral)
      const secondaryCandidates = rawColors
        .filter((rc) => rc.hex !== primaryColor && /^#[0-9a-f]{6}$/i.test(rc.hex))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 2);
      for (const rc of secondaryCandidates) colorBuckets.secondary.push(rc.hex.toLowerCase());

      // Border from CSS variables
      for (const v of tokens.cssVariables ?? []) {
        const name = v.name.toLowerCase();
        if (name.includes('border') && /^#[0-9a-f]{3,8}$/i.test(v.value)) {
          colorBuckets.border.push(v.value.toLowerCase());
        }
      }
    }

    const colorConsensus: GoldenColorConsensus = {
      primary: buildColorConsensus(colorBuckets.primary, n),
      secondary: buildColorConsensus(colorBuckets.secondary, n),
      bg: buildColorConsensus(colorBuckets.bg, n),
      text: buildColorConsensus(colorBuckets.text, n),
      accent: buildColorConsensus(colorBuckets.accent, n),
      border: buildColorConsensus(colorBuckets.border, n),
      sampleCount: n,
    };

    // ── Typography ────────────────────────────────────────────────────────────
    // DesignTokenSnapshot.typography: Typography with
    //   .fontFamilies: FontFamily[] (usage: 'heading'|'body'|'other')
    //   .fontSizes: FontSize[] (context: 'h1'|'h2'|'body'|...)
    //   .lineHeights: LineHeight[]
    const headingFamilies: string[] = [];
    const bodyFamilies: string[] = [];
    const headingSizes: number[] = [];
    const bodySizes: number[] = [];
    const lineHeights: number[] = [];
    const pairKeys: string[] = [];

    for (const snap of snapshots) {
      const tokens = snap.design_tokens;
      if (!tokens?.typography) continue;

      const typo = tokens.typography;
      let heading = '';
      let body = '';

      for (const font of typo.fontFamilies) {
        const fam = font.family.split(',')[0].trim();
        if (!fam) continue;
        if (font.usage === 'heading') {
          headingFamilies.push(fam);
          if (!heading) heading = fam;
        }
        if (font.usage === 'body') {
          bodyFamilies.push(fam);
          if (!body) body = fam;
        }
      }

      if (heading || body) {
        pairKeys.push(`${heading || 'unknown'}::${body || 'unknown'}`);
      }

      // Font sizes
      for (const fs of typo.fontSizes) {
        const px = parseFloat(fs.size);
        if (!isNaN(px)) {
          if (fs.context === 'h1' || fs.context === 'h2') headingSizes.push(px);
          else if (fs.context === 'body') bodySizes.push(px);
        }
      }

      // Line heights
      for (const lh of typo.lineHeights) {
        const v = parseFloat(lh.value);
        if (!isNaN(v) && v > 0 && v < 4) lineHeights.push(v);
      }
    }

    // Build top 3 font pairs
    const pairFreq = countFrequency(pairKeys);
    const sortedPairs = sortedEntries(pairFreq);
    const topPairs: FontPairConsensus[] = sortedPairs.slice(0, 3).map((e) => {
      const [h, b] = String(e.value).split('::');
      return {
        headingFamily: h ?? 'Pretendard',
        bodyFamily: b ?? 'Noto Sans KR',
        frequency: e.frequency,
        ratio: n > 0 ? e.frequency / n : 0,
      };
    });

    const headFreq = countFrequency(headingFamilies);
    const bodyFreq = countFrequency(bodyFamilies);
    const lhFreq = countFrequency(lineHeights.map((v) => Math.round(v * 10) / 10));

    const typographyConsensus: GoldenTypographyConsensus = {
      topPairs: topPairs.length ? topPairs : [{ headingFamily: 'Pretendard', bodyFamily: 'Noto Sans KR', frequency: 0, ratio: 0 }],
      consensusHeadingFamily: String(getMode(headFreq) ?? 'Pretendard'),
      consensusBodyFamily: String(getMode(bodyFreq) ?? 'Noto Sans KR'),
      avgHeadingSizePx: Math.round(avg(headingSizes)) || 40,
      avgBodySizePx: Math.round(avg(bodySizes)) || 16,
      modeLineHeight: Number(getMode(lhFreq) ?? 1.6),
      sampleCount: n,
    };

    // ── Shape ─────────────────────────────────────────────────────────────────
    // DesignTokenSnapshot.shape: ShapeTokens with .borderRadius: BorderRadius[]
    const allBorderRadii: number[] = [];
    const brDistribution = new Map<string, number>();

    for (const snap of snapshots) {
      const tokens = snap.design_tokens;
      for (const br of tokens?.shape?.borderRadius ?? []) {
        const px = parseFloat(br.value);
        if (!isNaN(px) && px >= 0) {
          allBorderRadii.push(px);
          const key = String(px);
          brDistribution.set(key, (brDistribution.get(key) ?? 0) + br.frequency);
        }
      }
    }

    const brFreq = countFrequency(allBorderRadii);
    const modeBr = Number(getMode(brFreq) ?? 8);

    const brDistObj: Record<string, number> = {};
    for (const [k, v] of brDistribution) brDistObj[k] = v;

    // ── Motion ────────────────────────────────────────────────────────────────
    // DesignTokenSnapshot.motion: MotionTokens with
    //   .transitions: TransitionEntry[] (duration: string)
    //   .animations: AnimationEntry[]
    const transitionMsList: number[] = [];

    for (const snap of snapshots) {
      const tokens = snap.design_tokens;
      for (const tr of tokens?.motion?.transitions ?? []) {
        const ms = parseTransitionMs(tr.duration);
        transitionMsList.push(ms);
      }
    }

    const avgTransitionMs = Math.round(avg(transitionMsList)) || 300;
    const dominantLevel = classifyMotionLevel(avgTransitionMs);

    // Compute per-snapshot level distribution
    const levelCounts: Record<'minimal' | 'subtle' | 'expressive', number> = {
      minimal: 0, subtle: 0, expressive: 0,
    };
    for (const snap of snapshots) {
      const motion = snap.design_tokens?.motion;
      const msList = (motion?.transitions ?? []).map((tr) => parseTransitionMs(tr.duration));
      const level = classifyMotionLevel(avg(msList) || 300);
      levelCounts[level]++;
    }

    // ── CSS Variables ─────────────────────────────────────────────────────────
    const cssVars: Record<string, string> = {
      'color-primary': colorConsensus.primary.value,
      'color-secondary': colorConsensus.secondary.value,
      'color-bg': colorConsensus.bg.value,
      'color-text': colorConsensus.text.value,
      'color-accent': colorConsensus.accent.value,
      'color-border': colorConsensus.border.value,
      'font-heading': typographyConsensus.consensusHeadingFamily,
      'font-body': typographyConsensus.consensusBodyFamily,
      'font-size-heading': `${typographyConsensus.avgHeadingSizePx}px`,
      'font-size-body': `${typographyConsensus.avgBodySizePx}px`,
      'line-height-base': String(typographyConsensus.modeLineHeight),
      'border-radius-base': `${modeBr}px`,
      'transition-duration-base': `${avgTransitionMs}ms`,
    };

    return {
      deliverableType: 'tokens',
      subIndustryKey,
      generatedAt: now,
      sampleCount: n,
      colorConsensus,
      typographyConsensus,
      shapeConsensus: {
        modeBorderRadiusPx: modeBr,
        modeButtonRadiusPx: modeBr > 8 ? modeBr : 4,
        modeCardRadiusPx: modeBr,
        borderRadiusDistribution: brDistObj,
      },
      motionConsensus: {
        dominantLevel,
        avgTransitionMs,
        levelDistribution: levelCounts,
      },
      cssVariables: cssVars,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Deliverable 2: Layouts
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Builds the layouts deliverable by aggregating GNB, shell, footer, and hero data.
   */
  static buildLayouts(
    snapshots: VisualAnalysisSnapshot[],
    subIndustryKey: SubIndustryKey
  ): GoldenLayoutsOutput {
    const n = snapshots.length;
    const now = new Date().toISOString();

    // ── GNB ───────────────────────────────────────────────────────────────────
    const menuLabelAll: string[] = [];
    const itemCounts: number[] = [];
    let ctaCount = 0;
    let stickyCount = 0;
    const gnbStyles: string[] = [];

    for (const snap of snapshots) {
      const gnb = snap.layout_structure?.gnb;
      if (!gnb) continue;

      itemCounts.push(gnb.itemCount);
      if (gnb.hasCtaButton) ctaCount++;
      if (gnb.hasSearch) {
        // treat search GNB style as classic_bordered
        gnbStyles.push('classic_bordered');
      }

      // items: GnbItem[] from GnbAnalysis — extract label string
      for (const item of gnb.items ?? []) {
        const label = typeof item === 'string' ? item : item.label;
        menuLabelAll.push(normalizeMenuLabel(label));
      }
    }

    const labelFreq = countFrequency(menuLabelAll);
    const sortedLabels = sortedEntries(labelFreq);
    const topMenuItems: GnbMenuItemFrequency[] = sortedLabels
      .slice(0, 10)
      .map((e) => ({
        label: String(e.value),
        frequency: e.frequency,
        ratio: n > 0 ? e.frequency / n : 0,
      }));

    const gnbStyleFreq = countFrequency(gnbStyles);
    const dominantGnbStyle = (getMode(gnbStyleFreq) ?? 'horizontal') as GnbStyle;

    const gnbConsensus: GoldenGnbConsensus = {
      topMenuItems,
      avgItemCount: Math.round(avg(itemCounts) * 10) / 10,
      ctaRatio: n > 0 ? ctaCount / n : 0,
      stickyRatio: n > 0 ? stickyCount / n : 0,
      dominantStyle: dominantGnbStyle,
      sampleCount: n,
    };

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerCols: number[] = [];
    let footerSocialCount = 0;
    let footerNewsletterCount = 0;
    const footerLinkGroups: string[] = [];

    for (const snap of snapshots) {
      const footer = snap.layout_structure?.footer;
      if (!footer) continue;
      if (footer.hasSitemapLinks) {
        // proxy for column count: social is present, or just 1 col
        footerCols.push(footer.linkCount > 10 ? 3 : footer.linkCount > 4 ? 2 : 1);
      } else {
        footerCols.push(1);
      }
      if (footer.hasCertificationBadges) footerSocialCount++;
      // socialLinks is an array
      if (footer.socialLinks?.length > 0) footerSocialCount++;
      if (footer.hasNewsletterForm) footerNewsletterCount++;
    }

    // ── Hero ──────────────────────────────────────────────────────────────────
    const heroCtas: number[] = [];
    let heroVideoCount = 0;
    let heroFullscreenCount = 0;

    for (const snap of snapshots) {
      const hero = snap.layout_structure?.hero;
      if (!hero) continue;
      if (hero.hasVideoBackground) heroVideoCount++;
      if (hero.isFullscreen) heroFullscreenCount++;
      heroCtas.push(hero.hasProductShowcase ? 2 : 1);
    }

    return {
      deliverableType: 'layouts',
      subIndustryKey,
      generatedAt: now,
      sampleCount: n,
      gnbConsensus,
      shellConsensus: {
        avgMaxWidthPx: 1280,  // Standard industry default (no direct extraction field)
        dominantColumnLayout: 'single',
        sidebarRatio: 0,
      },
      footerConsensus: {
        avgColumnCount: Math.round(avg(footerCols)) || 2,
        socialLinksRatio: n > 0 ? footerSocialCount / n : 0,
        newsletterRatio: n > 0 ? footerNewsletterCount / n : 0,
        topLinkGroups: [...new Set(footerLinkGroups)].slice(0, 5),
      },
      heroConsensus: {
        dominantLayout: heroFullscreenCount > n / 2 ? 'full_bleed' : 'split',
        dominantBgType: heroVideoCount > n / 2 ? 'video' : 'image',
        avgCtaCount: Math.round(avg(heroCtas) * 10) / 10 || 1,
        subtaglineRatio: 0.7,  // Most sites have a subtagline
        avgViewportHeight: heroFullscreenCount > n / 2 ? 1.0 : 0.8,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Deliverable 3: Sections
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Builds the sections deliverable by computing section frequency, top-3
   * sequences, and consensus psychology flow.
   */
  static buildSections(
    snapshots: VisualAnalysisSnapshot[],
    subIndustryKey: SubIndustryKey
  ): GoldenSectionsOutput {
    const n = snapshots.length;
    const now = new Date().toISOString();

    // Collect homepage section sequences
    const homepageSequences: SectionType[][] = [];
    const sectionPositionSum = new Map<SectionType, number>();
    const sectionPositionCount = new Map<SectionType, number>();
    const sectionCount = new Map<SectionType, number>();
    const totalSectionCounts: number[] = [];

    for (const snap of snapshots) {
      const ssSnap = snap.section_sequence;
      if (!ssSnap) continue;

      // Use homepageSequence (SectionType[]) directly from SectionSequenceSnapshot
      const seq = ssSnap.homepageSequence ?? [];
      if (seq.length > 0) {
        homepageSequences.push(seq);
        totalSectionCounts.push(seq.length);

        (seq as SectionType[]).forEach((type: SectionType, idx: number) => {
          sectionCount.set(type, (sectionCount.get(type) ?? 0) + 1);
          sectionPositionSum.set(type, (sectionPositionSum.get(type) ?? 0) + idx);
          sectionPositionCount.set(type, (sectionPositionCount.get(type) ?? 0) + 1);
        });
      }
    }

    // Build sectionFrequency sorted desc
    const sectionFrequency: SectionFrequencyEntry[] = [...sectionCount.entries()]
      .map(([type, frequency]) => {
        const posSum = sectionPositionSum.get(type) ?? 0;
        const posCount = sectionPositionCount.get(type) ?? 1;
        return {
          type,
          frequency,
          ratio: n > 0 ? frequency / n : 0,
          avgPosition: Math.round((posSum / posCount) * 10) / 10,
          psychologyLayer: sectionTypeToPsychologyLayer(type),
        };
      })
      .sort((a, b) => b.frequency - a.frequency);

    // Top 3 sequences
    const seqKeys = homepageSequences.map((s) => s.join('→'));
    const seqFreq = countFrequency(seqKeys);
    const sortedSeqs = sortedEntries(seqFreq);
    const topSequences = sortedSeqs.slice(0, 3).map((e) => ({
      sequence: String(e.value).split('→') as SectionType[],
      frequency: e.frequency,
    }));

    // Consensus psychology flow
    const consensusPsychologyFlow = deriveConsensusFlow(homepageSequences);

    // Section consensus
    const sectionConsensus: GoldenSectionConsensus = {
      sectionFrequency,
      topSequences,
      consensusPsychologyFlow,
      avgSectionCount: Math.round(avg(totalSectionCounts) * 10) / 10 || 7,
      sampleCount: n,
    };

    // Build recommended homepage sequence from top sections
    const recommendedHomepageSequence = sectionFrequency.slice(0, 10).map((entry, i) => ({
      position: i,
      type: entry.type,
      psychologyLayer: entry.psychologyLayer,
      mandatory: entry.ratio >= 0.8,
      reason: `${Math.round(entry.ratio * 100)}% of sampled sites include this section (avg position ${entry.avgPosition})`,
    }));

    // Required sub-pages
    const subPagePaths = new Map<string, number>();
    for (const snap of snapshots) {
      const pages = snap.section_sequence?.pages ?? [];
      for (const page of pages) {
        if (page.pageRole !== 'homepage') {
          subPagePaths.set(page.pageRole, (subPagePaths.get(page.pageRole) ?? 0) + 1);
        }
      }
    }

    const requiredSubPages = [...subPagePaths.entries()]
      .filter(([, count]) => n > 0 && count / n >= 0.5)
      .map(([role, count]) => ({
        path: `/${role.replace('_', '-')}`,
        pageRole: role as PageSectionAnalysis['pageRole'],
        prevalenceRatio: n > 0 ? count / n : 0,
      }))
      .sort((a, b) => b.prevalenceRatio - a.prevalenceRatio);

    return {
      deliverableType: 'sections',
      subIndustryKey,
      generatedAt: now,
      sampleCount: n,
      sectionConsensus,
      recommendedHomepageSequence,
      requiredSubPages,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Deliverable 4: Content
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Builds the content deliverable from hero copy, FAQ, and trust element
   * patterns across all snapshots.
   */
  static buildContent(snapshots: VisualAnalysisSnapshot[]): GoldenContentOutput {
    const n = snapshots.length;
    const now = new Date().toISOString();

    // ── Hero Copy ─────────────────────────────────────────────────────────────
    const headlinePatterns: string[] = [];
    const headingWordCounts: number[] = [];
    let subtaglineCount = 0;

    for (const snap of snapshots) {
      const heroCopy = snap.content_templates?.heroCopy;
      if (!heroCopy) continue;

      const heading = heroCopy.heading;
      if (heading) {
        // Classify pattern type
        if (/[?？]/.test(heading)) {
          headlinePatterns.push('질문형 헤드라인');
        } else if (/[0-9]/.test(heading)) {
          headlinePatterns.push('숫자/통계 포함 헤드라인');
        } else if (/전문|특화|전문의|전문가/.test(heading)) {
          headlinePatterns.push('전문성 강조 헤드라인');
        } else if (/자연|순수|원료|성분/.test(heading)) {
          headlinePatterns.push('성분/원료 강조 헤드라인');
        } else {
          headlinePatterns.push('감성/브랜드 헤드라인');
        }
        headingWordCounts.push(heading.replace(/\s+/g, ' ').trim().split(' ').length);
      }

      if (heroCopy.subheading) subtaglineCount++;
    }

    const patternFreq = countFrequency(headlinePatterns);
    const sortedPatterns = sortedEntries(patternFreq);
    const topHeadlinePatterns = sortedPatterns.slice(0, 5).map((e) => ({
      pattern: String(e.value),
      frequency: e.frequency,
    }));

    const avgWords = avg(headingWordCounts);

    // ── FAQ ───────────────────────────────────────────────────────────────────
    const questionSources: string[] = [];
    const faqCounts: number[] = [];

    for (const snap of snapshots) {
      const faqItems = snap.content_templates?.faqItems ?? [];
      faqCounts.push(faqItems.length);
      for (const item of faqItems) {
        questionSources.push(item.source);
      }
    }

    const sourceFreq = countFrequency(questionSources);
    const sourceDistObj: Record<string, number> = {};
    for (const [k, v] of sourceFreq) sourceDistObj[k] = v;

    // Question type classification heuristic
    const questionTypeMap: Record<string, number> = {
      price: 0, process: 0, result: 0, safety: 0, time: 0, general: 0,
    };

    for (const snap of snapshots) {
      for (const item of snap.content_templates?.faqItems ?? []) {
        const q = item.question.toLowerCase();
        if (/가격|비용|얼마|요금/.test(q)) questionTypeMap.price++;
        else if (/과정|방법|절차|어떻게/.test(q)) questionTypeMap.process++;
        else if (/결과|효과|효능|좋아/.test(q)) questionTypeMap.result++;
        else if (/부작용|안전|위험|걱정/.test(q)) questionTypeMap.safety++;
        else if (/기간|시간|얼마나|언제/.test(q)) questionTypeMap.time++;
        else questionTypeMap.general++;
      }
    }

    const topQuestionTypes = Object.entries(questionTypeMap)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, frequency]) => ({
        type,
        frequency,
        exampleQuestion: GoldenJsonBuilder._exampleFaqQuestion(type),
      }));

    // ── Trust Elements ────────────────────────────────────────────────────────
    const trustTypeFreq = new Map<string, number>();
    const trustExamples = new Map<string, string>();

    for (const snap of snapshots) {
      for (const el of snap.content_templates?.trustElements ?? []) {
        trustTypeFreq.set(el.type, (trustTypeFreq.get(el.type) ?? 0) + 1);
        if (!trustExamples.has(el.type)) {
          trustExamples.set(el.type, el.text);
        }
      }
    }

    const topTrustTypes = sortedEntries(trustTypeFreq).slice(0, 5).map((e) => ({
      type: String(e.value) as TrustElement['type'],
      frequency: e.frequency,
      exampleText: trustExamples.get(String(e.value)) ?? '',
    }));

    // ── Psychology Flow (from section sequences) ──────────────────────────────
    const allSeqs: SectionType[][] = snapshots
      .map((s) => s.section_sequence?.homepageSequence ?? [])
      .filter((s) => s.length > 0);

    const consensusPsychologyFlow = deriveConsensusFlow(allSeqs);

    return {
      deliverableType: 'content',
      subIndustryKey: snapshots[0]?.subIndustryKey ?? ('skincare' as SubIndustryKey),
      generatedAt: now,
      sampleCount: n,
      heroCopyConsensus: {
        topHeadlinePatterns,
        avgWordCountRange: {
          min: Math.max(2, Math.round(avgWords * 0.6)),
          max: Math.round(avgWords * 1.4) || 10,
        },
        subtaglineRatio: n > 0 ? subtaglineCount / n : 0,
      },
      faqConsensus: {
        topQuestionTypes,
        avgFaqCount: Math.round(avg(faqCounts) * 10) / 10 || 5,
        sourceDistribution: sourceDistObj,
      },
      trustElementConsensus: {
        topTypes: topTrustTypes,
        answerFirstRatio: 0.6,  // Default; requires deeper NLP analysis
      },
      contentStrategy: {
        consensusPsychologyFlow,
        mustIncludeElements: [],   // Populated from quality defaults downstream
        mustAvoidPatterns: [],
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Deliverable 5: Images
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Builds the images deliverable from cataloged image data.
   */
  static buildImages(snapshots: VisualAnalysisSnapshot[]): GoldenImagesOutput {
    const n = snapshots.length;
    const now = new Date().toISOString();

    const heroTypes: string[] = [];
    const heroAspectRatios: number[] = [];
    const heroSrcs: string[] = [];
    let heroHumanCount = 0;

    const typeDist = new Map<string, number>();
    const totalImageCounts: number[] = [];
    const antiPatternIssues: string[] = [];

    for (const snap of snapshots) {
      const imgRef = snap.image_references;
      if (!imgRef) continue;

      totalImageCounts.push(imgRef.totalImages);

      // Hero image
      const heroImg = imgRef.heroImage;
      if (heroImg) {
        heroTypes.push(heroImg.type);
        if (heroImg.aspectRatio !== null) heroAspectRatios.push(heroImg.aspectRatio);
        // Proxy for "has human": team/person in src or alt
        const altLower = (heroImg.alt ?? '').toLowerCase();
        const srcLower = (heroImg.src ?? '').toLowerCase();
        if (/person|team|doctor|원장|대표|staff|chef|owner/.test(altLower + srcLower)) {
          heroHumanCount++;
        }
        // Extract src path pattern (first 2 segments)
        try {
          const url = new URL(heroImg.src, 'https://example.com');
          const parts = url.pathname.split('/').slice(1, 3);
          if (parts.length) heroSrcs.push('/' + parts.join('/'));
        } catch {
          // ignore malformed src
        }
      }

      // All images type distribution
      for (const [type, count] of Object.entries(imgRef.typeCounts ?? {})) {
        typeDist.set(type, (typeDist.get(type) ?? 0) + (count ?? 0));
      }

      // Anti-patterns
      for (const ap of imgRef.antiPatterns ?? []) {
        antiPatternIssues.push(ap.issue);
      }
    }

    const heroTypeFreq = countFrequency(heroTypes);
    const dominantHeroType = (getMode(heroTypeFreq) ?? 'hero') as ImageType;

    const srcFreq = countFrequency(heroSrcs);
    const topSrcPatterns = sortedEntries(srcFreq).slice(0, 3).map((e) => String(e.value));

    const typeDistObj: Partial<Record<ImageType, number>> = {};
    for (const [k, v] of typeDist) {
      typeDistObj[k as ImageType] = v;
    }

    const apFreq = countFrequency(antiPatternIssues);
    const antiPatternPrevalence = sortedEntries(apFreq).map((e) => ({
      issue: String(e.value) as 'no-alt' | 'broken-src' | 'too-small',
      ratio: n > 0 ? e.frequency / n : 0,
    }));

    const avgTotalImages = Math.round(avg(totalImageCounts)) || 8;

    return {
      deliverableType: 'images',
      subIndustryKey: snapshots[0]?.subIndustryKey ?? ('skincare' as SubIndustryKey),
      generatedAt: now,
      sampleCount: n,
      heroImageConsensus: {
        dominantType: dominantHeroType,
        humanRatio: n > 0 ? heroHumanCount / n : 0,
        avgAspectRatio: heroAspectRatios.length ? avg(heroAspectRatios) : null,
        topSrcPatterns,
      },
      overallImageConsensus: {
        avgTotalImages,
        typeDistribution: typeDistObj,
        antiPatternPrevalence,
      },
      imageChecklist: [
        '히어로 이미지 필수 (최소 1장)',
        '서비스/제품 이미지 최소 3장',
        '팀/원장 프로필 사진 (EEAT Authority)',
        '모든 이미지 alt 텍스트 필수',
        '이미지 최소 너비 800px',
        'WebP 형식 우선 사용',
        '실제 촬영본 사용 (스톡 이미지 최소화)',
      ],
      minRecommendedImageCount: Math.max(6, avgTotalImages - 4),
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Deliverable 6: Quality
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Builds the quality deliverable by deriving A- thresholds from data,
   * supplemented by industry-specific defaults.
   */
  static buildQuality(snapshots: VisualAnalysisSnapshot[]): GoldenQualityOutput {
    const n = snapshots.length;
    const now = new Date().toISOString();

    const industryKey = (snapshots[0]?.subIndustryKey ?? 'skincare') as SubIndustryKey;
    const defaults = INDUSTRY_QUALITY_DEFAULTS[industryKey];

    // Section counts
    const sectionCounts = snapshots.map(
      (s) => s.section_sequence?.homepageSequence?.length ?? 0
    );

    // FAQ counts
    const faqCounts = snapshots.map(
      (s) => s.content_templates?.faqItems?.length ?? 0
    );

    // Image counts
    const imageCounts = snapshots.map(
      (s) => s.image_references?.totalImages ?? 0
    );

    // Trust element counts
    const trustCounts = snapshots.map(
      (s) => s.content_templates?.trustElements?.length ?? 0
    );

    // P75 calculation helper
    function p75(values: number[]): number {
      if (values.length === 0) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      const idx = Math.floor(sorted.length * 0.75);
      return sorted[idx] ?? sorted[sorted.length - 1];
    }

    // Mandatory/recommended sections
    const sectionCount = new Map<SectionType, number>();
    for (const snap of snapshots) {
      for (const type of snap.section_sequence?.homepageSequence ?? []) {
        sectionCount.set(type, (sectionCount.get(type) ?? 0) + 1);
      }
    }

    const mandatorySections: SectionType[] = [];
    const recommendedSections: SectionType[] = [];
    for (const [type, count] of sectionCount) {
      const ratio = n > 0 ? count / n : 0;
      if (ratio >= 0.8) mandatorySections.push(type);
      else if (ratio >= 0.5) recommendedSections.push(type);
    }

    // Psychology layer completeness (which layers appear in ≥60% of sites)
    const layerCounts = new Map<PsychologyLayer, number>();
    for (const snap of snapshots) {
      const layers = new Set(
        (snap.section_sequence?.homepageSequence ?? []).map(sectionTypeToPsychologyLayer)
      );
      for (const layer of layers) {
        layerCounts.set(layer, (layerCounts.get(layer) ?? 0) + 1);
      }
    }

    const requiredPsychologyLayers: PsychologyLayer[] = [];
    for (const [layer, count] of layerCounts) {
      if (n > 0 && count / n >= 0.6) requiredPsychologyLayers.push(layer);
    }

    // Hero CTA ratio
    const heroCtas = snapshots.filter((s) => {
      const hero = s.layout_structure?.hero;
      return hero?.hasProductShowcase === true;
    }).length;

    return {
      deliverableType: 'quality',
      subIndustryKey: industryKey,
      generatedAt: now,
      sampleCount: n,
      aMinusThresholds: {
        minSectionCount: n > 0
          ? Math.min(p75(sectionCounts), defaults.minSectionCount + 2)
          : defaults.minSectionCount,
        minFaqCount: n > 0
          ? Math.min(p75(faqCounts), defaults.minFaqCount + 3)
          : defaults.minFaqCount,
        minImageCount: n > 0
          ? Math.min(p75(imageCounts), defaults.minImageCount + 4)
          : defaults.minImageCount,
        minTrustElements: n > 0
          ? Math.min(p75(trustCounts), defaults.minTrustElements + 2)
          : defaults.minTrustElements,
        heroCtaRequired: n > 0 ? heroCtas / n >= 0.7 : true,
      },
      mandatorySections,
      recommendedSections,
      requiredPsychologyLayers,
      safetyGate: defaults.safetyGate,
      expectedLayer: {
        mustInclude: defaults.mustInclude,
        mustNotDo: defaults.mustNotDo,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // buildAll — convenience entry-point
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Builds all 6 deliverables from the provided snapshots.
   *
   * @param snapshots  Array of per-site VisualAnalysisSnapshot objects
   * @param subIndustryKey  Target industry key (must match snapshots[].sub_industry_key)
   * @returns  Complete GoldenReferenceOutput with all 6 deliverables
   */
  static buildAll(
    snapshots: VisualAnalysisSnapshot[],
    subIndustryKey: SubIndustryKey,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _consensus?: unknown
  ): GoldenReferenceOutput {
    if (snapshots.length === 0) {
      throw new Error(
        `[GoldenJsonBuilder] No snapshots provided for industry "${subIndustryKey}". ` +
        'Cannot build consensus from zero samples.'
      );
    }

    const tokens = GoldenJsonBuilder.buildTokens(snapshots, subIndustryKey);
    const layouts = GoldenJsonBuilder.buildLayouts(snapshots, subIndustryKey);
    const sections = GoldenJsonBuilder.buildSections(snapshots, subIndustryKey);
    const content = GoldenJsonBuilder.buildContent(snapshots);
    const images = GoldenJsonBuilder.buildImages(snapshots);
    const quality = GoldenJsonBuilder.buildQuality(snapshots);

    // Enrich content strategy from quality defaults
    const defaults = INDUSTRY_QUALITY_DEFAULTS[subIndustryKey];
    content.contentStrategy.mustIncludeElements = defaults.mustInclude;
    content.contentStrategy.mustAvoidPatterns = defaults.mustNotDo;

    return { tokens, layouts, sections, content, images, quality };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ───────────────────────────────────────────────────────────────────────────

  /** Returns a canonical example FAQ question for a given type. */
  private static _exampleFaqQuestion(type: string): string {
    const examples: Record<string, string> = {
      price: '시술/서비스 비용이 얼마나 되나요?',
      process: '어떤 과정으로 진행되나요?',
      result: '결과는 언제부터 나타나나요?',
      safety: '부작용은 없나요?',
      time: '시술/서비스 시간이 얼마나 걸리나요?',
      general: '예약은 어떻게 하나요?',
    };
    return examples[type] ?? '자주 묻는 질문입니다.';
  }
}
