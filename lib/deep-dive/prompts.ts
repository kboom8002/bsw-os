export const DEEP_DIVE_PROMPTS = {
  classifyMention: {
    system: `You are an expert brand analyst. Analyze the following AI search response and classify how the brand "{brandName}" is mentioned in the context of the question: "{questionText}".
You must return a valid JSON object with the following fields:
- sentiment: 'positive' | 'neutral' | 'negative'
- isRecommendation: boolean (Is the brand explicitly recommended or just listed?)
- isMereListing: boolean (Is the brand just part of a long list without specific details?)
- isComparativeWin: boolean (Is the brand positioned as superior to others?)
- confidenceScore: number (0.0 to 1.0)
- reasoning: string (Brief explanation)`,
    user: `Brand: {brandName}
Question: {questionText}
AI Response: {responseText}`
  },
  
  discoverTargets: {
    system: `You are a strategic brand consultant specializing in AI Search Optimization (AEO/GEO).
Your task is to identify high-impact questions that specifically feature or should feature the brand "{brandName}" in the "{domainSlug}" domain.

CRITICAL RULES:
1. Every question MUST be relevant to "{brandName}" — it should be a question where "{brandName}" can naturally appear as a recommended answer, a comparison subject, or a topic of discussion.
2. DO NOT generate questions that compare two competitors without involving "{brandName}". For example, if {brandName} is "DR.O", do NOT suggest "토리든 vs 라운드랩 비교" — this is irrelevant.
3. Good examples: "{brandName} 제품 효과 후기", "{brandName} vs [경쟁사] 비교", "{brandName}이 추천하는 [카테고리]", "[카테고리] 추천 브랜드" (where {brandName} should appear in the answer)
4. Focus on questions where {brandName} currently has low AI visibility but high potential to win.

Suggest exactly 5 highly strategic questions. Return a valid JSON object with a "candidates" array, where each object has:
- question_text: string (must be relevant to {brandName})
- eeat_dimension: 'expertise' | 'experience' | 'authority' | 'trust'
- rationale: string (Why is this a good opportunity for {brandName}?)
- estimated_impact: number (1 to 100, how much it will help {brandName}'s visibility)
- estimated_difficulty: number (1 to 100, how hard it is for {brandName} to win)`,
    user: `Target Brand: {brandName}
Domain: {domainSlug}
Existing Gaps (questions where {brandName} is missing): {existingGaps}

Generate 5 strategic questions where {brandName} should be visible but currently isn't. Remember: every question must be about or directly relevant to {brandName}.`
  },
  
  contentBlueprint: {
    system: `You are an expert SEO and AI-Search content strategist. Create a content blueprint to rank for the question: "{questionText}".
The brand is "{brandName}".
Return a valid JSON object with the following fields:
- title_suggestion_ko: string
- heading_structure: Array of objects { level: 'h2'|'h3', text: string, target_keyword: string, is_question_heading: boolean }
- expected_layer: object { must_include: string[], strongly_recommended: string[], should_include: string[], caution: string[], must_not_do: string[] }
Make sure to adhere to these approved claims: {approvedClaims}
And these boundaries/restrictions: {boundaryRules}`,
    user: `Question: {questionText}
Brand: {brandName}`
  },

  executiveSummary: {
    system: `You are an executive consultant. Write a 3-4 sentence high-level summary of the Deep Dive Simulation results for the brand "{brandName}".
Focus on the projected ROI (AEPI / BDR delta), the main strategic moves, and the recommended action.
Write in professional Korean.
Return a valid JSON object: { "executiveSummary": string }`,
    user: `Current Metrics: {currentMetrics}
Projected Metrics: {projectedMetrics}
Top Scenarios: {scenarios}`
  },

  nicheDiscovery: {
    system: `You are an AI Search Optimization (AEO/GEO) strategist specializing in niche question discovery for smaller brands.

CONTEXT: The brand "{brandName}" operates in the "{domainSlug}" domain. Large competitors dominate broad/canonical questions. Your job is to find NICHE (long-tail, specific) questions that:
1. Are **closely related** to the given canonical questions (topical relevance)
2. Have **high strategic impact** — answering them builds the brand's E-E-A-T signal which eventually helps win canonical questions too
3. Are **easy to win** — no major competitor has established dominance in these specific queries yet

STRATEGY:
- Add specificity: ingredient + skin condition + context (e.g. "세라마이드 크림 아토피 피부에 장기간 써도 안전한가요?")
- Add user scenario: routine + timing + combination (e.g. "레티놀 사용 후 {brandName} 보습 크림 바로 발라도 되나요?")
- Add comparison niche: {brandName} vs specific competitor on specific attribute
- Add experience: real usage questions (e.g. "{brandName} 한 달 사용 후기 변화")

CRITICAL: Every niche question MUST be relevant to "{brandName}" — it should naturally lead to {brandName} being mentioned or recommended.

Return a valid JSON with a "niches" array (exactly 5 items), each with:
- niche_question: string (the specific niche question in Korean)
- parent_question: string (the canonical question this derives from — copy exactly from input)
- eeat_dimension: 'expertise' | 'experience' | 'authority' | 'trust'
- rationale: string (why {brandName} can win this niche, in Korean)
- relevance_to_parent: number (0-100, how related to the canonical question)
- estimated_impact: number (0-100, strategic value for brand visibility)
- estimated_difficulty: number (0-100, how hard to win — lower = easier)`,
    user: `Target Brand: {brandName}
Domain: {domainSlug}

Canonical Questions (hard to win, but important):
{canonicalQuestions}

For each canonical question, find 1 highly strategic niche variant where {brandName} can realistically win. Return exactly 5 niches total.`
  },

  brandFitFilter: {
    system: `You are a brand-product fit analyst. Your job is to determine whether each candidate question is RELEVANT to "{brandName}".

BRAND PROFILE:
- Name: {brandName}
- Products/Categories: {productCategories}
- Brand Identity: {brandIdentity}

RULES:
1. A question is "fit" if {brandName} has a product or expertise that can genuinely answer it.
2. A question is "unfit" if it asks about product categories {brandName} does NOT carry (e.g., asking about cleansers when the brand only sells creams).
3. Generic category questions (e.g., "좋은 스킨케어 추천") are "fit" if the brand has ANY product in that broad category.
4. Ingredient-specific questions are "fit" ONLY if the brand uses that specific ingredient.
5. Be strict: borderline cases should be marked as "partial" not "fit".

Return a JSON object with a "results" array, where each item has:
- question_index: number (0-based index)
- fit: 'fit' | 'partial' | 'unfit'
- reason: string (brief Korean explanation, max 20 chars)
- adjusted_priority: number (multiply original priority: fit=1.0, partial=0.5, unfit=0.0)`,
    user: `Evaluate brand-product fit for these candidate questions:

{candidateQuestions}

Return your assessment for each question.`
  }
};
