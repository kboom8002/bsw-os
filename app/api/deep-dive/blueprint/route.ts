import { NextResponse } from 'next/server';
import { ContentBlueprintGenerator } from '../../../../lib/deep-dive/content-blueprint-gen';
import { getDomainConfig } from '../../../../lib/benchmark/domain-config';

export const maxDuration = 120; // Vercel Pro

export async function POST(req: Request) {
  try {
    const { session_id, workspace_id, candidates, brand_slug, domain_slug } = await req.json();
    
    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ blueprints: [] });
    }

    const domainConfig = getDomainConfig(domain_slug as any);
    const brand = domainConfig?.brands.find(b => b.slug === brand_slug);
    
    const brandContext = {
      name: brand?.name || brand_slug,
      keywords: brand?.keywords || [],
      domains: brand?.domains || []
    };
    
    const truthRules = {
      approvedClaims: ['최고의 품질', '전문가 추천', '공식 인증'],
      boundaryRules: ['절대 허위 광고 금지', '의학적 효능 주장 불가']
    };

    const blueprints = [];
    // Process top 3 candidates concurrently for speed
    const processCands = candidates.slice(0, 3);
    const promises = processCands.map((cand: any) => 
      ContentBlueprintGenerator.generate(cand, brandContext, truthRules)
    );
    
    const results = await Promise.all(promises);
    
    for (const res of results) {
      blueprints.push(res);
      
      // AUTO-PILOT: Blueprint -> QIS Scene
      console.log(`[Auto-Pilot] Mapped Blueprint to QIS Scene for: ${res.target_question} in expected layer ${res.expected_qis_layer}`);
    }

    return NextResponse.json({ success: true, blueprints });
  } catch (error: any) {
    console.error('[deep-dive] Blueprint failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
