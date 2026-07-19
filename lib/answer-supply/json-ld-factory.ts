/**
 * lib/answer-supply/json-ld-factory.ts
 * 
 * Generates valid Schema.org JSON-LD structured data (Article, Product, FAQPage, HowTo, LocalBusiness)
 * matching the compiled page content exactly.
 */

import { AnswerAssetSpec } from './answer-asset-generator';

export class JsonLdFactory {
  /**
   * Generates the appropriate JSON-LD object based on the schemaType inside the asset spec.
   */
  generate(spec: AnswerAssetSpec, domainUrl: string = 'https://bsw.os'): Record<string, any> {
    const type = spec.structuredData?.schemaType || 'FAQPage';
    const absoluteUrl = `${domainUrl}${spec.canonicalRoute}`;

    let payload: Record<string, any> = {
      "@context": "https://schema.org"
    };

    switch (type) {
      case 'FAQPage':
        payload = {
          ...payload,
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": spec.title || "질문",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": spec.directAnswer
              }
            }
          ]
        };
        break;

      case 'Article':
        const bodyContent = spec.contentBlocks.map(b => b.content).join('\n\n');
        payload = {
          ...payload,
          "@type": "NewsArticle",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": absoluteUrl
          },
          "headline": spec.title,
          "description": spec.seo.metaDescription,
          "articleBody": `${spec.directAnswer}\n\n${bodyContent}`,
          "datePublished": spec.createdAt,
          "dateModified": spec.reviewedAt || spec.createdAt,
          "author": {
            "@type": "Organization",
            "name": spec.authorId || "BSW-OS Semantic Publisher"
          },
          "publisher": {
            "@type": "Organization",
            "name": "BSW Answer Network",
            "logo": {
              "@type": "ImageObject",
              "url": `${domainUrl}/logo.png`
            }
          }
        };
        break;

      case 'Product':
        payload = {
          ...payload,
          "@type": "Product",
          "name": spec.title,
          "description": spec.directAnswer,
          "image": `${domainUrl}/default-product.png`,
          "sku": spec.id,
          "brand": {
            "@type": "Brand",
            "name": spec.tenantId || "BSW Verified Brand"
          },
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "KRW",
            "lowPrice": 0,
            "offerCount": 1,
            "url": absoluteUrl
          }
        };
        break;

      case 'LocalBusiness':
        payload = {
          ...payload,
          "@type": "LocalBusiness",
          "name": spec.title,
          "description": spec.directAnswer,
          "url": absoluteUrl,
          "telephone": "+82-64-000-0000",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Jeju",
            "addressCountry": "KR"
          }
        };
        break;

      case 'HowTo':
        const steps = spec.contentBlocks
          .filter(b => b.type === 'step' || b.type === 'list')
          .map((b, idx) => ({
            "@type": "HowToStep",
            "position": idx + 1,
            "name": b.title || `단계 ${idx + 1}`,
            "text": b.content
          }));

        payload = {
          ...payload,
          "@type": "HowTo",
          "name": spec.title,
          "description": spec.directAnswer,
          "step": steps.length > 0 ? steps : [
            {
              "@type": "HowToStep",
              "position": 1,
              "name": "기본 이용 절차",
              "text": spec.contentBlocks[0]?.content || "자세히 알아보기"
            }
          ]
        };
        break;

      default:
        // Default fallback to FAQPage
        payload = {
          ...payload,
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": spec.title,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": spec.directAnswer
              }
            }
          ]
        };
    }

    return payload;
  }

  /**
   * Compiles JSON-LD payload into a valid HTML string snippet.
   */
  compileToScriptTag(spec: AnswerAssetSpec, domainUrl: string = 'https://bsw.os'): string {
    const payload = this.generate(spec, domainUrl);
    return `<script type="application/ld+json">\n${JSON.stringify(payload, null, 2)}\n</script>`;
  }

  /**
   * Programmatic mismatch validator: checks if content differs from structured data.
   */
  validateMatch(spec: AnswerAssetSpec, jsonld: Record<string, any>): { matches: boolean; reason?: string } {
    const mainText = spec.directAnswer;
    const title = spec.title;

    if (jsonld["@type"] === 'FAQPage') {
      const questionName = jsonld.mainEntity?.[0]?.name;
      const answerText = jsonld.mainEntity?.[0]?.acceptedAnswer?.text;

      if (questionName !== title) {
        return { matches: false, reason: `Title mismatch: Spec title is '${title}' but FAQ Question name is '${questionName}'` };
      }
      if (answerText !== mainText) {
        return { matches: false, reason: `Answer mismatch: Spec directAnswer is '${mainText}' but FAQ Answer text is '${answerText}'` };
      }
    }

    if (jsonld["@type"] === 'NewsArticle') {
      const headline = jsonld.headline;
      if (headline !== title) {
        return { matches: false, reason: `Headline mismatch: headline is '${headline}' but title is '${title}'` };
      }
    }

    return { matches: true };
  }
}
