export interface SchemaAuditItem {
  schemaType: string;
  sourceUrl: string;
  completeness: number; // 0-100
  missingRequired: string[];
  missingRecommended: string[];
  warnings: string[];
}

export interface OGCompletenessResult {
  hasOgTitle: boolean;
  hasOgDescription: boolean;
  hasOgImage: boolean;
  hasOgType: boolean;
  hasOgUrl: boolean;
  completenessScore: number; // 0-100
  perPageScores: { url: string; score: number }[];
}

export interface MetaTagAuditResult {
  titleOptimization: { url: string; title: string; length: number; hasBrand: boolean; score: number }[];
  descriptionQuality: { url: string; desc: string; length: number; score: number }[];
  authorPresent: number; // percentage of pages with author metadata
  robotsDirectives: { url: string; content: string; isNoindex: boolean }[];
  canonicalStatus: { url: string; canonical: string | null; isSelfReferencing: boolean }[];
}

export interface SchemaIssue {
  severity: 'critical' | 'warning' | 'info';
  schemaType: string;
  property: string;
  message: string;
  recommendation: string;
  sourceUrl: string;
}

export interface SchemaQualityAuditResult {
  organizationSchema: SchemaAuditItem | null;
  localBusinessSchema: SchemaAuditItem | null;
  faqPageSchemas: SchemaAuditItem[];
  howToSchemas: SchemaAuditItem[];
  productSchemas: SchemaAuditItem[];
  articleSchemas: SchemaAuditItem[];
  breadcrumbSchemas: SchemaAuditItem[];
  aggregateRatingSchemas: SchemaAuditItem[];
  otherSchemas: SchemaAuditItem[];
  orgSameAsProfiles: { platform: string; url: string }[];
  orgLogoPresent: boolean;
  orgContactPresent: boolean;
  ogCompleteness: OGCompletenessResult;
  metaTagAudit: MetaTagAuditResult;
  schemaQualityScore: number;
  schemaTypeCount: number;
  schemaCoverage: number;
  issues: SchemaIssue[];
}

import { CrawledPage } from './website-crawler';

export class SchemaQualityAuditor {
  static audit(pages: CrawledPage[]): SchemaQualityAuditResult {
    const issues: SchemaIssue[] = [];
    
    let organizationSchema: SchemaAuditItem | null = null;
    let localBusinessSchema: SchemaAuditItem | null = null;
    const faqPageSchemas: SchemaAuditItem[] = [];
    const howToSchemas: SchemaAuditItem[] = [];
    const productSchemas: SchemaAuditItem[] = [];
    const articleSchemas: SchemaAuditItem[] = [];
    const breadcrumbSchemas: SchemaAuditItem[] = [];
    const aggregateRatingSchemas: SchemaAuditItem[] = [];
    const otherSchemas: SchemaAuditItem[] = [];

    let orgLogoPresent = false;
    let orgContactPresent = false;
    const orgSameAsProfiles: { platform: string; url: string }[] = [];

    let pagesWithSchemas = 0;
    const uniqueSchemaTypes = new Set<string>();

    // Helper to find schema object of type recursively
    function findSchemas(obj: any, type: string, foundList: any[] = []) {
      if (!obj) return;
      if (Array.isArray(obj)) {
        for (const item of obj) findSchemas(item, type, foundList);
      } else if (typeof obj === 'object') {
        const typeVal = obj['@type'] || obj['type'];
        if (typeof typeVal === 'string' && typeVal.toLowerCase() === type.toLowerCase()) {
          foundList.push(obj);
        }
        for (const prop in obj) {
          if (prop !== '@type' && prop !== 'type') {
            findSchemas(obj[prop], type, foundList);
          }
        }
      }
    }

    // Traverse all pages and schemas
    for (const page of pages) {
      const pageSchemas = page.schemas || [];
      if (pageSchemas.length > 0) {
        pagesWithSchemas++;
      }

      for (const rawSchema of pageSchemas) {
        // Collect types
        if (typeof rawSchema === 'object' && rawSchema !== null) {
          const mainType = rawSchema['@type'] || rawSchema['type'];
          if (typeof mainType === 'string') uniqueSchemaTypes.add(mainType);
        }

        // 1. Organization Schema
        const orgs: any[] = [];
        findSchemas(rawSchema, 'Organization', orgs);
        for (const org of orgs) {
          const req = ['name', 'url'];
          const rec = ['logo', 'sameAs', 'contactPoint', 'description'];
          const audit = auditFields('Organization', req, rec, org, page.url);
          organizationSchema = audit;
          
          if (org.logo) orgLogoPresent = true;
          if (org.contactPoint || org.telephone) orgContactPresent = true;
          
          if (Array.isArray(org.sameAs)) {
            for (const profileUrl of org.sameAs) {
              if (typeof profileUrl === 'string') {
                let platform = 'Social Profile';
                if (profileUrl.includes('linkedin.com')) platform = 'LinkedIn';
                else if (profileUrl.includes('facebook.com')) platform = 'Facebook';
                else if (profileUrl.includes('instagram.com')) platform = 'Instagram';
                else if (profileUrl.includes('youtube.com')) platform = 'YouTube';
                else if (profileUrl.includes('wikipedia.org')) platform = 'Wikipedia';
                else if (profileUrl.includes('twitter.com') || profileUrl.includes('x.com')) platform = 'Twitter';
                
                if (!orgSameAsProfiles.some(p => p.url === profileUrl)) {
                  orgSameAsProfiles.push({ platform, url: profileUrl });
                }
              }
            }
          }
        }

        // 2. LocalBusiness Schema
        const lbs: any[] = [];
        findSchemas(rawSchema, 'LocalBusiness', lbs);
        for (const lb of lbs) {
          const req = ['name', 'address'];
          const rec = ['telephone', 'openingHours', 'geo', 'priceRange'];
          localBusinessSchema = auditFields('LocalBusiness', req, rec, lb, page.url);
        }

        // 3. FAQPage Schema
        const faqs: any[] = [];
        findSchemas(rawSchema, 'FAQPage', faqs);
        for (const faq of faqs) {
          const req = ['mainEntity'];
          const audit = auditFields('FAQPage', req, [], faq, page.url);
          faqPageSchemas.push(audit);
        }

        // 4. HowTo Schema
        const howtos: any[] = [];
        findSchemas(rawSchema, 'HowTo', howtos);
        for (const howto of howtos) {
          const req = ['name', 'step'];
          const rec = ['image', 'totalTime', 'estimatedCost'];
          howToSchemas.push(auditFields('HowTo', req, rec, howto, page.url));
        }

        // 5. Product Schema
        const products: any[] = [];
        findSchemas(rawSchema, 'Product', products);
        for (const prod of products) {
          const req = ['name'];
          const rec = ['brand', 'offers', 'aggregateRating', 'sku', 'image'];
          productSchemas.push(auditFields('Product', req, rec, prod, page.url));
        }

        // 6. Article Schema
        const articles: any[] = [];
        findSchemas(rawSchema, 'Article', articles);
        findSchemas(rawSchema, 'NewsArticle', articles);
        findSchemas(rawSchema, 'BlogPosting', articles);
        for (const art of articles) {
          const req = ['headline', 'author'];
          const rec = ['datePublished', 'dateModified', 'publisher', 'image'];
          articleSchemas.push(auditFields('Article', req, rec, art, page.url));
        }

        // 7. BreadcrumbList Schema
        const breadcrumbs: any[] = [];
        findSchemas(rawSchema, 'BreadcrumbList', breadcrumbs);
        for (const bc of breadcrumbs) {
          const req = ['itemListElement'];
          breadcrumbSchemas.push(auditFields('BreadcrumbList', req, [], bc, page.url));
        }

        // 8. AggregateRating Schema
        const ratings: any[] = [];
        findSchemas(rawSchema, 'AggregateRating', ratings);
        for (const rating of ratings) {
          const req = ['ratingValue', 'bestRating', 'worstRating', 'ratingCount'];
          aggregateRatingSchemas.push(auditFields('AggregateRating', req, [], rating, page.url));
        }
      }
    }

    // B8 수정: Microdata (itemscope/itemtype) 및 RDFa 감지 — JSON-LD 없는 사이트 보완
    let microdataTypeCount = 0;
    let pagesWithMicrodata = 0;
    for (const page of pages) {
      const rawHtml = page.rawHtml || '';
      const microdataRegex = /itemtype=["']https?:\/\/schema\.org\/([^"']+)["']/gi;
      let mdMatch;
      let pageHasMicrodata = false;
      while ((mdMatch = microdataRegex.exec(rawHtml)) !== null) {
        uniqueSchemaTypes.add(mdMatch[1]);
        microdataTypeCount++;
        pageHasMicrodata = true;
      }
      if (pageHasMicrodata) pagesWithMicrodata++;
    }

    function auditFields(type: string, required: string[], recommended: string[], obj: any, url: string): SchemaAuditItem {
      const missingRequired: string[] = [];
      const missingRecommended: string[] = [];
      const warnings: string[] = [];

      for (const r of required) {
        if (obj[r] === undefined || obj[r] === null || obj[r] === '') {
          missingRequired.push(r);
          issues.push({
            severity: 'critical',
            schemaType: type,
            property: r,
            message: `Missing required schema property '${r}' in ${type}`,
            recommendation: `Add '${r}' attribute to JSON-LD ${type} schema.`,
            sourceUrl: url
          });
        }
      }

      for (const r of recommended) {
        if (obj[r] === undefined || obj[r] === null || obj[r] === '') {
          missingRecommended.push(r);
          issues.push({
            severity: 'warning',
            schemaType: type,
            property: r,
            message: `Missing recommended schema property '${r}' in ${type}`,
            recommendation: `Add '${r}' attribute to JSON-LD ${type} schema for better AI understanding.`,
            sourceUrl: url
          });
        }
      }

      const totalFields = required.length + recommended.length;
      const foundFields = totalFields - missingRequired.length - missingRecommended.length;
      const completeness = totalFields > 0 ? Math.round((foundFields / totalFields) * 100) : 100;

      return {
        schemaType: type,
        sourceUrl: url,
        completeness,
        missingRequired,
        missingRecommended,
        warnings
      };
    }

    // OG Completeness
    let totalOgScore = 0;
    const ogPerPageScores = pages.map(page => {
      const og = page.ogMetadata || {};
      const fields = ['title', 'description', 'image', 'type', 'url'];
      let foundCount = 0;
      for (const f of fields) {
        if (og[f]) foundCount++;
      }
      const score = Math.round((foundCount / fields.length) * 100);
      totalOgScore += score;
      return { url: page.url, score };
    });
    
    const ogCompletenessScore = pages.length > 0 ? Math.round(totalOgScore / pages.length) : 0;
    const firstPageOg = pages[0]?.ogMetadata || {};
    
    const ogCompleteness: OGCompletenessResult = {
      hasOgTitle: !!firstPageOg.title,
      hasOgDescription: !!firstPageOg.description,
      hasOgImage: !!firstPageOg.image,
      hasOgType: !!firstPageOg.type,
      hasOgUrl: !!firstPageOg.url,
      completenessScore: ogCompletenessScore,
      perPageScores: ogPerPageScores
    };

    // Meta Tag Audit
    const titleOptimization = pages.map(page => {
      const title = page.title || '';
      const length = title.length;
      const hasBrand = length > 0 && (title.includes('BSW') || length > 15); // dummy brand check or match length
      let score = 100;
      if (length === 0) {
        score = 0;
        issues.push({
          severity: 'critical',
          schemaType: 'Meta',
          property: 'title',
          message: 'Missing title tag',
          recommendation: 'Add a descriptive <title> tag to this page.',
          sourceUrl: page.url
        });
      } else if (length < 10) {
        score = 50;
        issues.push({
          severity: 'warning',
          schemaType: 'Meta',
          property: 'title',
          message: `Title too short (${length} chars)`,
          recommendation: 'Expand the title to 10-60 characters with rich semantic terms.',
          sourceUrl: page.url
        });
      } else if (length > 70) {
        score = 70;
        issues.push({
          severity: 'warning',
          schemaType: 'Meta',
          property: 'title',
          message: `Title too long (${length} chars)`,
          recommendation: 'Keep title tags under 60-70 characters to avoid truncation.',
          sourceUrl: page.url
        });
      }
      return { url: page.url, title, length, hasBrand, score };
    });

    const descriptionQuality = pages.map(page => {
      const desc = page.metaDescription || '';
      const length = desc.length;
      let score = 100;
      if (length === 0) {
        score = 0;
        issues.push({
          severity: 'critical',
          schemaType: 'Meta',
          property: 'description',
          message: 'Missing meta description',
          recommendation: 'Add a meta description between 120-160 characters summarizing the page.',
          sourceUrl: page.url
        });
      } else if (length < 50) {
        score = 40;
        issues.push({
          severity: 'warning',
          schemaType: 'Meta',
          property: 'description',
          message: `Meta description too short (${length} chars)`,
          recommendation: 'Provide a richer semantic summary between 120-160 characters.',
          sourceUrl: page.url
        });
      } else if (length > 200) {
        score = 70;
        issues.push({
          severity: 'warning',
          schemaType: 'Meta',
          property: 'description',
          message: `Meta description too long (${length} chars)`,
          recommendation: 'Shorten the meta description to under 160 characters.',
          sourceUrl: page.url
        });
      }
      return { url: page.url, desc, length, score };
    });

    let authorPages = 0;
    const robotsDirectives = pages.map(page => {
      if (page.metaAuthor) authorPages++;
      const isNoindex = !!(page.metaRobots && page.metaRobots.toLowerCase().includes('noindex'));
      return { url: page.url, content: page.metaRobots || '', isNoindex };
    });

    const authorCoverage = pages.length > 0 ? Math.round((authorPages / pages.length) * 100) : 0;
    if (pages.length > 0 && authorCoverage === 0) {
      issues.push({
        severity: 'info',
        schemaType: 'Meta',
        property: 'author',
        message: 'Author meta tags missing on all pages',
        recommendation: 'Add <meta name="author"> to content pages to establish E-E-A-T credentials.',
        sourceUrl: pages[0].url
      });
    }

    const canonicalStatus = pages.map(page => {
      const isSelfReferencing = !!(page.canonical && page.canonical === page.url);
      return { url: page.url, canonical: page.canonical || null, isSelfReferencing };
    });

    const metaTagAudit: MetaTagAuditResult = {
      titleOptimization,
      descriptionQuality,
      authorPresent: authorCoverage,
      robotsDirectives,
      canonicalStatus
    };

    // Calculate overall Schema Quality Score
    // B8: JSON-LD + Microdata 합산
    const totalPagesWithStructuredData = Math.min(pages.length, pagesWithSchemas + pagesWithMicrodata);
    const schemaCoverage = pages.length > 0 ? Math.round((totalPagesWithStructuredData / pages.length) * 100) : 0;
    
    // Schema availability & completeness
    let schemaCount = 0;
    let schemaScoreSum = 0;

    const list = [organizationSchema, localBusinessSchema, ...faqPageSchemas, ...howToSchemas, ...productSchemas, ...articleSchemas, ...breadcrumbSchemas, ...aggregateRatingSchemas];
    for (const item of list) {
      if (item) {
        schemaCount++;
        schemaScoreSum += item.completeness;
      }
    }
    
    const avgSchemaCompletenessScore = schemaCount > 0 
      ? schemaScoreSum / schemaCount 
      : (microdataTypeCount > 0 ? 40 : 0); // B8: Microdata가 있으면 최소 40
    
    // Weights: 40% avg schema completeness + 20% schema coverage + 25% OG completeness + 15% title/desc meta tags
    const avgTitleScore = titleOptimization.reduce((sum, item) => sum + item.score, 0) / (pages.length || 1);
    const avgDescScore = descriptionQuality.reduce((sum, item) => sum + item.score, 0) / (pages.length || 1);
    const metaScore = (avgTitleScore + avgDescScore) / 2;

    const schemaQualityScore = Math.round(
      (avgSchemaCompletenessScore * 0.4) +
      (schemaCoverage * 0.2) +
      (ogCompletenessScore * 0.25) +
      (metaScore * 0.15)
    );

    return {
      organizationSchema,
      localBusinessSchema,
      faqPageSchemas,
      howToSchemas,
      productSchemas,
      articleSchemas,
      breadcrumbSchemas,
      aggregateRatingSchemas,
      otherSchemas,
      orgSameAsProfiles,
      orgLogoPresent,
      orgContactPresent,
      ogCompleteness,
      metaTagAudit,
      schemaQualityScore,
      schemaTypeCount: uniqueSchemaTypes.size,
      schemaCoverage,
      issues
    };
  }
}
