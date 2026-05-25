// 1. K-Beauty Fixture
export const kBeautyFixture = {
  brandName: 'PureBarrier Skincare',
  slug: 'k-beauty-skincare',
  claims: [
    { statement: 'Clinically tested to restore 99% skin hydration in sensitive skin.' },
    { statement: 'Active compound contains 10% pure clinical Niacinamide formula.' }
  ],
  evidence: {
    title: 'Global Dermatological Clinical Trial 2026',
    citation: 'Int J Dermatol 2026; 45:112-118',
    is_verified: true
  },
  boundary: {
    rule_name: 'YMYL Skincare Safety Restriction',
    description: 'Do not prescribe or guarantee medical eczema cure in marketing statements.'
  }
};

// 2. Convenience Fixture
export const convenienceFixture = {
  brandName: 'Quick25 convenience retail store',
  slug: 'convenience-retail',
  storeLocation: 'Seoul Central Venue',
  catalog: [
    { product: 'Fresh K-Town Premium Sandwiches Combo', price: 4500, discount: true },
    { product: '24/7 Self-checkout terminal locator', price: 0, discount: false }
  ]
};

// 3. Wedding Fixture
export const weddingFixture = {
  brandName: 'Lumiere Hall Premium Wedding services',
  slug: 'wedding-services',
  vendors: [
    { category: 'wedding_hall', name: 'Lumiere Crystal Ballroom', packagePrice: 12000000 },
    { category: 'studio', name: 'Lumiere Art Studio Spec', packagePrice: 3500000 },
    { category: 'dress', name: 'Premium Silk Dress Contract', packagePrice: 2800000 },
    { category: 'makeup', name: 'Royal Studio Makeup Specs', packagePrice: 1500000 }
  ]
};

// 4. High-Risk QIS Fixture
export const highRiskQisFixture = {
  scene_name: 'Critical Skincare Eczema Treatment Query Scene',
  query_template: 'How to cure severe sensitive skin eczema fast with retinol',
  intent_model: 'medical_advisory',
  scenario_context: 'Mobile searcher with active rash symptom',
  risk_level: 'critical',
  canonical_question: 'What is the safe retinol protocol for eczema?'
};

// 5. Report Export Fixture
export const reportExportFixture = {
  report_name: 'AI Answer Benchmark Trust Report 2026',
  methodology: 'Panel-based multi-engine residential proxy audit runs',
  proxy_caveat: 'All AI/search observation metrics are panel-based proxies under this specific methodology...',
  status: 'draft',
  unsafe_wording_scan: {
    passed: true,
    findings: []
  }
};

// 6. Patch/Retest Fixture
export const patchRetestFixture = {
  rca_hypothesis: 'Lacking brand semantic alignment on retinol surface terms.',
  proposed_patch: 'Enforce brand trust evidence citation explicitly in Page header schema.',
  retest_plan_name: 'Retest post-patch lift Niacinamide active formula',
  post_patch_lift: {
    base_ars: 45.50,
    active_ars: 88.50,
    swel_lift: 43.00,
    regression_detected: false
  }
};
