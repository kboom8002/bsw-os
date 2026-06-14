import { SKINCARE_MOCK_RESPONSES } from '../db/seed/mock/skincare-mock-responses';
import { DR_O_SSOT } from '../db/seed/domains/dr-o-ssot';
import { INDUSTRY_PANELS_DATA } from '../db/seed/industry-panels/questions-data';
import { SearchProviderFactory } from '../lib/ai/search-provider-factory';
import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const modeArg = args.find(arg => arg.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'mock';

interface MetricResults {
  ARS: number; // AEO Readiness Score
  BSF: number; // Brand Semantic Fidelity
  OCR: number; // Observed Citation Rate
  AAS: number; // Brand Answer Share
  BAIR: number; // Brand AI Recommendation Index
}

/**
 * High-fidelity Simulated Judge Engine for E2E fast validation
 * Evaluates Must-Include, Should-Include, Must-Not-Do, and Citation overlaps
 */
function evaluateResponse(
  questionText: string,
  responseText: string,
  citations: any[],
  mustInclude: string[],
  shouldInclude: string[],
  mustNotDo: string[]
) {
  const text = responseText.toLowerCase();
  
  // 1. Must Include Coverage
  let mustCount = 0;
  mustInclude.forEach(term => {
    if (text.includes(term.toLowerCase())) mustCount++;
  });
  const mustRatio = mustInclude.length > 0 ? mustCount / mustInclude.length : 1.0;

  // 2. Should Include Coverage
  let shouldCount = 0;
  shouldInclude.forEach(term => {
    if (text.includes(term.toLowerCase())) shouldCount++;
  });
  const shouldRatio = shouldInclude.length > 0 ? shouldCount / shouldInclude.length : 1.0;

  // 3. Must Not Do Violations (Hallucinations/Distortions)
  let violationCount = 0;
  mustNotDo.forEach(term => {
    if (text.includes(term.toLowerCase())) violationCount++;
  });
  const hasViolation = violationCount > 0;

  // 4. BSF Score (Fidelity to SSoT)
  // Base BSF on must/should ratio and penalize for violations
  let bsf = (mustRatio * 60) + (shouldRatio * 40);
  if (hasViolation) {
    bsf = Math.max(0, bsf - 40); // penalty
  }

  // 5. M6 (Hallucination) & M4 (Distortion)
  const isHallucinated = hasViolation || text.includes('완치') || text.includes('치료제') || text.includes('100%');
  const isDistorted = text.includes('상술') || text.includes('소용없다') || text.includes('독극물') || text.includes('피부 얇아');

  // 6. OCR (Citations containing official domain)
  const officialDomain = DR_O_SSOT.official_domains[0].toLowerCase();
  const hasBrandCitation = citations.some(c => c.domain.toLowerCase().includes(officialDomain) || c.url.toLowerCase().includes(officialDomain));
  const ocr = citations.length > 0 ? (hasBrandCitation ? 100 : 0) : 0;

  // 7. AAS (Answer Share)
  const brandName = DR_O_SSOT.brand_name_ko.toLowerCase();
  const hasBrandName = text.includes(brandName) || text.includes('닥터오') || text.includes('dr.o');
  const aas = hasBrandName ? 100 : 0;

  // 8. ARS (Readiness Score)
  const ars = Math.max(0, Math.min(100, (bsf * 0.5) + (ocr * 0.3) + (aas * 0.2)));

  return {
    bsf: parseFloat(bsf.toFixed(2)),
    ocr,
    aas,
    ars: parseFloat(ars.toFixed(2)),
    isHallucinated,
    isDistorted,
    hasViolation
  };
}

async function runMockMode() {
  console.log('\n=== RUNNING SKINCARE MEASUREMENT IN [MOCK] MODE ===');
  console.log(`Analyzing DR.O brand truths against 7 core simulated scenarios...`);
  
  const results: any[] = [];
  
  for (const [qText, mockItem] of Object.entries(SKINCARE_MOCK_RESPONSES)) {
    // Find the standard expected layers from the registered questions
    const stdQ = INDUSTRY_PANELS_DATA.skincare.questions.find(q => q.question_text === qText) || {
      must_include: ['닥터오'],
      should_include: ['더마 리셋'],
      must_not_do: ['완치']
    };

    console.log(`\n--------------------------------------------------`);
    console.log(`Layer: ${mockItem.layer} | Q: "${qText}"`);
    
    // Evaluate Good response
    const goodEval = evaluateResponse(
      qText,
      mockItem.responses.good,
      [], // no citations in mock
      stdQ.must_include,
      stdQ.should_include,
      stdQ.must_not_do
    );
    console.log(`  [Good Response] ARS: ${goodEval.ars}%, BSF: ${goodEval.bsf}%, Hallucination: ${goodEval.isHallucinated}`);
    
    // Evaluate Hallucination response
    const halEval = evaluateResponse(
      qText,
      mockItem.responses.hallucination,
      [],
      stdQ.must_include,
      stdQ.should_include,
      stdQ.must_not_do
    );
    console.log(`  [Hallucinated]  ARS: ${halEval.ars}%, BSF: ${halEval.bsf}%, Hallucination: ${halEval.isHallucinated}`);

    // Evaluate Distortion response
    const distEval = evaluateResponse(
      qText,
      mockItem.responses.distortion,
      [],
      stdQ.must_include,
      stdQ.should_include,
      stdQ.must_not_do
    );
    console.log(`  [Distorted]     ARS: ${distEval.ars}%, BSF: ${distEval.bsf}%, Distortion: ${distEval.isDistorted}`);

    results.push({
      question: qText,
      layer: mockItem.layer,
      good: goodEval,
      hallucinated: halEval,
      distorted: distEval
    });
  }

  // Calculate composite metrics
  const avgGoodArs = results.reduce((sum, r) => sum + r.good.ars, 0) / results.length;
  const avgGoodBsf = results.reduce((sum, r) => sum + r.good.bsf, 0) / results.length;
  const avgGoodOcr = results.reduce((sum, r) => sum + r.good.ocr, 0) / results.length;
  const avgGoodAas = results.reduce((sum, r) => sum + r.good.aas, 0) / results.length;
  
  // BAIR Index = AAS * (BSF/100) * (1 - HallucinationRate)
  const bair = avgGoodAas * (avgGoodBsf / 100);

  console.log(`\n==================================================`);
  console.log(`Composite Skincare Baseline Indicators (Mock-Good):`);
  console.log(`- AEO Readiness Score (ARS): ${avgGoodArs.toFixed(2)}%`);
  console.log(`- Brand Semantic Fidelity (BSF): ${avgGoodBsf.toFixed(2)}%`);
  console.log(`- Observed Citation Rate (OCR): ${avgGoodOcr.toFixed(2)}%`);
  console.log(`- Brand Answer Share (AAS): ${avgGoodAas.toFixed(2)}%`);
  console.log(`- Brand AI Recommendation Index (BAIR): ${bair.toFixed(2)}`);
  console.log(`==================================================`);
}

async function runLiveMode() {
  console.log('\n=== RUNNING SKINCARE MEASUREMENT IN [LIVE] MODE ===');
  console.log(`Core Engines Activated: [ChatGPT Search, Gemini Grounding] ONLY (Perplexity/Claude Deferred)`);
  
  const testQuestions = [
    {
      q: '스킨케어 루틴 기본 순서 알려줘',
      layer: 'L1_universal',
      must: ['클렌징', '토너', '크림'],
      should: ['선크림', '제형'],
      avoid: ['완치']
    },
    {
      q: '민감성 피부 보습크림 추천해줘',
      layer: 'L2_competitive',
      must: ['닥터오', '보습크림'],
      should: ['세라마이드', '장벽'],
      avoid: ['독성', '발암']
    },
    {
      q: '레티놀 효과와 작용 메커니즘',
      layer: 'L3_ingredient',
      must: ['콜라겐', '턴오버'],
      should: ['모공', '자극'],
      avoid: ['영구', '기형아']
    },
    {
      q: '닥터오 브랜드 철학이 뭐야?',
      layer: 'L4_journey',
      must: ['더마 리셋', '시술 후'],
      should: ['임상', '장벽'],
      avoid: ['전문의약품']
    },
    {
      q: '임산부 닥터오 제품 써도 되나요?',
      layer: 'L5_ymyl',
      must: ['레티놀 배제', '안심'],
      should: ['EWG', '그린'],
      avoid: ['FDA 치료 승인']
    },
    {
      q: '2026 K-뷰티 스킨케어 신 트렌드',
      layer: 'L6_trend',
      must: ['슬로우 에이징', '장벽'],
      should: ['비건', '하이드로겔'],
      avoid: ['뇌세포']
    },
    {
      q: '닥터오의 브랜드 슬로건과 핵심 철학',
      layer: 'L7_brand',
      must: ['더마 리셋', '시술 후'],
      should: ['세콜지', '진정'],
      avoid: ['치료의약품', '완치']
    }
  ];

  const engines = ['chatgpt_search', 'gemini_grounding'];
  const liveResults: any[] = [];

  SearchProviderFactory.setBrandDomains(['droanswer.com']);

  for (const item of testQuestions) {
    console.log(`\n[Live Query] Q: "${item.q}" (${item.layer})`);
    
    const query = item.q.replace('{brand}', '닥터오');
    
    // Execute Multi-Engine comparison
    try {
      const multiRes = await SearchProviderFactory.runMultiEngine(query, engines);
      
      for (const engine of engines) {
        const engineRes = multiRes.results[engine];
        if (!engineRes) continue;

        const responseText = engineRes.raw_response_text;
        const citations = engineRes.citations || [];

        const evalRes = evaluateResponse(
          item.q,
          responseText,
          citations,
          item.must,
          item.should,
          item.avoid
        );

        console.log(`  └─ Engine: ${engine}`);
        console.log(`     Latency: ${engineRes.response_metadata.response_latency_ms}ms`);
        console.log(`     Citations: ${citations.length} found`);
        console.log(`     ARS: ${evalRes.ars}% | BSF: ${evalRes.bsf}% | AAS: ${evalRes.aas}% | OCR: ${evalRes.ocr}%`);
        
        liveResults.push({
          question: item.q,
          layer: item.layer,
          engine,
          ars: evalRes.ars,
          bsf: evalRes.bsf,
          aas: evalRes.aas,
          ocr: evalRes.ocr,
          citationsCount: citations.length,
          isHallucinated: evalRes.isHallucinated
        });
      }
    } catch (err: any) {
      console.error(`  └─ [Error in Multi-Engine Run]: ${err.message}`);
    }
  }

  if (liveResults.length === 0) {
    console.error('\n[Error] No live results could be collected. Ensure your API keys are configured correctly.');
    return;
  }

  // Calculate live composite metrics
  const avgArs = liveResults.reduce((sum, r) => sum + r.ars, 0) / liveResults.length;
  const avgBsf = liveResults.reduce((sum, r) => sum + r.bsf, 0) / liveResults.length;
  const avgOcr = liveResults.reduce((sum, r) => sum + r.ocr, 0) / liveResults.length;
  const avgAas = liveResults.reduce((sum, r) => sum + r.aas, 0) / liveResults.length;
  const bair = avgAas * (avgBsf / 100);

  console.log(`\n==================================================`);
  console.log(`LIVE Multi-Engine Skincare Composite Indicators (OpenAI + Google):`);
  console.log(`- Composite AEO Readiness Score (ARS): ${avgArs.toFixed(2)}%`);
  console.log(`- Composite Brand Semantic Fidelity (BSF): ${avgBsf.toFixed(2)}%`);
  console.log(`- Composite Observed Citation Rate (OCR): ${avgOcr.toFixed(2)}%`);
  console.log(`- Composite Brand Answer Share (AAS): ${avgAas.toFixed(2)}%`);
  console.log(`- Composite Brand AI Recommendation Index (BAIR): ${bair.toFixed(2)}`);
  console.log(`==================================================`);

  // Write report JSON
  const reportPath = path.join(process.cwd(), 'docs', 'skincare-baseline-report.json');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportData = {
    generated_at: new Date().toISOString(),
    mode: 'live',
    engines,
    metrics: {
      ARS: parseFloat(avgArs.toFixed(2)),
      BSF: parseFloat(avgBsf.toFixed(2)),
      OCR: parseFloat(avgOcr.toFixed(2)),
      AAS: parseFloat(avgAas.toFixed(2)),
      BAIR: parseFloat(bair.toFixed(2))
    },
    raw_runs: liveResults
  };

  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf8');
  console.log(`[Live Script] Saved comprehensive baseline report to: ${reportPath}`);
}

async function main() {
  if (mode === 'mock') {
    await runMockMode();
  } else if (mode === 'live') {
    await runLiveMode();
  } else {
    console.error(`Invalid mode: "${mode}". Use --mode=mock or --mode=live`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
