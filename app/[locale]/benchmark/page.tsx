import { redirect } from 'next/navigation';
import { getSupabaseAdminClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * 기존 공개 벤치마크 URL(/[locale]/benchmark)을
 * 워크스페이스 내 벤치마크(/[locale]/[workspace_slug]/benchmark)로 리다이렉트합니다.
 */
export default async function LegacyBenchmarkRedirectPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const supabase = getSupabaseAdminClient();

  try {
    if (supabase) {
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('slug')
        .limit(1);

      if (workspaces?.[0]?.slug) {
        redirect(`/${locale}/${workspaces[0].slug}/benchmark`);
      }
    }
  } catch {
    // Fall through to default redirect
  }

  redirect(`/${locale}`);
}
