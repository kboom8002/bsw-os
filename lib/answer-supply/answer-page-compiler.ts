/**
 * lib/answer-supply/answer-page-compiler.ts
 * 
 * Compiles AnswerAssetSpec into indexable HTML following domain guidelines:
 * H1 -> Direct Answer -> Proof -> Routines -> Cautions -> References.
 */

import { AnswerAssetSpec, ContentBlock } from './answer-asset-generator';

export class AnswerPageCompiler {
  /**
   * Compiles the AnswerAssetSpec into a semantic HTML string for public rendering.
   */
  compileHtml(spec: AnswerAssetSpec): string {
    const directAnswerHtml = this.renderDirectAnswer(spec.directAnswer);
    const proofHtml = this.renderProof(spec.contentBlocks.filter(b => b.type === 'quote' || b.title?.includes('근거') || b.title?.includes('증명') || b.type === 'paragraph' && b.id.includes('block-1')));
    const routinesHtml = this.renderRoutines(spec.contentBlocks.filter(b => b.type === 'step' || b.type === 'list' || b.title?.includes('가이드') || b.title?.includes('절차')));
    const cautionsHtml = this.renderCautions(spec.warnings, spec.exclusions);
    const referencesHtml = this.renderReferences(spec.contentBlocks.filter(b => b.evidenceRefs && b.evidenceRefs.length > 0), spec.applicability);
    const ctaHtml = this.renderCta(spec.nextActions);

    return `
<article class="bsw-answer-page max-w-4xl mx-auto px-4 py-8 font-sans text-gray-900 antialiased" data-asset-id="${spec.id}" data-version="${spec.version}">
  <!-- H1 Title -->
  <header class="mb-8">
    <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
      ${this.escapeHtml(spec.title)}
    </h1>
    <div class="flex items-center text-sm text-gray-500 space-x-2">
      <span>발행일: ${new Date(spec.createdAt).toLocaleDateString('ko-KR')}</span>
      <span>•</span>
      <span>작성자: ${this.escapeHtml(spec.authorId)}</span>
      <span>•</span>
      <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">정본 답변 Verified</span>
    </div>
  </header>

  <!-- Direct Answer Section (AEO Card) -->
  <section class="direct-answer-section mb-10">
    <h2 class="sr-only">요약 답변</h2>
    ${directAnswerHtml}
  </section>

  <!-- Proof & Evidence Section -->
  <section class="proof-section mb-10 border-t border-gray-100 pt-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">사실 검증 및 입증 근거</h2>
    ${proofHtml || '<p class="text-gray-600">이 정보는 검증된 팩트 시트에 기초하여 작성되었습니다.</p>'}
  </section>

  <!-- Actionable Routines Section -->
  <section class="routines-section mb-10 border-t border-gray-100 pt-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">실천 가이드 및 추천 절차</h2>
    ${routinesHtml || '<p class="text-gray-600">제시된 세부 절차에 맞춰 예약 및 이용을 권장합니다.</p>'}
  </section>

  <!-- Cautions & Warnings Section -->
  <section class="cautions-section mb-10 border-t border-gray-100 pt-8 bg-red-50 p-6 rounded-xl border border-red-100">
    <h2 class="text-2xl font-bold text-red-900 mb-4 flex items-center">
      <svg class="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
      주의사항 및 적용 예외
    </h2>
    ${cautionsHtml}
  </section>

  <!-- References Section -->
  <section class="references-section mb-10 border-t border-gray-100 pt-8">
    <h2 class="text-xl font-bold text-gray-900 mb-4">근거 자료 출처 목록</h2>
    ${referencesHtml}
  </section>

  <!-- CTA Section -->
  <footer class="cta-section mt-12 border-t border-gray-200 pt-8 text-center">
    ${ctaHtml}
  </footer>
</article>
`;
  }

  /**
   * Compiles SEO metadata for Next.js app router metadata export.
   */
  compileMetadata(spec: AnswerAssetSpec): {
    title: string;
    description: string;
    keywords: string[];
    robots: { index: boolean; follow: boolean };
    alternates: { canonical: string };
  } {
    return {
      title: spec.seo.title,
      description: spec.seo.metaDescription,
      keywords: spec.seo.keywords,
      robots: {
        index: spec.seo.robots.includes('index'),
        follow: spec.seo.robots.includes('follow')
      },
      alternates: {
        canonical: spec.canonicalRoute
      }
    };
  }

  private renderDirectAnswer(directAnswer: string): string {
    return `
<div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-6 rounded-r-xl shadow-sm">
  <span class="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">Direct Answer</span>
  <p class="text-lg md:text-xl font-medium text-gray-800 leading-relaxed">
    ${this.escapeHtml(directAnswer)}
  </p>
</div>
`;
  }

  private renderProof(blocks: ContentBlock[]): string {
    if (blocks.length === 0) return '';
    return blocks.map(b => `
<div class="mb-4">
  ${b.title ? `<h3 class="text-lg font-semibold text-gray-800 mb-2">${this.escapeHtml(b.title)}</h3>` : ''}
  <p class="text-gray-700 leading-relaxed mb-2">${this.escapeHtml(b.content)}</p>
  ${b.evidenceRefs && b.evidenceRefs.length > 0 
    ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">입증 완료 [${b.evidenceRefs.join(', ')}]</span>` 
    : ''}
</div>
`).join('\n');
  }

  private renderRoutines(blocks: ContentBlock[]): string {
    if (blocks.length === 0) return '';
    return blocks.map(b => `
<div class="mb-4">
  ${b.title ? `<h3 class="text-lg font-semibold text-gray-800 mb-2">${this.escapeHtml(b.title)}</h3>` : ''}
  <div class="text-gray-700 leading-relaxed pl-4 border-l border-gray-200">${this.escapeHtml(b.content).replace(/\n/g, '<br/>')}</div>
</div>
`).join('\n');
  }

  private renderCautions(warnings: string[], exclusions: string[]): string {
    let html = '';
    
    if (warnings.length > 0) {
      html += `
<div class="mb-4">
  <h3 class="text-md font-semibold text-red-900 mb-2">필수 고지 및 위험 관리</h3>
  <ul class="list-disc list-inside text-red-800 space-y-1 text-sm">
    ${warnings.map(w => `<li>${this.escapeHtml(w)}</li>`).join('\n')}
  </ul>
</div>
`;
    }

    if (exclusions.length > 0) {
      html += `
<div>
  <h3 class="text-md font-semibold text-red-900 mb-2">적용 대상 제외 기준</h3>
  <ul class="list-disc list-inside text-red-800 space-y-1 text-sm">
    ${exclusions.map(e => `<li>${this.escapeHtml(e)}</li>`).join('\n')}
  </ul>
</div>
`;
    }

    return html;
  }

  private renderReferences(blocks: ContentBlock[], applicability: string[]): string {
    let html = '<ul class="list-decimal list-inside text-sm text-gray-600 space-y-1">';
    
    if (blocks.length > 0) {
      html += blocks.map(b => `
        <li>
          <strong>${this.escapeHtml(b.title || '정보원')}</strong>: 
          ${this.escapeHtml(b.content.substring(0, 100))}...
        </li>
      `).join('\n');
    } else {
      html += '<li>공식 팩트 및 사업장 운영 기준 확인</li>';
    }

    if (applicability && applicability.length > 0) {
      html += `
<div class="mt-4 pt-4 border-t border-gray-100">
  <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">적용 대상 범위</span>
  <div class="flex flex-wrap gap-2">
    ${applicability.map(a => `<span class="bg-gray-100 text-gray-700 text-xs px-2.5 py-0.5 rounded-full">${this.escapeHtml(a)}</span>`).join('')}
  </div>
</div>
`;
    }

    html += '</ul>';
    return html;
  }

  private renderCta(actions: any[]): string {
    if (!actions || actions.length === 0) return '';
    return actions.map(act => `
<a href="${this.escapeHtml(act.url)}" class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[200px]" data-cta-type="${act.type}">
  ${this.escapeHtml(act.label)}
</a>
`).join('\n');
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
