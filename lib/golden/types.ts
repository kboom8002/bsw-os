/**
 * lib/golden/types.ts
 *
 * Shared type definitions for the Golden Reference visual extraction system.
 *
 * ── Section A ──  Extraction-layer types (used by the 5 crawl/extract modules)
 *   DesignTokenExtractor, LayoutStructureAnalyzer, SectionSequenceDetector,
 *   ContentTemplateHarvester, ImageReferenceCataloger
 *
 * ── Section B ──  Consensus / Aggregation / Deliverable types (used by
 *   GoldenJsonBuilder, PatternConsensusEngine, and the DB integration layer)
 */

// ═══════════════════════════════════════════════════════════════
// Section B-0: Core enumerations (needed by both sections)
// ═══════════════════════════════════════════════════════════════

/**
 * 골든 레퍼런스 분석 대상 세부 업종 키
 * BSW V3 taxonomy의 서브셋 — Phase 1 대상 6개 업종
 */
export type SubIndustryKey =
  | 'skincare'
  | 'wedding'
  | 'medical_clinic'
  | 'restaurant_cafe'
  | 'hotel'
  | 'place_brand';

/**
 * 사이트 포지셔닝 등급
 * DB CHECK 제약과 동기화됨 (0018_golden_reference.sql)
 */
export type GoldenPositioning = 'luxury' | 'premium' | 'standard' | 'poor';

// ─────────────────────────────────────────────────────────────────────────────
// Section A: Design Token Snapshot
// ─────────────────────────────────────────────────────────────────────────────

export interface RawColorToken {
  hex: string;
  /** Original raw CSS color string (e.g. "rgb(12,34,56)", "#abc") */
  raw?: string;
  frequency: number;
  context?: string;
}

export interface ComputedColorPalette {
  primary: string[];
  secondary?: string[];
  background: string[];
  text: string[];
  accent: string[];
  border?: string[];
}

export interface ColorTokens {
  /** All raw color tokens extracted from CSS */
  rawColors: RawColorToken[];
  /** Organized into semantic roles for consensus computation */
  computedPalette: ComputedColorPalette;
  /** Most frequent non-neutral color */
  primaryColor: string | null;
}

export interface FontFamily {
  family: string;
  /** 'heading' | 'body' | 'other' */
  usage: 'heading' | 'body' | 'other';
  frequency: number;
}

export interface FontWeight {
  weight: string;
  frequency: number;
  /** 'heading' | 'body' | 'other' */
  context: 'heading' | 'body' | 'other';
}

export interface FontSize {
  size: string;
  frequency: number;
  /** 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'other' */
  context: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'other';
}

export interface LineHeight {
  value: string;
  frequency: number;
}

export interface Typography {
  fontFamilies: FontFamily[];
  fontWeights: FontWeight[];
  fontSizes: FontSize[];
  lineHeights: LineHeight[];
  /** Whether Google Fonts is detected */
  usesGoogleFonts: boolean;
  /** Google Fonts families requested */
  googleFontFamilies: string[];
}

export interface BorderRadius {
  value: string;
  frequency: number;
}

export interface BoxShadow {
  value: string;
  frequency: number;
}

export interface ShapeTokens {
  borderRadius: BorderRadius[];
  boxShadow: BoxShadow[];
}

export interface AnimationEntry {
  /** 'fadeUp' | 'fadeIn' | 'slide' | 'scale' | 'custom' */
  type: string;
  value: string;
  frequency: number;
}

export interface TransitionEntry {
  duration: string;
  easing: string;
  frequency: number;
}

export interface MotionTokens {
  animations: AnimationEntry[];
  transitions: TransitionEntry[];
  hasParallax: boolean;
  hasStagger: boolean;
}

export interface CSSCustomProperty {
  name: string; // without the -- prefix
  value: string;
}

export interface DesignTokenSnapshot {
  brandName: string;
  /** CSS Custom Properties (variables) */
  cssVariables: CSSCustomProperty[];
  /** Color tokens (raw + organized palette) */
  colors: ColorTokens;
  /** Typography: fonts, weights, sizes, line-heights */
  typography: Typography;
  /** Shape: border-radius + box-shadow */
  shape: ShapeTokens;
  /** Motion: animations + transitions */
  motion: MotionTokens;
  /** Total CSS character length processed */
  totalCssLength: number;
  /** Number of external CSS files fetched */
  externalCssFilesFetched: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section A: Layout Structure Snapshot
// ─────────────────────────────────────────────────────────────────────────────

export type GnbStyle = 'transparent_overlay' | 'minimal_text' | 'classic_bordered' | 'unknown' | 'horizontal' | 'hamburger' | 'mega_menu' | 'tabs';

export interface GnbItem {
  label: string;
  depth: number;        // 0 = top-level, 1 = first-level dropdown, etc.
  hasDropdown: boolean;
}

export interface GnbAnalysis {
  style: GnbStyle;
  itemCount: number;
  items: GnbItem[];
  hasSearch: boolean;
  hasCtaButton: boolean;
  hasDropdownMenu: boolean;
}

export interface ShellAnalysis {
  /** Classification of the overall shell layout */
  type: 'immersive_fullbleed' | 'editorial_atelier' | 'clinical_authority' | 'brand_story';
  maxWidth: number | null; // pixels or null if not detected
}

export type ShellClassification = ShellAnalysis['type'];

export interface FooterAnalysis {
  hasNewsletterForm: boolean;
  socialLinks: { platform: string; href: string }[];
  hasSitemapLinks: boolean;
  hasMapEmbed: boolean;
  hasCertificationBadges: boolean;
  linkCount: number;
}

export interface HeroAnalysis {
  /** Hero template type for consensus: 'video' | 'slider' | 'fullscreen' | 'product' | 'standard' */
  type: 'video' | 'slider' | 'fullscreen' | 'product' | 'standard';
  hasVideoBackground: boolean;
  hasSlider: boolean;
  isFullscreen: boolean;
  hasProductShowcase: boolean;
}

export interface LayoutStructureSnapshot {
  brandName: string;
  gnb: GnbAnalysis;
  shell: ShellAnalysis;
  footer: FooterAnalysis;
  hero: HeroAnalysis;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section A: Section Sequence Snapshot
// ─────────────────────────────────────────────────────────────────────────────

export type SectionType =
  | 'hero'
  | 'trust_strip'
  | 'service_grid'
  | 'before_after_gallery'
  | 'testimonial_carousel'
  | 'team_profiles'
  | 'faq_grid'
  | 'cta_banner'
  | 'map_contact'
  | 'stats_band'
  | 'video_showcase'
  | 'process_steps'
  | 'brand_philosophy'
  | 'certification_badges'
  | 'newsletter_signup'
  | 'pricing_table'
  | 'blog_feed'
  | 'product_grid'
  | 'partner_logos'
  | 'timeline'
  | 'comparison_table'
  | 'unknown';

export type PsychologyLayer = 'attention' | 'proof' | 'value' | 'trust' | 'action' | 'neutral' | 'delight';

export interface DetectedSection {
  type: SectionType;
  psychologyLayer: PsychologyLayer;
  /** 0-based order index within the page */
  order: number;
  /** The raw class/id/aria-label that triggered this classification */
  matchedAttribute: string;
  /** Tag name of the element */
  tagName: string;
}

export interface HomepageSectionData {
  /** Ordered list of detected sections on the homepage */
  sections: DetectedSection[];
  /** Simple sequence of types (for quick pattern matching) */
  sequence: SectionType[];
}

export interface PageSectionAnalysis {
  pageUrl: string;
  /** Inferred page role */
  pageRole: 'homepage' | 'about' | 'services' | 'gallery' | 'reviews' | 'other';
  sections: DetectedSection[];
  /** Ordered list of section types (for easy sequence comparison) */
  sectionSequence: SectionType[];
}

export interface SectionSequenceSnapshot {
  brandName: string;
  /** Homepage section data — used by PatternConsensusEngine */
  homepage: HomepageSectionData;
  pages: PageSectionAnalysis[];
  /** Convenience alias: same as homepage.sequence. Used by GoldenJsonBuilder. */
  homepageSequence: SectionType[];
  /** Counts of each section type across ALL pages */
  globalSectionCounts: Partial<Record<SectionType, number>>;
  /** Psychology layer distribution across all detected sections */
  psychologyLayerDistribution: Partial<Record<PsychologyLayer, number>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section A: Content Template Snapshot
// ─────────────────────────────────────────────────────────────────────────────

export type ContentTone =
  | 'clinical_confident'
  | 'warm_professional'
  | 'scientific_authoritative';

export interface HeroCopy {
  heading: string | null;
  subheading: string | null;
  ctaText: string | null;
}

export interface FaqItem {
  question: string;
  answer: string;
  /** Source of extraction */
  source: 'json-ld' | 'dl-dt-dd' | 'heading-paragraph';
}

export interface TrustElement {
  /** Raw text found (e.g. "누적 시술 10,000건") */
  text: string;
  /** Detected type */
  type: 'statistic' | 'certification' | 'disclaimer' | 'award';
}

export interface ContentTemplateSnapshot {
  brandName: string;
  heroCopy: HeroCopy;
  faqItems: FaqItem[];
  trustElements: TrustElement[];
  contentTone: ContentTone;
  /** Number of pages analyzed */
  pagesAnalyzed: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section A: Image Reference Snapshot
// ─────────────────────────────────────────────────────────────────────────────

export type ImageType =
  | 'hero'
  | 'product'
  | 'team'
  | 'space_interior'
  | 'before_after'
  | 'logo'
  | 'icon'
  | 'background'
  | 'other';

export interface CatalogedImage {
  src: string;
  alt: string;
  type: ImageType;
  width?: number;
  height?: number;
  /** Calculated aspect ratio (width/height) or null if dimensions unknown */
  aspectRatio: number | null;
  /** Page URL where this image was found */
  pageUrl: string;
}

export interface ImageAntiPattern {
  src: string;
  pageUrl: string;
  /** Quality issue type */
  issue: 'no-alt' | 'broken-src' | 'too-small';
}

export interface ImageReferenceSnapshot {
  brandName: string;
  /** Primary hero/OG image */
  heroImage: CatalogedImage | null;
  /** All classified images */
  images: CatalogedImage[];
  /** Count by image type */
  typeCounts: Partial<Record<ImageType, number>>;
  /** Dominant container background colors (from CSS of image containers) */
  dominantContainerColors: string[];
  /** Images with quality issues */
  antiPatterns: ImageAntiPattern[];
  /** Total images found across all pages */
  totalImages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section A: Top-level Visual Analysis Snapshot (one per site)
// ─────────────────────────────────────────────────────────────────────────────

export interface VisualAnalysisSnapshot {
  url: string;
  brandName: string;
  subIndustryKey: SubIndustryKey;
  positioning: GoldenPositioning;
  design_tokens?: DesignTokenSnapshot;
  layout_structure?: LayoutStructureSnapshot;
  section_sequence?: SectionSequenceSnapshot;
  content_templates?: ContentTemplateSnapshot;
  image_references?: ImageReferenceSnapshot;
  vibe_vector?: Record<string, number>;
  analyzed_at: string;
  analysis_version: string;
}

// ═══════════════════════════════════════════════════════════════
// Section B-1: Consensus aggregation interfaces
// ═══════════════════════════════════════════════════════════════

/** Single color position consensus result */
export interface ColorConsensusEntry {
  /** Winning hex color */
  value: string;
  /** Number of sites using this color in this position */
  frequency: number;
  /** Frequency as a ratio of total samples (0–1) */
  ratio: number;
  /** Runner-up alternatives (up to 3) */
  alternatives: Array<{ value: string; frequency: number }>;
}

/** Color consensus for all 6 semantic positions */
export interface GoldenColorConsensus {
  primary: ColorConsensusEntry;
  secondary: ColorConsensusEntry;
  bg: ColorConsensusEntry;
  text: ColorConsensusEntry;
  accent: ColorConsensusEntry;
  border: ColorConsensusEntry;
  sampleCount: number;
}

/** Single font-pair consensus entry */
export interface FontPairConsensus {
  headingFamily: string;
  bodyFamily: string;
  frequency: number;
  ratio: number;
}

/** Typography consensus */
export interface GoldenTypographyConsensus {
  /** Top 3 heading+body font pairings by frequency */
  topPairs: FontPairConsensus[];
  /** Winning heading font (rank 1) */
  consensusHeadingFamily: string;
  /** Winning body font (rank 1) */
  consensusBodyFamily: string;
  /** Average heading size in px (desktop) */
  avgHeadingSizePx: number;
  /** Average body size in px (desktop) */
  avgBodySizePx: number;
  /** Mode line-height value */
  modeLineHeight: number;
  sampleCount: number;
}

/** GNB menu item frequency entry */
export interface GnbMenuItemFrequency {
  /** Normalized label (e.g. '서비스', '소개', '후기') */
  label: string;
  frequency: number;
  ratio: number;
}

/** GNB consensus */
export interface GoldenGnbConsensus {
  /** Top 10 menu item labels by frequency */
  topMenuItems: GnbMenuItemFrequency[];
  /** Mean number of menu items */
  avgItemCount: number;
  /** Proportion of sites with a CTA button in GNB */
  ctaRatio: number;
  /** Proportion of sites with sticky GNB */
  stickyRatio: number;
  /** Most common GNB style */
  dominantStyle: GnbStyle;
  sampleCount: number;
}

/** Section frequency entry */
export interface SectionFrequencyEntry {
  type: SectionType;
  frequency: number;
  ratio: number;
  /** Mean position (0-based) when present */
  avgPosition: number;
  /** Most common psychology layer mapping for this section type */
  psychologyLayer: PsychologyLayer;
}

/** Section placement consensus */
export interface GoldenSectionConsensus {
  /** All section types sorted by frequency desc */
  sectionFrequency: SectionFrequencyEntry[];
  /** Top 3 full homepage section sequences */
  topSequences: Array<{
    sequence: SectionType[];
    frequency: number;
  }>;
  /** Consensus psychology layer ordering for homepage */
  consensusPsychologyFlow: PsychologyLayer[];
  /** Mean section count per homepage */
  avgSectionCount: number;
  sampleCount: number;
}

// ═══════════════════════════════════════════════════════════════
// Section B-2: Six deliverable output types
// ═══════════════════════════════════════════════════════════════

/**
 * Deliverable 1 — Design Tokens
 * DB: golden_reference_outputs WHERE deliverable_type = 'tokens'
 */
export interface GoldenTokensOutput {
  deliverableType: 'tokens';
  subIndustryKey: SubIndustryKey;
  generatedAt: string;
  sampleCount: number;
  colorConsensus: GoldenColorConsensus;
  typographyConsensus: GoldenTypographyConsensus;
  shapeConsensus: {
    modeBorderRadiusPx: number;
    modeButtonRadiusPx: number;
    modeCardRadiusPx: number;
    /** Distribution of border-radius values → frequency */
    borderRadiusDistribution: Record<string, number>;
  };
  motionConsensus: {
    dominantLevel: 'minimal' | 'subtle' | 'expressive';
    avgTransitionMs: number;
    levelDistribution: Record<'minimal' | 'subtle' | 'expressive', number>;
  };
  /**
   * Ready-to-use CSS custom properties derived from consensus.
   * Keys are without '--' prefix (e.g. 'color-primary': '#1a2b3c').
   */
  cssVariables: Record<string, string>;
}

/**
 * Deliverable 2 — Layout Structures
 * DB: golden_reference_outputs WHERE deliverable_type = 'layouts'
 */
export interface GoldenLayoutsOutput {
  deliverableType: 'layouts';
  subIndustryKey: SubIndustryKey;
  generatedAt: string;
  sampleCount: number;
  gnbConsensus: GoldenGnbConsensus;
  shellConsensus: {
    avgMaxWidthPx: number;
    dominantColumnLayout: 'single' | 'two_column' | 'three_column' | 'asymmetric';
    sidebarRatio: number;
  };
  footerConsensus: {
    avgColumnCount: number;
    socialLinksRatio: number;
    newsletterRatio: number;
    topLinkGroups: string[];
  };
  heroConsensus: {
    dominantLayout: 'full_bleed' | 'split' | 'centered' | 'minimal';
    dominantBgType: 'image' | 'video' | 'gradient' | 'solid';
    avgCtaCount: number;
    subtaglineRatio: number;
    avgViewportHeight: number;
  };
}

/**
 * Deliverable 3 — Section Sequences
 * DB: golden_reference_outputs WHERE deliverable_type = 'sections'
 */
export interface GoldenSectionsOutput {
  deliverableType: 'sections';
  subIndustryKey: SubIndustryKey;
  generatedAt: string;
  sampleCount: number;
  sectionConsensus: GoldenSectionConsensus;
  /** Ready-to-use recommended homepage section order */
  recommendedHomepageSequence: Array<{
    position: number;
    type: SectionType;
    psychologyLayer: PsychologyLayer;
    /** true = present in ≥80% of sampled sites */
    mandatory: boolean;
    reason: string;
  }>;
  /** Required sub-pages by prevalence ratio */
  requiredSubPages: Array<{
    path: string;
    pageRole: PageSectionAnalysis['pageRole'];
    prevalenceRatio: number;
  }>;
}

/**
 * Deliverable 4 — Content Patterns
 * DB: golden_reference_outputs WHERE deliverable_type = 'content'
 */
export interface GoldenContentOutput {
  deliverableType: 'content';
  subIndustryKey: SubIndustryKey;
  generatedAt: string;
  sampleCount: number;
  heroCopyConsensus: {
    topHeadlinePatterns: Array<{ pattern: string; frequency: number }>;
    avgWordCountRange: { min: number; max: number };
    subtaglineRatio: number;
  };
  faqConsensus: {
    topQuestionTypes: Array<{
      type: string;
      frequency: number;
      exampleQuestion: string;
    }>;
    avgFaqCount: number;
    /** Distribution over 'json-ld' | 'dl-dt-dd' | 'heading-paragraph' */
    sourceDistribution: Record<string, number>;
  };
  trustElementConsensus: {
    topTypes: Array<{
      type: TrustElement['type'];
      frequency: number;
      exampleText: string;
    }>;
    /** Proportion of sites using Answer-First heading structure */
    answerFirstRatio: number;
  };
  contentStrategy: {
    consensusPsychologyFlow: PsychologyLayer[];
    mustIncludeElements: string[];
    mustAvoidPatterns: string[];
  };
}

/**
 * Deliverable 5 — Image Patterns
 * DB: golden_reference_outputs WHERE deliverable_type = 'images'
 */
export interface GoldenImagesOutput {
  deliverableType: 'images';
  subIndustryKey: SubIndustryKey;
  generatedAt: string;
  sampleCount: number;
  heroImageConsensus: {
    dominantType: ImageType;
    humanRatio: number;
    avgAspectRatio: number | null;
    /** Top 3 hero image src patterns (URL path hints) */
    topSrcPatterns: string[];
  };
  overallImageConsensus: {
    avgTotalImages: number;
    typeDistribution: Partial<Record<ImageType, number>>;
    antiPatternPrevalence: Array<{
      issue: ImageAntiPattern['issue'];
      ratio: number;
    }>;
  };
  imageChecklist: string[];
  minRecommendedImageCount: number;
}

/**
 * Deliverable 6 — Quality Thresholds
 * DB: golden_reference_outputs WHERE deliverable_type = 'quality'
 */
export interface GoldenQualityOutput {
  deliverableType: 'quality';
  subIndustryKey: SubIndustryKey;
  generatedAt: string;
  sampleCount: number;
  /** A- grade (P75) thresholds derived from consensus */
  aMinusThresholds: {
    minSectionCount: number;
    minFaqCount: number;
    minImageCount: number;
    minTrustElements: number;
    heroCtaRequired: boolean;
  };
  /** Sections present in ≥80% of sampled sites */
  mandatorySections: SectionType[];
  /** Sections present in 50–79% of sampled sites */
  recommendedSections: SectionType[];
  /** Psychology layer completeness: which layers appear in ≥60% of sites */
  requiredPsychologyLayers: PsychologyLayer[];
  /** Safety gate level for the industry */
  safetyGate: 'medical' | 'financial' | 'standard';
  expectedLayer: {
    mustInclude: string[];
    mustNotDo: string[];
  };
}

/**
 * All 6 deliverables bundled.
 * Returned by GoldenJsonBuilder.buildAll().
 */
export interface GoldenReferenceOutput {
  tokens: GoldenTokensOutput;
  layouts: GoldenLayoutsOutput;
  sections: GoldenSectionsOutput;
  content: GoldenContentOutput;
  images: GoldenImagesOutput;
  quality: GoldenQualityOutput;
}

// ═══════════════════════════════════════════════════════════════
// Section B-3: Batch analysis state management
// ═══════════════════════════════════════════════════════════════

export type BatchAnalysisStage =
  | 'idle'
  | 'crawling'
  | 'analyzing'
  | 'aggregating'
  | 'building'
  | 'saving'
  | 'complete'
  | 'failed';

export interface SiteAnalysisResult {
  url: string;
  brand_name: string;
  positioning: GoldenPositioning;
  success: boolean;
  error?: string;
  /** Wall-clock time in ms */
  durationMs: number;
  snapshot?: VisualAnalysisSnapshot;
}

/**
 * Real-time state for a running batch analysis job.
 */
export interface BatchAnalysisState {
  subIndustryKey: SubIndustryKey;
  stage: BatchAnalysisStage;
  totalSites: number;
  completedSites: number;
  failedSites: number;
  currentUrl?: string;
  /** ISO 8601 */
  startedAt: string;
  /** ISO 8601 */
  estimatedCompletionAt?: string;
  message: string;
  error?: string;
}

/**
 * Final result of a completed batch analysis run.
 */
export interface BatchAnalysisResult {
  subIndustryKey: SubIndustryKey;
  success: boolean;
  siteResults: SiteAnalysisResult[];
  successCount: number;
  failureCount: number;
  output?: GoldenReferenceOutput;
  /** Total wall-clock time in ms */
  totalDurationMs: number;
  /** ISO 8601 */
  completedAt: string;
  analysisVersion: string;
}

// ═══════════════════════════════════════════════════════════════
// Section B-4: DB record types (Supabase row mapping)
// ═══════════════════════════════════════════════════════════════

/** Row type for public.golden_visual_snapshots */
export interface GoldenVisualSnapshotRecord {
  id: string;
  sub_industry_key: string;
  url: string;
  brand_name: string;
  positioning: GoldenPositioning;
  design_tokens: DesignTokenSnapshot | null;
  layout_structure: LayoutStructureSnapshot | null;
  section_sequence: SectionSequenceSnapshot | null;
  content_templates: ContentTemplateSnapshot | null;
  image_references: ImageReferenceSnapshot | null;
  vibe_vector: Record<string, number> | null;
  analyzed_at: string;
  analysis_version: string;
  created_at: string;
}

/** Row type for public.golden_reference_outputs */
export interface GoldenReferenceOutputRecord {
  id: string;
  sub_industry_key: string;
  deliverable_type: keyof GoldenReferenceOutput;
  output_data:
    | GoldenTokensOutput
    | GoldenLayoutsOutput
    | GoldenSectionsOutput
    | GoldenContentOutput
    | GoldenImagesOutput
    | GoldenQualityOutput;
  sample_count: number;
  generated_at: string;
}
