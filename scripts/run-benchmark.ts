/**
 * scripts/run-benchmark.ts
 *
 * CLI script to run lightweight benchmark measurements for any registered domain.
 * Usage: npx tsx scripts/run-benchmark.ts [--domain skincare|wedding_studio] [--workspace WORKSPACE_ID]
 *
 * This script:
 * 1. Loads environment variables from .env.local
 * 2. Initializes the LightweightMetricRunner
 * 3. Runs AAS/OCR/BSF measurement against configured AI search engines
 * 4. Stores results in industry_benchmark_snapshots
 * 5. Prints a formatted console report
 */

import * as fs from 'fs';
import * as path from 'path';
import { LightweightMetricRunner } from '../lib/benchmark/lightweight-metric-runner';
import { BENCHMARK_DOMAINS } from '../lib/benchmark/domain-config';
import { INDUSTRY_PANELS_DATA } from '../db/seed/industry-panels/questions-data';

// ─── Load .env.local ─────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.warn('⚠ .env.local not found, proceeding with existing env vars');
    return;
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.substring(0, eqIdx).trim();
    let value = trimmed.substring(eqIdx + 1).trim();
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

// ─── CLI argument parsing ────────────────────────────────────
function parseArgs(): { domain: string; workspace: string; limit?: number } {
  const args = process.argv.slice(2);
  let domain = 'skincare';
  let workspace = process.env.DEFAULT_WORKSPACE_ID || 'demo-workspace';
  let limit: number | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--domain' && args[i + 1]) {
      domain = args[i + 1];
      i++;
    }
    if (args[i] === '--workspace' && args[i + 1]) {
      workspace = args[i + 1];
      i++;
    }
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
  }
  return { domain, workspace, limit };
}

// ─── Formatted report output ─────────────────────────────────
function printReport(domainName: string, results: any[]) {
  console.log('\n' + '═'.repeat(72));
  console.log(`  📊 ${domainName} — AI Brand Visibility Benchmark Report`);
  console.log('═'.repeat(72));
  console.log('');

  // Table header
  const h = {
    brand: 'Brand'.padEnd(24),
    aas: 'AAS'.padStart(8),
    ocr: 'OCR'.padStart(8),
    bsf: 'BSF'.padStart(8),
    bair: 'BAIR'.padStart(8),
    mentions: 'Ment.'.padStart(8),
    cites: 'Cite.'.padStart(8),
  };
  console.log(`  ${h.brand}${h.aas}${h.ocr}${h.bsf}${h.bair}${h.mentions}${h.cites}`);
  console.log('  ' + '─'.repeat(70));

  // Sort by BAIR descending
  const sorted = [...results].sort((a, b) => (b.bair ?? b.aas) - (a.bair ?? a.aas));

  sorted.forEach((r, i) => {
    const rank = `#${i + 1}`;
    const brand = `${rank} ${r.brand_name}`.padEnd(24);
    const aas = `${r.aas}%`.padStart(8);
    const ocr = `${r.ocr}%`.padStart(8);
    const bsf = `${r.bsf}%`.padStart(8);
    const bair = `${r.bair}`.padStart(8);
    const mentions = `${r.mention_count}`.padStart(8);
    const cites = `${r.citation_count}`.padStart(8);
    console.log(`  ${brand}${aas}${ocr}${bsf}${bair}${mentions}${cites}`);
  });

  console.log('  ' + '─'.repeat(70));

  // Summary
  const avgAAS = (sorted.reduce((s, r) => s + r.aas, 0) / sorted.length).toFixed(1);
  const avgOCR = (sorted.reduce((s, r) => s + r.ocr, 0) / sorted.length).toFixed(1);
  console.log(`\n  평균 AAS: ${avgAAS}%  |  평균 OCR: ${avgOCR}%  |  측정 시점: ${new Date().toLocaleString('ko-KR')}`);
  console.log('  방법론: 텍스트 매칭 기반 (AI Judge 0호출)\n');
  console.log('═'.repeat(72));
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  loadEnv();
  const { domain, workspace, limit } = parseArgs();

  console.log(`\n🚀 BSW-OS Benchmark Runner`);
  console.log(`   Domain:    ${domain}`);
  console.log(`   Workspace: ${workspace}`);
  if (limit !== undefined) {
    console.log(`   Limit Qs:  ${limit}`);
  }
  console.log(`   Time:      ${new Date().toISOString()}\n`);

  const rawDomainConfig = BENCHMARK_DOMAINS[domain];
  if (!rawDomainConfig) {
    console.error(`❌ Unknown domain: ${domain}`);
    console.error(`   Available: ${Object.keys(BENCHMARK_DOMAINS).join(', ')}`);
    process.exit(1);
  }

  const domainConfig = { ...rawDomainConfig };
  if (limit !== undefined) {
    (domainConfig as any).sampleQuestionsForFull = limit;
    (domainConfig as any).sampleQuestionsForLight = limit;
  }

  const industryType = domainConfig.industryType as keyof typeof INDUSTRY_PANELS_DATA;
  const panelData = INDUSTRY_PANELS_DATA[industryType];
  if (!panelData) {
    console.error(`❌ No question panel for industry: ${industryType}`);
    process.exit(1);
  }

  console.log(`📋 Question Panel: ${panelData.panel_name}`);
  console.log(`   Total Qs:  ${panelData.questions.length}`);
  console.log(`   Sample:    ${domainConfig.sampleQuestionsForFull} (weekly_full mode)`);
  console.log(`   Brands:    ${domainConfig.brands.map(b => b.name).join(', ')}`);
  console.log(`   Engines:   chatgpt_search, gemini_grounding\n`);

  // Decide engines based on available API keys
  const engines: string[] = [];
  if (process.env.OPENAI_API_KEY) {
    engines.push('chatgpt_search');
    console.log('  ✓ OpenAI API key detected');
  } else {
    console.log('  ⚠ OPENAI_API_KEY not set — skipping ChatGPT Search');
  }
  if (process.env.GEMINI_API_KEY) {
    engines.push('gemini_grounding');
    console.log('  ✓ Gemini API key detected');
  } else {
    console.log('  ⚠ GEMINI_API_KEY not set — skipping Gemini Grounding');
  }

  if (engines.length === 0) {
    console.error('\n❌ No API keys found. Set OPENAI_API_KEY and/or GOOGLE_AI_STUDIO_KEY in .env.local');
    process.exit(1);
  }

  console.log(`\n🔎 Running measurement with engines: ${engines.join(', ')}...\n`);

  const runner = new LightweightMetricRunner(engines);
  const result = await runner.run(domainConfig, panelData.questions, 'weekly_full');

  printReport(domainConfig.name, result.brand_results);

  // Attempt to persist to Supabase
  try {
    const { getSupabaseAdminClient } = await import('../lib/supabase');
    const supabase = getSupabaseAdminClient();

    const records = result.brand_results.map(br => ({
      workspace_id: workspace,
      domain_slug: domain,
      brand_slug: br.brand_slug,
      brand_name: br.brand_name,
      engine_name: br.engine_name,
      aas: br.aas,
      ocr: br.ocr,
      bsf: br.bsf,
      ars: null,
      bair: br.bair,
      mention_count: br.mention_count,
      citation_count: br.citation_count,
      sample_size: br.sample_size,
      measurement_type: 'weekly_full',
      measured_at: br.measured_at,
    }));

    const { error } = await supabase.from('industry_benchmark_snapshots').insert(records);
    if (error) {
      console.warn(`⚠ DB insert failed: ${error.message}`);
    } else {
      console.log(`✅ ${records.length} snapshots persisted to Supabase.`);
    }
  } catch (err: any) {
    console.warn(`⚠ DB persistence skipped: ${err.message}`);
  }

  // ── Phase 1: 정방향 자동 트리거 (Opportunity to Signals/CQ) ──
  if (result.question_details) {
    console.log('\n🔎 Running Opportunity Analysis for all brands to feed QIS...');
    try {
      const { OpportunityAnalyzer } = await import('../lib/benchmark/opportunity-analyzer');
      const { feedBenchmarkOpportunitiesToSignals, autoPromoteSignalToCQ } = await import('../app/actions/qis-bridge');

      const allSignals: Array<{ query: string; intent: string; source: string }> = [];

      for (const brand of domainConfig.brands) {
        const oppReport = OpportunityAnalyzer.analyze(
          brand.name,
          brand.slug,
          result.question_details
        );
        if (oppReport.auto_generated_signals) {
          allSignals.push(...oppReport.auto_generated_signals);
        }
      }

      if (allSignals.length > 0) {
        console.log(`📡 Feeding ${allSignals.length} opportunities to QIS signals...`);
        const feedRes = await feedBenchmarkOpportunitiesToSignals(workspace, allSignals);
        console.log(`✅ QIS Feed: ${feedRes.fedCount} fed, ${feedRes.skippedCount} skipped.`);

        // Auto promote mined signals to CQ/Scene
        const { getSupabaseAdminClient } = await import('../lib/supabase');
        const db = getSupabaseAdminClient();
        const { data: minedSignals, error: sigErr } = await db
          .from('question_signals')
          .select('*')
          .eq('workspace_id', workspace)
          .eq('status', 'mined');

        if (!sigErr && minedSignals && minedSignals.length > 0) {
          console.log(`🚀 Auto-promoting ${minedSignals.length} mined signals to CQ/Scene...`);
          let promoted = 0;
          for (const sig of minedSignals) {
            try {
              await autoPromoteSignalToCQ(workspace, sig.id, { 
                autoCreateQisScene: true, 
                industryKey: domain 
              });
              promoted++;
            } catch (e: any) {
              console.warn(`  ⚠ Promotion failed for "${sig.query}": ${e.message}`);
            }
          }
          console.log(`✅ Promoted ${promoted} signals.`);
        }
      }

      // ── Phase 3: 질문 자산 추출기 (BenchmarkAssetExtractor) ──
      console.log('\n💎 Extracting Question Assets (Discovery, GAP, Volatile, CWR Insights)...');
      const { BenchmarkAssetExtractor } = await import('../lib/benchmark/benchmark-asset-extractor');
      const assets = BenchmarkAssetExtractor.extract(result.question_details, domainConfig.brands, domain);
      console.log(`  ✓ Extracted ${assets.length} question assets.`);

      if (assets.length > 0) {
        console.log(`📡 Persisting ${assets.length} question assets to Supabase...`);
        const persistRes = await BenchmarkAssetExtractor.persist(workspace, assets);
        console.log(`✅ Persisted Assets: ${persistRes.saved} saved, ${persistRes.skipped} skipped.`);
      }

      // ── Phase 5: TCO 자동 발견 (TcoAutoDiscoverer) ──
      console.log('\n🧠 Discovering new TCO concepts from search queries...');
      const { TcoAutoDiscoverer } = await import('../lib/benchmark/tco-auto-discoverer');
      let existingSlugs: string[] = [];
      try {
        const { getSupabaseAdminClient } = await import('../lib/supabase');
        const db = getSupabaseAdminClient();
        const { data: tcos } = await db.from('tco_concepts').select('slug').eq('workspace_id', workspace);
        if (tcos) {
          existingSlugs = tcos.map(t => t.slug);
        }
      } catch (e: any) {
        console.warn(`  ⚠ Failed to fetch existing TCO concepts: ${e.message}`);
      }

      const candidates = TcoAutoDiscoverer.discover(result.question_details, existingSlugs);
      console.log(`  ✓ Discovered ${candidates.length} TCO candidates.`);

      if (candidates.length > 0) {
        console.log(`📡 Applying ${candidates.length} discovered TCO concepts to Supabase...`);
        const applyRes = await TcoAutoDiscoverer.apply(workspace, candidates);
        console.log(`✅ TCO Concepts: ${applyRes.created} created, ${applyRes.enriched} enriched.`);
      }
    } catch (err: any) {
      console.warn(`⚠ QIS auto-pilot feeding/asset extraction/TCO discovery failed: ${err.message}`);
    }
  }

  console.log('\n✅ Benchmark complete.\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
