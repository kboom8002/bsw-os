import { NextRequest, NextResponse } from 'next/server';
import { SScoreCalculator } from '@/lib/s-score/calculator';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cqId = searchParams.get('question_id');

    if (!cqId) {
      return NextResponse.json(
        { error: 'question_id is required' },
        { status: 400 }
      );
    }

    // MOCK: In production, fetch lifecycle from DB
    // Returning a dummy lifecycle stage and S-Score for demo purposes
    
    // Simulate fetching S-Score
    const sScore = SScoreCalculator.calculate(cqId);

    // Mock stages and metrics
    const stages = ['signal', 'cq', 'benchmarked', 'targeted', 'blueprinted', 'verified'];
    // Randomly pick a stage for the demo based on the CQ ID
    const randomStageIndex = Math.floor(Math.random() * stages.length);
    const currentStage = stages[Math.min(randomStageIndex + 2, stages.length - 1)]; // Usually advanced

    const payload = {
      question_id: cqId,
      lifecycle: {
        stage: currentStage,
        signal_mined: true,
        cq_approved: true,
        benchmark_snapshot_id: "snap-mock",
        deep_dive_session_id: currentStage === 'targeted' || currentStage === 'blueprinted' ? "sess-mock" : null,
        blueprint_id: currentStage === 'blueprinted' || currentStage === 'verified' ? "bp-mock" : null,
      },
      metrics: {
        s_score: sScore.total_score,
        dimensions: sScore.dimensions,
        aas: Math.floor(Math.random() * 50) + 40,
        ocr: Math.floor(Math.random() * 60) + 20,
        gap_severity: "high"
      }
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Failed to fetch lifecycle status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
