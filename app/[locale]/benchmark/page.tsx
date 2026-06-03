import { getAllDomainSummaries } from '../../actions/benchmark';
import BenchmarkDashboard from '../../../components/benchmark/BenchmarkDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AI Brand Visibility Benchmark | BSW-OS',
  description:
    'AI 검색 엔진(ChatGPT, Gemini) 기반 업종별 브랜드 AI 가시성 지표 공개 대시보드. 스킨케어·웨딩 포토 스튜디오 도메인의 AAS·OCR·BAIR 실측 순위.',
};

export default async function BenchmarkPage() {
  // Server Component에서 데이터 fetch
  const allSummaries = await getAllDomainSummaries();

  return <BenchmarkDashboard summaries={allSummaries} />;
}
