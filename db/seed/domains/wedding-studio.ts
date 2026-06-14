import { getSupabaseAdminClient } from '../../../lib/supabase';
import { upsertRecord, logSeeded, MOCK_PROXY_CAVEAT, SIMULATED_USER_ID } from '../utils';
import { INDUSTRY_PANELS_DATA } from '../industry-panels/questions-data';

/**
 * Wedding Studio 5-Brand SSOT
 * 
 * 더청담스튜디오, 이포토에세이, 루미에 스튜디오, 로이 스튜디오, 섬 스튜디오
 */
interface WeddingBrandSSoT {
  slug: string;
  name_ko: string;
  name_en: string;
  domains: string[];
  strategic_intent: string;
  claims: string[];
  forbidden_claims: string[];
  safety_disclaimers: string[];
  concepts: Array<{ id: string; label: string; definition: string }>;
  products: Array<{
    name: string;
    type: string;
    features: string[];
  }>;
  persona: {
    name: string;
    tone_weights: Record<string, number>;
    instructions: string[];
  };
  vibe: {
    name: string;
    ratios: Record<string, number>;
  };
  color: string;
}

const WEDDING_BRANDS: WeddingBrandSSoT[] = [
  {
    slug: 'the-cheongdam-studio',
    name_ko: '더청담스튜디오',
    name_en: 'The Cheongdam Studio',
    domains: ['thecheongdamstudio.com', 'cheongdamstudio.kr'],
    strategic_intent: '청담동 감성의 하이엔드 웨딩 포토그래피. 자연광 스튜디오와 대형 세트를 활용한 시네마틱 웨딩 촬영 전문.',
    claims: [
      '청담동 최대 규모 자연광 스튜디오',
      '시네마틱 컬러 그레이딩 기술 적용'
    ],
    forbidden_claims: [
      '국내 1위 웨딩 스튜디오',
      '100% 보정 완벽 보장'
    ],
    safety_disclaimers: [
      '촬영 스케줄은 시즌별 예약 상황에 따라 변동됩니다.',
      '인화 및 앨범 제작은 별도 업체 협력으로 진행됩니다.'
    ],
    concepts: [
      { id: 'cinematic-wedding-photo', label: '시네마틱 웨딩 포토', definition: '영화적 색감과 조명 기법을 활용한 웨딩 촬영 장르' },
      { id: 'natural-light-studio', label: '자연광 스튜디오', definition: '대형 창을 통한 자연광 유입으로 부드러운 톤을 구현하는 촬영 공간' },
      { id: 'set-design-variety', label: '세트 디자인 다양성', definition: '클래식, 모던, 빈티지 등 다양한 컨셉 세트를 보유한 스튜디오 역량' }
    ],
    products: [
      { name: '더청담 시그니처 컬렉션', type: 'package', features: ['4시간 촬영', '보정본 80컷', '원본 전체 제공', '프리미엄 앨범 1권'] },
      { name: '더청담 시네마 무비 패키지', type: 'video_package', features: ['본식 스냅 영상', '시네마틱 하이라이트', '4K 편집'] }
    ],
    persona: {
      name: '더청담 Visual Director',
      tone_weights: { formal: 0.6, artistic: 0.4 },
      instructions: ['시네마틱 품질과 조명 기술 강조', '청담 브랜드 프리미엄 유지', '과장 없는 사실 기반 설명']
    },
    vibe: {
      name: '하이엔드 아트 포토 바이브',
      ratios: { aesthetics: 0.50, trustworthiness: 0.30, warmth: 0.20 }
    },
    color: '#6366f1'
  },
  {
    slug: 'ephoto-essay',
    name_ko: '이포토에세이',
    name_en: 'E Photo Essay',
    domains: ['ephotoessay.com', 'ephotoessay.co.kr'],
    strategic_intent: '감성 에세이 스타일의 스토리텔링 웨딩 포토그래피. 커플의 러브스토리를 담은 내추럴 포토 에세이 전문.',
    claims: [
      '커플 스토리 맞춤형 에세이 포토 촬영',
      '자연스러운 감성 톤 보정 전문'
    ],
    forbidden_claims: [
      '최고의 감성 보장',
      '무조건 만족 보장'
    ],
    safety_disclaimers: [
      '야외 촬영 시 날씨에 따라 대체 장소 촬영이 진행될 수 있습니다.',
      '촬영 후 보정 기간은 약 3~4주 소요됩니다.'
    ],
    concepts: [
      { id: 'story-driven-photo', label: '스토리드리븐 포토', definition: '커플의 연애 이야기를 구성하여 촬영하는 내러티브 포토 기법' },
      { id: 'natural-tone-editing', label: '내추럴 톤 보정', definition: '과도한 보정 없이 자연스러운 피부톤과 색감을 살리는 후보정 방식' },
      { id: 'outdoor-location-photo', label: '야외 로케이션 촬영', definition: '자연 풍경을 배경으로 하는 야외 웨딩 촬영' }
    ],
    products: [
      { name: '에세이 클래식 패키지', type: 'package', features: ['3시간 촬영', '보정본 60컷', '소프트 앨범 1권'] },
      { name: '러브스토리 야외 패키지', type: 'outdoor_package', features: ['야외 2시간 + 실내 1시간', '보정본 70컷', '액자 2점'] }
    ],
    persona: {
      name: '이포토에세이 Story Curator',
      tone_weights: { warm: 0.6, casual: 0.4 },
      instructions: ['커플 스토리를 자연스럽게 녹여낸 감성 표현', '따뜻하고 편안한 소통 톤', '과장된 수식어 배제']
    },
    vibe: {
      name: '내추럴 에세이 바이브',
      ratios: { warmth: 0.45, aesthetics: 0.35, trustworthiness: 0.20 }
    },
    color: '#8b5cf6'
  },
  {
    slug: 'lumiere-studio',
    name_ko: '루미에 스튜디오',
    name_en: 'Lumière Studio',
    domains: ['lumierstudio.kr', 'lumierstudio.com'],
    strategic_intent: '빛의 예술을 추구하는 프렌치 감성 웨딩 포토그래피. 조명 디자인 특화 스튜디오.',
    claims: [
      '프렌치 빈티지 감성의 조명 디자인 특화 스튜디오',
      '커스텀 조명 설계 시스템 보유'
    ],
    forbidden_claims: [
      '국내 유일 프렌치 스튜디오',
      '조명 기술 세계 최고'
    ],
    safety_disclaimers: [
      '모든 조명 장비는 안전 인증을 받은 전문 장비입니다.',
      '촬영 패키지 가격은 시즌별로 변동될 수 있습니다.'
    ],
    concepts: [
      { id: 'french-vintage-lighting', label: '프렌치 빈티지 조명', definition: '프랑스 스타일의 따뜻하고 부드러운 빈티지 조명 세팅' },
      { id: 'custom-lighting-design', label: '커스텀 조명 디자인', definition: '커플 컨셉에 맞춤 설계하는 개인화된 조명 세팅 서비스' },
      { id: 'artistic-portrait', label: '아트 포트레이트', definition: '인물 중심 예술적 구도의 웨딩 초상 촬영' }
    ],
    products: [
      { name: '루미에르 시그니처', type: 'package', features: ['3시간 촬영', '커스텀 조명 3세트', '보정본 70컷', '아트 앨범 1권'] },
      { name: '루미에르 프렌치 빈티지 컬렉션', type: 'premium_package', features: ['5시간 촬영', '빈티지 세트 5개', '보정본 100컷', '대형 캔버스 1점'] }
    ],
    persona: {
      name: '루미에 Light Artist',
      tone_weights: { artistic: 0.5, formal: 0.3, warm: 0.2 },
      instructions: ['빛과 조명의 예술성 강조', '프렌치 감성의 우아한 표현', '기술적 조명 지식 기반 신뢰감 전달']
    },
    vibe: {
      name: '프렌치 아트 라이트 바이브',
      ratios: { aesthetics: 0.55, trustworthiness: 0.25, warmth: 0.20 }
    },
    color: '#ec4899'
  },
  {
    slug: 'roy-studio',
    name_ko: '로이 스튜디오',
    name_en: 'Roy Studio',
    domains: ['roystudio.co.kr', 'roy-studio.com'],
    strategic_intent: '모던 미니멀 웨딩 포토그래피. 깔끔한 라인과 세련된 컬러 팔레트의 현대적 웨딩 촬영.',
    claims: [
      '미니멀 디자인 기반 모던 웨딩 포토 전문',
      '색상 팔레트 커스터마이징 서비스'
    ],
    forbidden_claims: [
      '가장 세련된 스튜디오',
      '무조건 최저가'
    ],
    safety_disclaimers: [
      '촬영 일정은 최소 2주 전 예약이 필요합니다.',
      '환불 정책은 계약 조건에 따릅니다.'
    ],
    concepts: [
      { id: 'modern-minimal-wedding', label: '모던 미니멀 웨딩', definition: '불필요한 장식을 배제하고 깔끔한 구도와 색감에 집중하는 웨딩 촬영 스타일' },
      { id: 'color-palette-custom', label: '컬러 팔레트 커스터마이징', definition: '커플이 원하는 색상 톤을 사전 상담 후 세트 디자인에 반영하는 서비스' },
      { id: 'clean-backdrop-studio', label: '클린 백드롭 스튜디오', definition: '단순한 배경으로 인물을 부각하는 촬영 공간 설계' }
    ],
    products: [
      { name: '로이 모던 클래식', type: 'package', features: ['3시간 촬영', '보정본 60컷', '미니 앨범 1권'] },
      { name: '로이 시그니처 컬러', type: 'premium_package', features: ['4시간 촬영', '컬러 커스텀', '보정본 80컷', '하드커버 앨범'] }
    ],
    persona: {
      name: '로이 Minimalist Director',
      tone_weights: { clean: 0.5, formal: 0.3, confident: 0.2 },
      instructions: ['미니멀 미학 강조', '깔끔하고 군더더기 없는 설명', '품질과 디테일 중심 소통']
    },
    vibe: {
      name: '모던 미니멀 바이브',
      ratios: { clarity: 0.45, aesthetics: 0.35, trustworthiness: 0.20 }
    },
    color: '#10b981'
  },
  {
    slug: 'som-studio',
    name_ko: '섬 스튜디오',
    name_en: 'Som Studio',
    domains: ['somstudio.kr', 'som-studio.com'],
    strategic_intent: '섬세한 감성과 따뜻한 일상적 웨딩 포토그래피. 기념일 촬영부터 본식 스냅까지 라이프 포토 전문.',
    claims: [
      '섬세한 인물 묘사와 자연스러운 일상 웨딩 촬영',
      '프리웨딩부터 본식까지 토탈 웨딩 포토 서비스'
    ],
    forbidden_claims: [
      '가장 따뜻한 감성 스튜디오',
      '예약 보장'
    ],
    safety_disclaimers: [
      '야외 촬영 시 안전 사고에 대비한 보험이 포함됩니다.',
      '사진 원본 저장 기간은 촬영 후 6개월입니다.'
    ],
    concepts: [
      { id: 'daily-life-wedding', label: '일상 웨딩 포토', definition: '특별한 연출 없이 일상적 순간을 아름답게 포착하는 촬영 스타일' },
      { id: 'total-wedding-photo', label: '토탈 웨딩 포토', definition: '프리웨딩, 본식 스냅, 돌잔치까지 전 과정을 아우르는 촬영 서비스' },
      { id: 'warm-portrait', label: '따뜻한 인물 포트레이트', definition: '따뜻한 색감과 부드러운 빛으로 인물의 자연스러운 표정을 담는 기법' }
    ],
    products: [
      { name: '섬 데일리 패키지', type: 'package', features: ['2시간 촬영', '보정본 50컷', '디지털 앨범'] },
      { name: '섬 토탈 웨딩 플랜', type: 'premium_package', features: ['프리웨딩 3시간 + 본식 풀데이', '보정본 120컷', '하드커버 앨범 2권'] }
    ],
    persona: {
      name: '섬 Daily Life Photographer',
      tone_weights: { warm: 0.6, friendly: 0.3, honest: 0.1 },
      instructions: ['따뜻하고 일상적인 감성으로 소통', '꾸밈없는 자연스러운 아름다움 강조', '과대 수식 배제']
    },
    vibe: {
      name: '따뜻한 일상 바이브',
      ratios: { warmth: 0.50, aesthetics: 0.30, trustworthiness: 0.20 }
    },
    color: '#f59e0b'
  }
];

/**
 * Idempotent seeder for Wedding Studio domain — 5 actual brands
 */
export async function seedWeddingStudio(workspaceId: string, domainId: string) {
  console.log('═══════════════════════════════════════════════════');
  console.log('Seeding Wedding Studio Domain — 5 Brands Full-Loop');
  console.log('═══════════════════════════════════════════════════');
  const supabase = getSupabaseAdminClient();

  // Shared Methodology Disclosure
  const disclosure = await upsertRecord('methodology_disclosures', {
    workspace_id: workspaceId,
    disclosure_name: 'Wedding Studio Standard Crawl Disclosure v1',
    slug: 'wedding-studio-standard-crawl-disclosure',
    methodology_description: 'Aggregates 80 standard Goldilocks questions across 7 layers for wedding photo studio industry.',
    proxy_caveat_text: MOCK_PROXY_CAVEAT
  }, 'workspace_id,slug');
  logSeeded('methodology_disclosures', disclosure.id, 'Wedding Methodology Disclosure');

  // Shared Probe Panel
  const panel = await upsertRecord('probe_panels', {
    workspace_id: workspaceId,
    panel_name: 'BSW-WeddingStudio-Goldilocks-80Q-v1',
    slug: 'bsw-wedding-studio-goldilocks-80q-v1',
    is_locked: true
  }, 'workspace_id,slug');
  logSeeded('probe_panels', panel.id, 'Wedding Studio 80Q Panel');

  // Seed shared 80Q probe questions from INDUSTRY_PANELS_DATA
  const weddingPanelData = INDUSTRY_PANELS_DATA['wedding_studio'];
  if (weddingPanelData && weddingPanelData.questions) {
    console.log(`[Seeder] Inserting ${weddingPanelData.questions.length} shared wedding probe questions...`);
    let qCount = 0;

    for (const qSpec of weddingPanelData.questions) {
      const question = await upsertRecord('probe_questions', {
        workspace_id: workspaceId,
        probe_panel_id: panel.id,
        question_text: qSpec.question_text,
        intent_context: qSpec.intent_context,
        target_keyword: qSpec.target_keyword
      }, 'workspace_id,probe_panel_id,question_text');

      // Expected Layers (generic, without brand substitution)
      await upsertRecord('expected_layers', {
        workspace_id: workspaceId,
        probe_question_id: question.id,
        must_include: qSpec.must_include,
        should_include: qSpec.should_include,
        must_not_do: qSpec.must_not_do,
        expected_layer_version: 1
      }, 'workspace_id,probe_question_id');

      qCount++;
      if (qCount % 20 === 0) {
        console.log(`  ...seeded ${qCount}/${weddingPanelData.questions.length} questions.`);
      }
    }
    console.log(`  ✓ Completed seeding all ${qCount} shared questions and expected layers.`);
  }

  // Per-brand full loop
  for (const brand of WEDDING_BRANDS) {
    console.log(`\n──── Seeding Brand: ${brand.name_ko} (${brand.name_en}) ────`);

    // 1. Brand Truth
    const truth = await upsertRecord('brand_truths', {
      workspace_id: workspaceId,
      brand_name: brand.name_ko,
      strategic_intent: brand.strategic_intent,
      claims: { strategic: brand.claims[0], secondary: brand.claims.slice(1) },
      status: 'locked'
    }, 'workspace_id,brand_name');
    logSeeded('brand_truths', truth.id, brand.name_ko);

    // 2. Evidence
    const evidence = await upsertRecord('truth_evidence', {
      workspace_id: workspaceId,
      evidence_name: `${brand.name_ko} Portfolio & Studio Certificate 2026`,
      evidence_type: 'portfolio',
      raw_payload: { studio: brand.name_en, verified_year: 2026, portfolio_count: 500 },
      is_verified: true
    }, 'workspace_id,evidence_name');
    logSeeded('truth_evidence', evidence.id, `${brand.name_ko} Portfolio`);

    // 3. Boundary
    const boundary = await upsertRecord('claim_boundaries', {
      workspace_id: workspaceId,
      boundary_name: `${brand.name_ko} 마케팅 제한 바운더리`,
      restricted_claims: brand.forbidden_claims,
      safety_disclaimers: brand.safety_disclaimers
    }, 'workspace_id,boundary_name');
    logSeeded('claim_boundaries', boundary.id, `${brand.name_ko} Boundaries`);

    // 4. Question Capital
    const capital = await upsertRecord('question_capitals', {
      workspace_id: workspaceId,
      capital_name: `${brand.name_ko} 웨딩 촬영 탐색 인텐트`,
      target_demographics: ['engaged_couples', 'wedding_planners'],
      market_sizing: { cohort_size: 15000 }
    }, 'workspace_id,capital_name');
    logSeeded('question_capitals', capital.id, `${brand.name_ko} Intents`);

    // 5. Canonical Question
    const cq = await upsertRecord('canonical_questions', {
      workspace_id: workspaceId,
      question_capital_id: capital.id,
      unique_signature: `cq-wedding-${brand.slug}`,
      question_text: `${brand.name_ko} 웨딩 촬영 패키지와 포트폴리오 스타일은 어떤가요?`
    }, 'unique_signature');
    logSeeded('canonical_questions', cq.id, `${brand.name_ko} CQ`);

    // 6. QIS
    const qis = await upsertRecord('qis_scenes', {
      workspace_id: workspaceId,
      canonical_question_id: cq.id,
      scene_name: `${brand.name_en} wedding photo inquiry scene`,
      query_template: `What are the wedding photo packages at ${brand.name_en}?`,
      intent_model: 'informational'
    }, 'workspace_id,scene_name');
    logSeeded('qis_scenes', qis.id, `${brand.name_en} QIS`);

    // 7. TCO Concepts & 8. KG Nodes
    for (const conceptSpec of brand.concepts) {
      const concept = await upsertRecord('tco_concepts', {
        workspace_id: workspaceId,
        concept_name: conceptSpec.label,
        slug: `${brand.slug}-${conceptSpec.id}`,
        classification: 'wedding_photography'
      }, 'workspace_id,slug');
      logSeeded('tco_concepts', concept.id, `Concept: ${conceptSpec.label}`);

      const node = await upsertRecord('kg_nodes', {
        workspace_id: workspaceId,
        concept_id: concept.id,
        node_label: `${conceptSpec.label} Node`,
        attributes: { definition: conceptSpec.definition }
      }, 'workspace_id,concept_id');
      logSeeded('kg_nodes', node.id, `KG Node: ${conceptSpec.label}`);
    }

    // 9. Claim Lineage
    const lineage = await upsertRecord('claim_lineages', {
      workspace_id: workspaceId,
      truth_id: truth.id,
      unique_hash: `lineage-hash-wedding-${brand.slug}-001`,
      status: 'valid'
    }, 'workspace_id,unique_hash');
    logSeeded('claim_lineages', lineage.id, `${brand.name_ko} Claim Lineage`);

    // 10. Representation Objects (products/packages)
    for (const product of brand.products) {
      const slug = `${brand.slug}-${product.name.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-').replace(/-+/g, '-')}`;
      const repObject = await upsertRecord('representation_objects', {
        workspace_id: workspaceId,
        domain_id: domainId,
        object_name: product.name,
        slug,
        object_type: product.type,
        payload: { features: product.features, brand: brand.name_ko },
        is_ready: true
      }, 'workspace_id,slug');
      logSeeded('representation_objects', repObject.id, `Product: ${product.name}`);

      // 11. Surface Contract
      const contract = await upsertRecord('surface_contracts', {
        workspace_id: workspaceId,
        representation_object_id: repObject.id,
        contract_name: `${product.name} Surface Contract`,
        slug: `${slug}-contract`,
        structured_schema: { jsonld: 'Product', brand: brand.name_en }
      }, 'workspace_id,slug');
      logSeeded('surface_contracts', contract.id, `Contract: ${product.name}`);

      // 12. Semantic Page
      await upsertRecord('semantic_pages', {
        workspace_id: workspaceId,
        surface_contract_id: contract.id,
        page_title: `${product.name} 상세 안내`,
        slug: `${slug}-guide`,
        page_body: `${brand.name_ko}의 ${product.name} (${product.type}). 구성: ${product.features.join(', ')}.`
      }, 'workspace_id,slug');
    }

    // 13. PersonaSpec
    const persona = await upsertRecord('persona_specs', {
      workspace_id: workspaceId,
      persona_name: brand.persona.name,
      slug: `${brand.slug}-persona`,
      tone_weights: brand.persona.tone_weights,
      instructions: brand.persona.instructions
    }, 'workspace_id,slug');
    logSeeded('persona_specs', persona.id, `${brand.name_ko} Persona`);

    // 14. VibeSpec
    const vibe = await upsertRecord('vibe_specs', {
      workspace_id: workspaceId,
      vibe_name: brand.vibe.name,
      slug: `${brand.slug}-vibe`,
      vibe_ratios: brand.vibe.ratios,
      evidence_links_count: 3
    }, 'workspace_id,slug');
    logSeeded('vibe_specs', vibe.id, `${brand.name_ko} Vibe`);

    // 15. Observation Run (shared panel)
    const run = await upsertRecord('ai_observation_runs', {
      workspace_id: workspaceId,
      probe_panel_id: panel.id,
      observation_model: `${brand.name_en} Baseline Observation`,
      status: 'completed'
    }, 'workspace_id,observation_model');
    logSeeded('ai_observation_runs', run.id, `${brand.name_ko} Observation Run`);

    // 16. Mock Probe Run
    const firstQ = await supabase.from('probe_questions')
      .select('id')
      .eq('probe_panel_id', panel.id)
      .limit(1)
      .single();

    if (firstQ.data) {
      const probeRun = await upsertRecord('probe_runs', {
        workspace_id: workspaceId,
        ai_observation_run_id: run.id,
        probe_question_id: firstQ.data.id,
        raw_response_text: `${brand.name_ko}의 대표 웨딩 촬영 패키지와 포트폴리오 분석 결과를 포함합니다.`,
        status: 'success'
      }, 'workspace_id,ai_observation_run_id,probe_question_id');

      await upsertRecord('response_judgments', {
        workspace_id: workspaceId,
        probe_run_id: probeRun.id,
        reviewer_id: SIMULATED_USER_ID,
        is_citation_found: true,
        brand_semantic_fidelity_score: 85.0,
        geo_concept_transferred: true,
        question_territory_covered: true
      }, 'workspace_id,probe_run_id');
    }

    // 17. Metric Snapshot
    const snapshot = await upsertRecord('metric_snapshots', {
      workspace_id: workspaceId,
      ai_observation_run_id: run.id,
      metric_name: 'ARS',
      metric_value: 85.0
    }, 'workspace_id,ai_observation_run_id,metric_name');
    logSeeded('metric_snapshots', snapshot.id, `${brand.name_ko} ARS Snapshot`);

    // 18. Benchmark Report
    const report = await upsertRecord('benchmark_reports', {
      workspace_id: workspaceId,
      report_name: `${brand.name_ko} Wedding Photo Trust Report`,
      panel_version: 1,
      scores: { ARS: 85.0, OCR: 60.0, AAS: 55.0, BSF: 78.0 },
      methodology_disclosure_id: disclosure.id,
      is_published: true
    }, 'workspace_id,report_name');
    logSeeded('benchmark_reports', report.id, `${brand.name_ko} Report`);

    console.log(`  ✓ ${brand.name_ko} Full-Loop seeding completed.`);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('SUCCESS: Wedding Studio 5-Brand Full-Loop Seeding Done!');
  console.log('═══════════════════════════════════════════════════');
}
