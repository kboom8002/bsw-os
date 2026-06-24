export interface EEATQuadScore {
  experience: number;
  expertise: number;
  authoritativeness: number;
  trustworthiness: number;
  overall: number;
  signals: { axis: string; signal: string; found: boolean; source: string }[];
}

export interface AnswerFirstScore {
  pageUrl: string;
  firstSentenceLength: number;
  first100WordsContainAnswer: boolean;
  questionInHeading: boolean;
  directAnswerScore: number;
}

export interface FreshnessAnalysis {
  averageAgeDays: number;
  freshContentRatio: number;
  stalestPage: { url: string; lastModified: string; ageDays: number } | null;
  newestPage: { url: string; lastModified: string; ageDays: number } | null;
  freshnessScore: number;
  perPageFreshness: { url: string; datePublished?: string; dateModified?: string; ageDays: number }[];
}

export interface TopicCluster {
  hubPage: string;
  hubTopic: string;
  spokePages: string[];
  internalLinkDensity: number;
  topicalAuthority: number;
}

export interface MultimediaAudit {
  totalImages: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  altTextQualityScore: number;
  videoCount: number;
  hasEmbeddedVideo: boolean;
  multimediaScore: number;
}

export interface CitationNetworkResult {
  totalOutboundLinks: number;
  uniqueExternalDomains: number;
  authorityDomainRatio: number; // percentage
  nofollowRatio: number; // percentage
  citationQualityScore: number;
  topCitedDomains: { domain: string; count: number; isAuthority: boolean }[];
}

export interface InternalLinkTopology {
  totalInternalLinks: number;
  orphanPages: string[];
  hubPages: { url: string; inboundCount: number }[];
  averageLinksPerPage: number;
  maxDepth: number;
  topologyScore: number;
}

export interface ContentIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'eeat' | 'answer_first' | 'freshness' | 'structure' | 'originality';
  title: string;
  description: string;
  recommendation: string;
  affectedUrls?: string[];
}

export interface ContentSemanticResult {
  eeat: EEATQuadScore;
  answerFirstScores: AnswerFirstScore[];
  freshnessAnalysis: FreshnessAnalysis;
  topicClusters: TopicCluster[];
  quantitativeDataDensity: number;
  multimediaAudit: MultimediaAudit;
  citationNetwork: CitationNetworkResult;
  originalityScore: number;
  internalLinkTopology: InternalLinkTopology;
  contentSemanticScore: number;
  issues: ContentIssue[];
}

import { CrawledPage } from './website-crawler';

export class ContentSemanticAnalyzer {
  static analyze(pages: CrawledPage[], httpsEnabled = false, orgSameAsCount = 0): ContentSemanticResult {
    const issues: ContentIssue[] = [];
    const now = new Date();

    // 1. E-E-A-T Quad Score
    const eeatSignals: { axis: string; signal: string; found: boolean; source: string }[] = [];
    
    // experience signals
    let expReviews = false;
    let expRatingSchema = false;
    let expFirstPerson = false;
    let expProductImg = false;
    
    // expertise signals
    let extAuthorMeta = false;
    let extAuthorLink = false;
    let extDegreeKeywords = false;
    let extArticleSchema = false;

    // authority signals
    let autSameAs = orgSameAsCount > 0;
    let autHighOutbound = false;
    let autAwards = false;

    // trust signals
    let truHttps = httpsEnabled;
    let truPrivacy = false;
    let truContact = false;
    let truRefund = false;

    // Check all pages for signals
    for (const page of pages) {
      const text = page.bodyText || '';
      const html = page.rawHtml || '';
      
      // Experience
      if (!expReviews && (text.includes('후기') || text.includes('리뷰') || text.includes('review') || text.includes('testimonial'))) {
        expReviews = true;
      }
      if (!expRatingSchema && (page.schemas || []).some(s => JSON.stringify(s).includes('AggregateRating') || JSON.stringify(s).includes('Review'))) {
        expRatingSchema = true;
      }
      if (!expFirstPerson && (text.includes('사용해보니') || text.includes('직접') || text.includes('경험') || text.includes('내돈내산') || text.includes('체험'))) {
        expFirstPerson = true;
      }
      if (!expProductImg && (page.images || []).some(img => (img.alt || '').includes('제품') || (img.alt || '').includes('product') || (img.alt || '').length > 5)) {
        expProductImg = true;
      }

      // Expertise
      if (!extAuthorMeta && page.metaAuthor) {
        extAuthorMeta = true;
      }
      if (!extAuthorLink && (page.internalLinks || []).some(l => l.href.includes('/author/') || l.href.includes('/profile/') || l.text.includes('프로필') || l.text.includes('작가'))) {
        extAuthorLink = true;
      }
      if (!extDegreeKeywords && (text.includes('PhD') || text.includes('MD') || text.includes('전문의') || text.includes('자격증') || text.includes('학위') || text.includes('연구원') || text.includes('전문가'))) {
        extDegreeKeywords = true;
      }
      if (!extArticleSchema && (page.schemas || []).some(s => JSON.stringify(s).includes('Article') || JSON.stringify(s).includes('NewsArticle') || JSON.stringify(s).includes('BlogPosting'))) {
        extArticleSchema = true;
      }

      // Authority
      if (!autHighOutbound) {
        const outbound = page.outboundLinks || [];
        const govEduCount = outbound.filter(l => l.href.includes('.gov') || l.href.includes('.edu') || l.href.includes('wikipedia.org')).length;
        if (govEduCount > 0) {
          autHighOutbound = true;
        }
      }
      if (!autAwards && (text.includes('award') || text.includes('ISO') || text.includes('certified') || text.includes('수상') || text.includes('인증') || text.includes('특허'))) {
        autAwards = true;
      }

      // Trust
      if (!truPrivacy && (page.internalLinks || []).some(l => l.href.includes('/privacy') || l.href.includes('/terms') || l.text.includes('개인정보') || l.text.includes('이용약관'))) {
        truPrivacy = true;
      }
      if (!truContact && (text.includes('고객센터') || text.includes('전화번호') || text.includes('이메일') || text.includes('02-') || text.includes('070-') || text.includes('0507-') || text.includes('주소'))) {
        truContact = true;
      }
      if (!truRefund && (text.includes('refund') || text.includes('warranty') || text.includes('환불') || text.includes('보증') || text.includes('AS') || text.includes('A/S'))) {
        truRefund = true;
      }
    }

    eeatSignals.push({ axis: 'Experience', signal: 'Reviews/Testimonials keywords', found: expReviews, source: 'Page body text' });
    eeatSignals.push({ axis: 'Experience', signal: 'Review/AggregateRating Schema', found: expRatingSchema, source: 'JSON-LD schema' });
    eeatSignals.push({ axis: 'Experience', signal: 'First-person narratives', found: expFirstPerson, source: 'Page body text' });
    eeatSignals.push({ axis: 'Experience', signal: 'Product images with descriptions', found: expProductImg, source: 'Image alt tags' });

    eeatSignals.push({ axis: 'Expertise', signal: 'Author meta tags', found: extAuthorMeta, source: 'Meta author' });
    eeatSignals.push({ axis: 'Expertise', signal: 'Author profile pages link', found: extAuthorLink, source: 'Internal links' });
    eeatSignals.push({ axis: 'Expertise', signal: 'Degree/Certification keywords', found: extDegreeKeywords, source: 'Page body text' });
    eeatSignals.push({ axis: 'Expertise', signal: 'Article author schema', found: extArticleSchema, source: 'JSON-LD schema' });

    eeatSignals.push({ axis: 'Authoritativeness', signal: 'Organization sameAs profiles', found: autSameAs, source: 'Organization schema' });
    eeatSignals.push({ axis: 'Authoritativeness', signal: 'Citations to Gov/Edu/Wikipedia', found: autHighOutbound, source: 'Outbound links' });
    eeatSignals.push({ axis: 'Authoritativeness', signal: 'Awards/Recognition keywords', found: autAwards, source: 'Page body text' });

    eeatSignals.push({ axis: 'Trustworthiness', signal: 'SSL / HTTPS connection', found: truHttps, source: 'URL scheme' });
    eeatSignals.push({ axis: 'Trustworthiness', signal: 'Privacy Policy/Terms link', found: truPrivacy, source: 'Internal links' });
    eeatSignals.push({ axis: 'Trustworthiness', signal: 'Contact info/Customer service', found: truContact, source: 'Page body text' });
    eeatSignals.push({ axis: 'Trustworthiness', signal: 'Refund/Warranty policies', found: truRefund, source: 'Page body text' });

    // Calculate subscores
    const expScore = (expReviews ? 25 : 0) + (expRatingSchema ? 25 : 0) + (expFirstPerson ? 30 : 0) + (expProductImg ? 20 : 0);
    const extScore = (extAuthorMeta ? 25 : 0) + (extAuthorLink ? 25 : 0) + (extDegreeKeywords ? 25 : 0) + (extArticleSchema ? 25 : 0);
    const autScore = (autSameAs ? 40 : 0) + (autHighOutbound ? 30 : 0) + (autAwards ? 30 : 0);
    const truScore = (truHttps ? 30 : 0) + (truPrivacy ? 25 : 0) + (truContact ? 25 : 0) + (truRefund ? 20 : 0);

    const eeatOverall = Math.round((expScore + extScore + autScore + truScore) / 4);

    if (expScore < 50) {
      issues.push({
        severity: 'warning',
        category: 'eeat',
        title: 'Weak Experience Signals',
        description: 'AI engines look for first-person experience signals (e.g., UGC reviews, personal usage descriptions). Currently, these are missing or sparse.',
        recommendation: 'Add genuine customer testimonial sections and write details expressing direct product/service experiences.'
      });
    }
    if (extScore < 50) {
      issues.push({
        severity: 'critical',
        category: 'eeat',
        title: 'Missing E-E-A-T Expert Profiles',
        description: 'No clear author attribution or expert credentials found. AI search engines may not trust information written by anonymous organizations.',
        recommendation: 'Add author biographies, links to expert credentials (LinkedIn/degrees), and Article schema with explicit author properties.'
      });
    }

    // 2. Answer-First Style Analysis
    const answerFirstScores: AnswerFirstScore[] = pages.map(page => {
      const text = page.bodyText || '';
      
      // First sentence length
      const firstSentence = text.split(/[.?!]/)[0] || '';
      const firstSentenceLength = firstSentence.split(/\s+/).filter(w => w.length > 0).length;
      
      // First 100 words answer presence
      const first100 = text.split(/\s+/).slice(0, 100).join(' ').toLowerCase();
      const first100WordsContainAnswer = first100.includes('은') || first100.includes('는') || first100.includes('이다') || first100.includes('is') || first100.includes('are') || first100.includes('refers to') || first100.includes('정의') || first100.includes('뜻한다');
      
      // Question in Heading
      const questionInHeading = (page.headings || []).some(h => h.text.includes('?') || h.text.includes('어떻게') || h.text.includes('왜') || h.text.includes('무엇') || h.text.includes('how') || h.text.includes('why') || h.text.includes('what'));
      
      // Compute score
      let directAnswerScore = 50;
      if (firstSentenceLength > 0 && firstSentenceLength <= 15) directAnswerScore += 20;
      if (first100WordsContainAnswer) directAnswerScore += 20;
      if (questionInHeading) directAnswerScore += 10;
      
      return {
        pageUrl: page.url,
        firstSentenceLength,
        first100WordsContainAnswer,
        questionInHeading,
        directAnswerScore
      };
    });

    const answerFirstAvgScore = answerFirstScores.length > 0
      ? Math.round(answerFirstScores.reduce((sum, item) => sum + item.directAnswerScore, 0) / answerFirstScores.length)
      : 0;

    const longFirstSentences = answerFirstScores.filter(s => s.firstSentenceLength > 25);
    if (longFirstSentences.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'answer_first',
        title: 'Long introduction sentences detected',
        description: 'First sentences on several pages exceed 25 words. AI crawlers favor concise, "Answer-First" statements to display in zero-click answers.',
        recommendation: 'Rewrite introduction paragraphs. State the direct answer or definition in the very first sentence, keeping it under 15 words.',
        affectedUrls: longFirstSentences.map(s => s.pageUrl)
      });
    }

    // 3. Freshness Analysis
    const perPageFreshness = pages.map(page => {
      const dateStr = page.dateModified || page.datePublished;
      let ageDays = 180; // default to old if not specified
      
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          const diffMs = now.getTime() - date.getTime();
          ageDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        } catch (_) {}
      }
      return {
        url: page.url,
        datePublished: page.datePublished,
        dateModified: page.dateModified,
        ageDays
      };
    });

    const validAges = perPageFreshness.filter(f => f.dateModified || f.datePublished);
    const averageAgeDays = validAges.length > 0
      ? Math.round(validAges.reduce((sum, item) => sum + item.ageDays, 0) / validAges.length)
      : 180;

    const freshPages = perPageFreshness.filter(f => f.ageDays <= 90);
    const freshContentRatio = perPageFreshness.length > 0
      ? Math.round((freshPages.length / perPageFreshness.length) * 100)
      : 0;

    let stalestPage: { url: string; lastModified: string; ageDays: number } | null = null;
    let newestPage: { url: string; lastModified: string; ageDays: number } | null = null;

    if (validAges.length > 0) {
      const sorted = [...validAges].sort((a, b) => b.ageDays - a.ageDays);
      const st = sorted[0];
      const nw = sorted[sorted.length - 1];
      stalestPage = { url: st.url, lastModified: st.dateModified || st.datePublished || '', ageDays: st.ageDays };
      newestPage = { url: nw.url, lastModified: nw.dateModified || nw.datePublished || '', ageDays: nw.ageDays };
    }

    // Freshness Score (0-100)
    let freshnessScore = 50;
    if (averageAgeDays <= 30) freshnessScore = 100;
    else if (averageAgeDays <= 90) freshnessScore = 85;
    else if (averageAgeDays <= 180) freshnessScore = 65;
    else freshnessScore = 40;

    if (freshContentRatio < 30) {
      issues.push({
        severity: 'warning',
        category: 'freshness',
        title: 'Stale website content',
        description: 'Less than 30% of your pages have been modified or published within the last 90 days. AI search engines prefer fresh, active information.',
        recommendation: 'Update key landing pages, post regular blog updates, and ensure correct dateModified schema attributes are outputted.'
      });
    }

    // 4. Topic Clusters Discovery
    // Simple clustering logic based on internal links
    const topicClusters: TopicCluster[] = [];
    const inboundCounts: Record<string, number> = {};
    const linkMap: Record<string, string[]> = {};

    for (const page of pages) {
      linkMap[page.url] = (page.internalLinks || []).map(l => l.href);
      for (const link of page.internalLinks || []) {
        inboundCounts[link.href] = (inboundCounts[link.href] || 0) + 1;
      }
    }

    // Identify hubs: high inbound counts (at least 2 inbound links)
    const hubs = Object.keys(inboundCounts)
      .filter(url => inboundCounts[url] >= 2)
      .sort((a, b) => inboundCounts[b] - inboundCounts[a]);

    for (const hub of hubs) {
      // Spoke pages link to the hub
      const spokes = pages
        .filter(page => page.url !== hub && (page.internalLinks || []).some(l => l.href === hub))
        .map(page => page.url);
      
      if (spokes.length > 0) {
        // Derive a topic name from the hub page title
        const hubPage = pages.find(p => p.url === hub);
        const hubTopic = hubPage ? hubPage.title.split(/[-|]/)[0].trim() : 'Core Topic';
        
        const internalLinkDensity = Math.round((spokes.length / (pages.length - 1 || 1)) * 100);
        const topicalAuthority = Math.min(100, spokes.length * 20);

        topicClusters.push({
          hubPage: hub,
          hubTopic,
          spokePages: spokes,
          internalLinkDensity,
          topicalAuthority
        });
      }
    }

    if (topicClusters.length === 0 && pages.length > 3) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        title: 'No topic clusters found',
        description: 'Your internal linking structure is linear or fragmented. AI search engines construct brand knowledge graphs by traversing structured hub-and-spoke page link architectures.',
        recommendation: 'Establish high-authority "Hub" pages for core topics and link relevant detailed "Spoke" articles back to these hubs.'
      });
    }

    // 5. Quantitative Data Density
    let numbersCount = 0;
    let totalWords = 0;
    for (const page of pages) {
      const text = page.bodyText || '';
      const words = text.split(/\s+/);
      totalWords += words.length;
      for (const word of words) {
        // match numbers or percentages e.g. 95%, 10,000, 1.2
        if (/^\d+/.test(word) || word.includes('%')) {
          numbersCount++;
        }
      }
    }
    const quantitativeDataDensity = totalWords > 0 ? parseFloat(((numbersCount / totalWords) * 100).toFixed(2)) : 0;
    if (quantitativeDataDensity < 1) {
      issues.push({
        severity: 'info',
        category: 'originality',
        title: 'Low Quantitative Data Density',
        description: 'The content lacks structured numeric arguments or statistical facts. AI engines look for concrete quantitative data to extract as answer assertions.',
        recommendation: 'Include statistics, percentages, prices, dates, or specifications to ground your claims.'
      });
    }

    // 6. Multimedia Audit
    let totalImages = 0;
    let imagesWithAlt = 0;
    let videoCount = 0;
    for (const page of pages) {
      const imgs = page.images || [];
      totalImages += imgs.length;
      imagesWithAlt += imgs.filter(img => img.alt && img.alt.trim().length > 0).length;
      videoCount += (page.videos || []).length;
    }

    const imagesWithoutAlt = totalImages - imagesWithAlt;
    const altTextQualityScore = totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 100;
    const hasEmbeddedVideo = videoCount > 0;
    const multimediaScore = Math.round(
      (altTextQualityScore * 0.7) +
      (hasEmbeddedVideo ? 30 : 0)
    );

    if (imagesWithoutAlt > 0) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        title: `${imagesWithoutAlt} Images missing alt text`,
        description: 'AI engines indexing visual assets require alt descriptions to match images with relevant user search queries.',
        recommendation: 'Add descriptive alt attributes describing the image content to all image tags.'
      });
    }

    // 7. Outbound Citations Network
    let totalOutboundLinks = 0;
    const uniqueDomains = new Set<string>();
    let authorityDomainCount = 0;
    let nofollowCount = 0;

    for (const page of pages) {
      const outbound = page.outboundLinks || [];
      totalOutboundLinks += outbound.length;
      
      for (const link of outbound) {
        try {
          const urlObj = new URL(link.href);
          uniqueDomains.add(urlObj.host);
          
          if (urlObj.host.endsWith('.gov') || urlObj.host.endsWith('.edu') || urlObj.host.includes('wikipedia.org') || urlObj.host.includes('ncbi.nlm.nih.gov')) {
            authorityDomainCount++;
          }
        } catch (_) {}
        
        if (link.rel && link.rel.includes('nofollow')) {
          nofollowCount++;
        }
      }
    }

    const authorityDomainRatio = totalOutboundLinks > 0 ? Math.round((authorityDomainCount / totalOutboundLinks) * 100) : 0;
    const nofollowRatio = totalOutboundLinks > 0 ? Math.round((nofollowCount / totalOutboundLinks) * 100) : 0;
    
    // Top Cited Domains
    const domainCounts: Record<string, number> = {};
    for (const page of pages) {
      const outbound = page.outboundLinks || [];
      for (const link of outbound) {
        try {
          const host = new URL(link.href).host;
          domainCounts[host] = (domainCounts[host] || 0) + 1;
        } catch (_) {}
      }
    }

    const topCitedDomains = Object.entries(domainCounts)
      .map(([domain, count]) => {
        const isAuthority = domain.endsWith('.gov') || domain.endsWith('.edu') || domain.includes('wikipedia.org') || domain.includes('ncbi.nlm.nih.gov');
        return { domain, count, isAuthority };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    let citationQualityScore = 50;
    if (totalOutboundLinks > 0) {
      citationQualityScore = Math.min(100, 50 + (authorityDomainRatio * 2));
    }

    if (totalOutboundLinks > 0 && authorityDomainRatio === 0) {
      issues.push({
        severity: 'info',
        category: 'eeat',
        title: 'No Authority Citations Found',
        description: 'Your outbound links do not cite high-authority databases, scientific research, or government sites (.gov, .edu, Wikipedia).',
        recommendation: 'Anchor scientific or factual claims with outbound links to authority journals or databases.'
      });
    }

    // 8. Internal Link Topology
    let totalInternalLinks = 0;
    const pageInboundCount: Record<string, number> = {};
    
    for (const page of pages) {
      pageInboundCount[page.url] = 0;
    }
    
    for (const page of pages) {
      const internal = page.internalLinks || [];
      totalInternalLinks += internal.length;
      for (const link of internal) {
        if (pageInboundCount[link.href] !== undefined) {
          pageInboundCount[link.href]++;
        }
      }
    }

    const orphanPages = Object.keys(pageInboundCount).filter(url => pageInboundCount[url] === 0);
    const averageLinksPerPage = pages.length > 0 ? parseFloat((totalInternalLinks / pages.length).toFixed(2)) : 0;
    
    const hubPages = Object.entries(pageInboundCount)
      .map(([url, count]) => ({ url, inboundCount: count }))
      .sort((a, b) => b.inboundCount - a.inboundCount)
      .slice(0, 5);

    let topologyScore = 100 - (orphanPages.length * 20);
    topologyScore = Math.max(0, Math.min(100, topologyScore));

    if (orphanPages.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        title: `${orphanPages.length} Orphan pages detected`,
        description: 'Some pages have 0 inbound internal links. Crawlers and search engines will fail to discover these pages.',
        recommendation: 'Link to these orphan pages from relevant articles or your main sitemap.',
        affectedUrls: orphanPages
      });
    }

    // 9. Originality Score Estimation
    // Calculated based on alt text coverage, quantitative density, headings presence, average word counts
    const avgWords = pages.length > 0 ? totalWords / pages.length : 0;
    let originalityScore = 50;
    if (avgWords > 800) originalityScore += 20;
    else if (avgWords > 400) originalityScore += 10;
    
    if (quantitativeDataDensity > 2) originalityScore += 15;
    if (altTextQualityScore > 80) originalityScore += 15;

    originalityScore = Math.min(100, originalityScore);

    // Calculate Overall Content Semantic Score
    // Weights: 35% EEAT + 20% Answer-First + 15% Freshness + 10% Topology + 10% Multimedia + 10% Originality
    const contentSemanticScore = Math.round(
      (eeatOverall * 0.35) +
      (answerFirstAvgScore * 0.20) +
      (freshnessScore * 0.15) +
      (topologyScore * 0.10) +
      (multimediaScore * 0.10) +
      (originalityScore * 0.10)
    );

    const freshnessAnalysis: FreshnessAnalysis = {
      averageAgeDays,
      freshContentRatio,
      stalestPage,
      newestPage,
      freshnessScore,
      perPageFreshness
    };

    const internalLinkTopology: InternalLinkTopology = {
      totalInternalLinks,
      orphanPages,
      hubPages,
      averageLinksPerPage,
      maxDepth: 3, // mock depth for static analysis
      topologyScore
    };

    const citationNetwork: CitationNetworkResult = {
      totalOutboundLinks,
      uniqueExternalDomains: uniqueDomains.size,
      authorityDomainRatio,
      nofollowRatio,
      citationQualityScore,
      topCitedDomains
    };

    const multimediaAudit: MultimediaAudit = {
      totalImages,
      imagesWithAlt,
      imagesWithoutAlt,
      altTextQualityScore,
      videoCount,
      hasEmbeddedVideo,
      multimediaScore
    };

    return {
      eeat: {
        experience: expScore,
        expertise: extScore,
        authoritativeness: autScore,
        trustworthiness: truScore,
        overall: eeatOverall,
        signals: eeatSignals
      },
      answerFirstScores,
      freshnessAnalysis,
      topicClusters,
      quantitativeDataDensity,
      multimediaAudit,
      citationNetwork,
      originalityScore,
      internalLinkTopology,
      contentSemanticScore,
      issues
    };
  }
}
