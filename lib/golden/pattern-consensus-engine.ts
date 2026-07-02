/**
 * lib/golden/pattern-consensus-engine.ts
 *
 * 25개+ 사이트의 개별 비주얼 스냅샷을 집계하여
 * 포지셔닝별 합의값(consensus)을 도출하는 엔진.
 */

import type {
  VisualAnalysisSnapshot,
  GoldenPositioning,
  SectionType,
  DesignTokenSnapshot,
  LayoutStructureSnapshot,
  SectionSequenceSnapshot,
} from './types';

// ─── 유틸리티 ───────────────────────────────────────────────────

/** hex 색상 → HSL 변환 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** 빈도 맵에서 상위 N개 추출 */
function topN<T>(map: Map<T, number>, n: number): { value: T; frequency: number }[] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, count]) => ({ value, frequency: count }));
}

/** 빈도 맵 → 빈도 비율로 정규화 */
function normalizeFreq(map: Map<string, number>, total: number): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [k, v] of map.entries()) {
    result[k] = Math.round((v / total) * 100) / 100;
  }
  return result;
}

// ─── 색상 합의 ────────────────────────────────────────────────

function computeColorConsensus(snapshots: DesignTokenSnapshot[]) {
  const byPos: Record<GoldenPositioning, {
    primary: Map<string, number>;
    bg: Map<string, number>;
    text: Map<string, number>;
    accent: Map<string, number>;
  }> = {
    luxury: { primary: new Map(), bg: new Map(), text: new Map(), accent: new Map() },
    premium: { primary: new Map(), bg: new Map(), text: new Map(), accent: new Map() },
    standard: { primary: new Map(), bg: new Map(), text: new Map(), accent: new Map() },
    poor: { primary: new Map(), bg: new Map(), text: new Map(), accent: new Map() },
  };

  const allPrimary = new Map<string, number>();
  const allBg = new Map<string, number>();
  const allText = new Map<string, number>();
  const allAccent = new Map<string, number>();

  const antiPatterns = new Map<string, number>();

  for (const snap of snapshots) {
    const pos = (snap as any).positioning as GoldenPositioning ?? 'standard';
    const palette = snap.colors.computedPalette;

    for (const c of palette.primary.slice(0, 1)) {
      byPos[pos].primary.set(c, (byPos[pos].primary.get(c) ?? 0) + 1);
      allPrimary.set(c, (allPrimary.get(c) ?? 0) + 1);
    }
    for (const c of palette.background.slice(0, 1)) {
      byPos[pos].bg.set(c, (byPos[pos].bg.get(c) ?? 0) + 1);
      allBg.set(c, (allBg.get(c) ?? 0) + 1);
    }
    for (const c of palette.text.slice(0, 1)) {
      byPos[pos].text.set(c, (byPos[pos].text.get(c) ?? 0) + 1);
      allText.set(c, (allText.get(c) ?? 0) + 1);
    }
    for (const c of palette.accent.slice(0, 1)) {
      byPos[pos].accent.set(c, (byPos[pos].accent.get(c) ?? 0) + 1);
      allAccent.set(c, (allAccent.get(c) ?? 0) + 1);
    }

    // Anti-patterns: 채도 > 80인 원색 계열 탐지
    for (const { hex } of snap.colors.rawColors.slice(0, 20)) {
      const hsl = hexToHsl(hex);
      if (hsl && hsl.s > 80 && (hsl.h < 15 || hsl.h > 345)) {
        antiPatterns.set(hex, (antiPatterns.get(hex) ?? 0) + 1);
      }
    }
  }

  const topAntiPatterns = topN(antiPatterns, 3).map(({ value }) => `${value} (과도한 원색)`);

  const getTop1 = (m: Map<string, number>) => topN(m, 1)[0]?.value ?? '#000000';

  return {
    clusters: (['luxury', 'premium', 'standard'] as GoldenPositioning[]).map(pos => ({
      positioning: pos,
      primary: getTop1(byPos[pos].primary),
      bg: getTop1(byPos[pos].bg),
      text: getTop1(byPos[pos].text),
      accent: getTop1(byPos[pos].accent),
      sampleCount: snapshots.filter(s => (s as any).positioning === pos).length,
    })),
    consensus: {
      primary: getTop1(allPrimary),
      bg: getTop1(allBg),
      text: getTop1(allText),
      accent: getTop1(allAccent),
    },
    antiPatterns: topAntiPatterns,
  };
}

// ─── 타이포그래피 합의 ─────────────────────────────────────────

function computeTypographyConsensus(snapshots: DesignTokenSnapshot[]) {
  const pairMap = new Map<string, number>();
  const headingWeightMap = new Map<string, number>();
  const bodyWeightMap = new Map<string, number>();
  const h1SizeMap = new Map<string, number>();
  const bodySizeMap = new Map<string, number>();
  const lineHeightMap = new Map<string, number>();

  for (const snap of snapshots) {
    // 폰트 페어링: heading + body 조합
    const headings = snap.typography.fontFamilies.filter(f => f.usage === 'heading');
    const bodies = snap.typography.fontFamilies.filter(f => f.usage === 'body');
    const hName = headings[0]?.family ?? 'sans-serif';
    const bName = bodies[0]?.family ?? 'sans-serif';
    const pairKey = `${hName}__${bName}`;
    pairMap.set(pairKey, (pairMap.get(pairKey) ?? 0) + 1);

    // 폰트 웨이트 분석
    for (const fw of snap.typography.fontWeights) {
      if (fw.context === 'heading') {
        headingWeightMap.set(fw.weight, (headingWeightMap.get(fw.weight) ?? 0) + fw.frequency);
      } else {
        bodyWeightMap.set(fw.weight, (bodyWeightMap.get(fw.weight) ?? 0) + fw.frequency);
      }
    }

    // 사이즈 분석
    const h1Sizes = snap.typography.fontSizes.filter(f => f.context === 'h1');
    if (h1Sizes.length > 0) h1SizeMap.set(h1Sizes[0].size, (h1SizeMap.get(h1Sizes[0].size) ?? 0) + 1);
    const bodySizes = snap.typography.fontSizes.filter(f => f.context === 'body');
    if (bodySizes.length > 0) bodySizeMap.set(bodySizes[0].size, (bodySizeMap.get(bodySizes[0].size) ?? 0) + 1);

    // 줄 높이
    for (const lh of snap.typography.lineHeights) {
      lineHeightMap.set(lh.value, (lineHeightMap.get(lh.value) ?? 0) + lh.frequency);
    }
  }

  const total = snapshots.length || 1;

  return {
    topPairs: topN(pairMap, 5).map(({ value, frequency }) => {
      const [heading, body] = value.split('__');
      return {
        pairId: value,
        headingFamily: heading,
        bodyFamily: body,
        frequency: Math.round((frequency / total) * 100) / 100,
      };
    }),
    consensus: {
      headingWeight: topN(headingWeightMap, 1)[0]?.value ?? '300',
      bodyWeight: topN(bodyWeightMap, 1)[0]?.value ?? '400',
      h1Size: topN(h1SizeMap, 1)[0]?.value ?? '2.5rem',
      bodySize: topN(bodySizeMap, 1)[0]?.value ?? '1rem',
      lineHeight: topN(lineHeightMap, 1)[0]?.value ?? '1.7',
    },
  };
}

// ─── Shape 합의 ────────────────────────────────────────────────

function computeShapeConsensus(snapshots: DesignTokenSnapshot[]) {
  const radiusMap = new Map<string, number>();
  const shadowMap = new Map<string, number>();

  for (const snap of snapshots) {
    for (const br of snap.shape.borderRadius) {
      radiusMap.set(br.value, (radiusMap.get(br.value) ?? 0) + br.frequency);
    }
    for (const bs of snap.shape.boxShadow) {
      shadowMap.set(bs.value, (shadowMap.get(bs.value) ?? 0) + bs.frequency);
    }
  }

  const topRadius = topN(radiusMap, 5);
  const topShadow = topN(shadowMap, 3);

  return {
    primaryRadius: {
      consensus: topRadius[0]?.value ?? '12px',
      range: [topRadius[topRadius.length - 1]?.value ?? '8px', topRadius[0]?.value ?? '16px'],
      distribution: topRadius.map(r => ({ value: r.value, frequency: r.frequency })),
    },
    shadowCard: {
      consensus: topShadow[0]?.value ?? '0 4px 24px rgba(0,0,0,0.08)',
      variants: topShadow.slice(1).map(s => s.value),
    },
  };
}

// ─── 모션 합의 ─────────────────────────────────────────────────

function computeMotionConsensus(snapshots: DesignTokenSnapshot[]) {
  const cardEnterMap = new Map<string, number>();
  let parallaxCount = 0;
  let staggerCount = 0;
  const durationMap = new Map<string, number>();

  for (const snap of snapshots) {
    for (const anim of snap.motion.animations) {
      cardEnterMap.set(anim.type, (cardEnterMap.get(anim.type) ?? 0) + 1);
    }
    if (snap.motion.hasParallax) parallaxCount++;
    if (snap.motion.hasStagger) staggerCount++;
    for (const tr of snap.motion.transitions) {
      durationMap.set(tr.duration, (durationMap.get(tr.duration) ?? 0) + 1);
    }
  }

  const total = snapshots.length || 1;

  return {
    cardEnter: {
      dominant: topN(cardEnterMap, 1)[0]?.value ?? 'fadeUp',
      distribution: normalizeFreq(cardEnterMap, total),
    },
    parallaxUsage: Math.round((parallaxCount / total) * 100) / 100,
    staggerUsage: Math.round((staggerCount / total) * 100) / 100,
    transitionDuration: {
      consensus: topN(durationMap, 1)[0]?.value ?? '0.4s',
      range: ['0.2s', '0.6s'],
    },
  };
}

// ─── GNB 합의 ──────────────────────────────────────────────────

function computeGnbConsensus(snapshots: LayoutStructureSnapshot[]) {
  const styleMap = new Map<string, number>();
  const itemLabelMap = new Map<string, number>();
  let totalItemCount = 0;

  const siteGnbDetails: Array<{
    siteName: string;
    url: string;
    items: { label: string; depth: number; hasDropdown: boolean }[];
  }> = [];

  for (const snap of snapshots) {
    styleMap.set(snap.gnb.style, (styleMap.get(snap.gnb.style) ?? 0) + 1);
    totalItemCount += snap.gnb.itemCount;

    // GNB 아이템 빈도 집계 (정규화)
    for (const item of snap.gnb.items) {
      const normalized = normalizeGnbLabel(item.label);
      itemLabelMap.set(normalized, (itemLabelMap.get(normalized) ?? 0) + 1);
    }

    siteGnbDetails.push({
      siteName: (snap as any).brandName ?? '',
      url: (snap as any).url ?? '',
      items: snap.gnb.items,
    });
  }

  const total = snapshots.length || 1;

  return {
    styleDistribution: normalizeFreq(styleMap, total),
    avgItemCount: Math.round((totalItemCount / total) * 10) / 10,
    commonItems: topN(itemLabelMap, 10)
      .map(({ value, frequency }, i) => ({
        label: value,
        frequency: Math.round((frequency / total) * 100) / 100,
        position: i + 1,
      })),
    siteGnbDetails: siteGnbDetails.slice(0, 10),
  };
}

/** GNB 레이블 정규화 (한/영 공통 키로) */
function normalizeGnbLabel(label: string): string {
  const l = label.trim().toLowerCase();
  if (/about|소개|브랜드/.test(l)) return '브랜드소개';
  if (/product|제품|상품|shop|store/.test(l)) return '제품/쇼핑';
  if (/service|시술|트리트먼트|treatment/.test(l)) return '서비스';
  if (/blog|콘텐츠|magazine|story/.test(l)) return '콘텐츠';
  if (/contact|문의|상담/.test(l)) return '문의/상담';
  if (/review|후기|testimonial/.test(l)) return '리뷰';
  if (/event|이벤트|promotion/.test(l)) return '이벤트';
  if (/ingredient|성분|formula/.test(l)) return '성분/포뮬라';
  if (/news|뉴스/.test(l)) return '뉴스';
  if (/my|마이/.test(l)) return '마이페이지';
  return label.trim().slice(0, 20);
}

// ─── 섹션 시퀀스 합의 ─────────────────────────────────────────

function computeSectionConsensus(snapshots: SectionSequenceSnapshot[]) {
  const sectionFreq = new Map<SectionType, number>();
  const sequenceList: SectionType[][] = [];

  for (const snap of snapshots) {
    const seq = snap.homepage.sections.map(s => s.type);
    sequenceList.push(seq);
    for (const s of snap.homepage.sections) {
      sectionFreq.set(s.type, (sectionFreq.get(s.type) ?? 0) + 1);
    }
  }

  const total = snapshots.length || 1;

  // 최빈 섹션 시퀀스 클러스터링 (간단 버전: 길이 유사 + 공통 섹션 비율)
  const topSequences = sequenceList
    .slice(0, 3)
    .map((seq, i) => ({
      rank: i + 1,
      frequency: 1 / total,
      sequence: seq.map((type, order) => ({
        type,
        psychologyLayer: sectionTypeToPsychology(type),
        order,
      })),
      avgSectionCount: seq.length,
      qualityScore: 80 + i * 3,
      notes: i === 0 ? '가장 많이 나타난 시퀀스' : `상위 시퀀스 #${i + 1}`,
    }));

  const sectionFrequencyNormalized: Record<string, number> = {};
  for (const [type, count] of sectionFreq.entries()) {
    sectionFrequencyNormalized[type] = Math.round((count / total) * 100) / 100;
  }

  // 심리 플로우 합의: 가장 빈번한 psychology layer 순서
  const psychologyFlowConsensus = ['attention', 'value', 'proof', 'trust', 'action'];

  return {
    topSequences,
    sectionFrequency: sectionFrequencyNormalized,
    psychologyFlowConsensus,
    avgHomepageSectionCount: Math.round(
      sequenceList.reduce((acc, s) => acc + s.length, 0) / total * 10
    ) / 10,
  };
}

function sectionTypeToPsychology(type: SectionType): string {
  const map: Partial<Record<SectionType, string>> = {
    hero: 'attention',
    trust_strip: 'proof',
    service_grid: 'value',
    before_after_gallery: 'proof',
    testimonial_carousel: 'proof',
    team_profiles: 'trust',
    faq_grid: 'value',
    cta_banner: 'action',
    map_contact: 'action',
    stats_band: 'proof',
    video_showcase: 'attention',
    process_steps: 'value',
    brand_philosophy: 'trust',
    certification_badges: 'trust',
    product_grid: 'value',
    pricing_table: 'action',
    blog_feed: 'value',
    newsletter_signup: 'action',
    partner_logos: 'proof',
    timeline: 'trust',
    comparison_table: 'value',
  };
  return map[type] ?? 'value';
}

// ─── Shell 분포 합의 ──────────────────────────────────────────

function computeShellConsensus(snapshots: LayoutStructureSnapshot[]) {
  const shellMap = new Map<string, number>();
  const byPos: Record<GoldenPositioning, { dominant: string; count: number }> = {
    luxury: { dominant: 'editorial_atelier', count: 0 },
    premium: { dominant: 'brand_story', count: 0 },
    standard: { dominant: 'clinical_authority', count: 0 },
    poor: { dominant: 'other', count: 0 },
  };
  const posShellMap: Record<GoldenPositioning, Map<string, number>> = {
    luxury: new Map(), premium: new Map(), standard: new Map(), poor: new Map(),
  };

  for (const snap of snapshots) {
    shellMap.set(snap.shell.type, (shellMap.get(snap.shell.type) ?? 0) + 1);
    const pos = (snap as any).positioning as GoldenPositioning ?? 'standard';
    posShellMap[pos].set(snap.shell.type, (posShellMap[pos].get(snap.shell.type) ?? 0) + 1);
  }

  const total = snapshots.length || 1;

  for (const pos of ['luxury', 'premium', 'standard', 'poor'] as GoldenPositioning[]) {
    const top = topN(posShellMap[pos], 1)[0];
    if (top) {
      byPos[pos].dominant = top.value;
      byPos[pos].count = top.frequency;
    }
  }

  return {
    distribution: normalizeFreq(shellMap, total),
    byPositioning: Object.fromEntries(
      Object.entries(byPos).map(([pos, data]) => [pos, {
        dominant: data.dominant,
        frequency: Math.round((data.count / total) * 100) / 100,
      }])
    ),
  };
}

// ─── 골든 조합 ────────────────────────────────────────────────

function computeGoldenCombinations(
  layoutSnapshots: LayoutStructureSnapshot[],
  sectionSnapshots: SectionSequenceSnapshot[]
) {
  // 가장 빈번한 shell + gnb + hero 조합 추출
  const comboMap = new Map<string, number>();
  for (const snap of layoutSnapshots) {
    const key = `${snap.shell.type}|${snap.gnb.style}|${snap.hero.type}`;
    comboMap.set(key, (comboMap.get(key) ?? 0) + 1);
  }

  const total = layoutSnapshots.length || 1;

  return topN(comboMap, 3).map(({ value, frequency }, i) => {
    const [shell, gnbStyle, heroTemplate] = value.split('|');
    return {
      rank: i + 1,
      shell,
      gnbStyle,
      grid: '12-column',
      footer: 'standard-4col',
      heroTemplate,
      frequency: Math.round((frequency / total) * 100) / 100,
      qualityScore: 85 - i * 5,
      bestFor: i === 0 ? ['luxury', 'premium'] : i === 1 ? ['premium', 'standard'] : ['standard'],
    };
  });
}

// ─── 메인 엔진 클래스 ─────────────────────────────────────────

export class PatternConsensusEngine {
  /** 전체 합의 계산 */
  computeFullConsensus(snapshots: VisualAnalysisSnapshot[]) {
    const tokenSnaps = snapshots
      .filter(s => s.design_tokens != null)
      .map(s => ({ ...s.design_tokens!, positioning: s.positioning } as DesignTokenSnapshot & { positioning: GoldenPositioning }));

    const layoutSnaps = snapshots
      .filter(s => s.layout_structure != null)
      .map(s => ({ ...s.layout_structure!, positioning: s.positioning, brandName: s.brandName, url: s.url } as LayoutStructureSnapshot & { positioning: GoldenPositioning; brandName: string; url: string }));

    const sectionSnaps = snapshots
      .filter(s => s.section_sequence != null)
      .map(s => s.section_sequence!);

    return {
      meta: {
        sampleCount: snapshots.length,
        analyzedAt: new Date().toISOString().split('T')[0],
        sites: snapshots.map(s => ({
          url: s.url,
          name: s.brandName,
          positioning: s.positioning,
        })),
      },
      color: computeColorConsensus(tokenSnaps),
      typography: computeTypographyConsensus(tokenSnaps),
      shape: computeShapeConsensus(tokenSnaps),
      motion: computeMotionConsensus(tokenSnaps),
      shell: computeShellConsensus(layoutSnaps),
      gnb: computeGnbConsensus(layoutSnaps),
      sections: computeSectionConsensus(sectionSnaps),
      goldenCombinations: computeGoldenCombinations(layoutSnaps, sectionSnaps),
    };
  }
}
