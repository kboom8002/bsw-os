/**
 * app/api/golden/export/route.ts
 *
 * 골든 레퍼런스 산출물 JSON 파일 다운로드 API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subIndustryKey = searchParams.get('subIndustryKey');
  const deliverable = searchParams.get('deliverable'); // tokens|layouts|sections|content|images|quality|all

  if (!subIndustryKey) {
    return NextResponse.json({ error: 'subIndustryKey 필수' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from('golden_reference_outputs')
      .select('deliverable_type, output_data, sample_count, generated_at')
      .eq('sub_industry_key', subIndustryKey);

    if (deliverable && deliverable !== 'all') {
      query = query.eq('deliverable_type', deliverable);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({ error: '산출물 없음. 먼저 합의 생성을 실행하세요.' }, { status: 404 });
    }

    // 산출물 조합
    let outputData: any;
    let filename: string;

    if (deliverable === 'all' || !deliverable) {
      const combined: Record<string, any> = {
        meta: {
          subIndustryKey,
          sampleCount: data[0]?.sample_count,
          generatedAt: data[0]?.generated_at,
          version: 'v1.0',
          format: 'GoldenReferenceBundle',
        },
      };
      for (const row of data) {
        combined[row.deliverable_type] = row.output_data;
      }
      outputData = combined;
      filename = `${subIndustryKey}_golden_reference_bundle.json`;
    } else {
      outputData = {
        meta: {
          subIndustryKey,
          deliverableType: deliverable,
          sampleCount: data[0]?.sample_count,
          generatedAt: data[0]?.generated_at,
          version: 'v1.0',
        },
        ...data[0]?.output_data,
      };
      filename = `${subIndustryKey}_golden_${deliverable}.json`;
    }

    const jsonString = JSON.stringify(outputData, null, 2);

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(Buffer.byteLength(jsonString, 'utf8')),
      },
    });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
