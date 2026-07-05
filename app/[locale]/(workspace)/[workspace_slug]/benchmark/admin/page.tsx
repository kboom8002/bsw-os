import BenchmarkAdminPanel from '../../../../../../components/benchmark/BenchmarkAdminPanel';
import { LayoutDashboard, Settings } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Benchmark Admin | BSW-OS',
  description: '벤치마크 테마 및 프로브셋 질문 관리 어드민 페이지',
};

interface Props {
  params: { locale: string; workspace_slug: string };
}

export default function BenchmarkAdminPage({ params }: Props) {
  const { locale, workspace_slug } = params;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Admin header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="px-6 h-14 flex items-center gap-4">
          {/* Breadcrumb */}
          <Link
            href={`/${locale}/${workspace_slug}/benchmark`}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>벤치마크</span>
          </Link>
          <span className="text-slate-700">/</span>
          <div className="flex items-center gap-1.5 text-slate-200 text-sm font-semibold">
            <Settings className="h-4 w-4 text-indigo-400" />
            <span>어드민</span>
          </div>

          <div className="ml-auto">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              ADMIN ONLY
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 py-6 max-w-6xl w-full mx-auto flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-100">벤치마크 어드민</h1>
          <p className="text-sm text-slate-400 mt-1">
            테마 설정, 프로브셋 질문 조회, 브랜드 구성을 관리합니다.
          </p>
        </div>

        <BenchmarkAdminPanel />
      </main>
    </div>
  );
}
