import { getAllDomainSummaries } from '../../../../actions/benchmark';
import { getBenchmarkMeasurementHistory } from '../../../../actions/benchmark-history';
import BenchmarkDashboard from '../../../../../components/benchmark/BenchmarkDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AI Brand Benchmark | BSW-OS',
  description:
    'AI 검색 엔진(ChatGPT, Gemini) 기반 업종별 브랜드 AI 가시성 지표 대시보드. 스킨케어·웨딩·제주 글로벌 도메인의 AAS·OCR·BAIR 실측 순위.',
};

export default async function WorkspaceBenchmarkPage() {
  const [allSummaries, measurementHistory] = await Promise.all([
    getAllDomainSummaries(),
    getBenchmarkMeasurementHistory(),
  ]);

  return (
    <BenchmarkDashboard
      summaries={allSummaries}
      measurementHistory={measurementHistory}
    />
  );
}
