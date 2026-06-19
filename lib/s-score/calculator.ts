import { CanonicalQuestion, QuestionCapitalNode } from "@/lib/schema";

interface SScoreDimensions {
  completeness: number;  // 25% weight
  visibility: number;    // 30% weight
  opportunity: number;   // 25% weight
  readiness: number;     // 20% weight
}

export interface SScoreResult {
  total_score: number;
  dimensions: SScoreDimensions;
  canonical_question_id: string;
  calculated_at: string;
}

export class SScoreCalculator {
  /**
   * Calculates the S-Score for a Canonical Question.
   * Note: In a real environment, this would fetch data from DB. 
   * Here we mock the inputs for the demo.
   */
  static calculate(
    questionId: string, 
    mockData?: Partial<SScoreDimensions>
  ): SScoreResult {
    
    // Default mock calculation if data is not fully provided
    const completeness = mockData?.completeness ?? Math.floor(Math.random() * 40) + 60; // 60-100
    const visibility = mockData?.visibility ?? Math.floor(Math.random() * 50) + 30; // 30-80
    const opportunity = mockData?.opportunity ?? Math.floor(Math.random() * 60) + 40; // 40-100
    const readiness = mockData?.readiness ?? Math.floor(Math.random() * 100); // 0-100

    const total_score = Math.round(
      (completeness * 0.25) +
      (visibility * 0.30) +
      (opportunity * 0.25) +
      (readiness * 0.20)
    );

    return {
      total_score,
      dimensions: {
        completeness,
        visibility,
        opportunity,
        readiness
      },
      canonical_question_id: questionId,
      calculated_at: new Date().toISOString()
    };
  }

  /**
   * Calculates S-Score and determines if the strategic_weight should be auto-boosted.
   */
  static evaluateStrategicWeightAction(scoreResult: SScoreResult, currentWeight: number): number {
    // Auto-boost weight if S-Score is low but opportunity is high
    if (scoreResult.total_score < 40 && scoreResult.dimensions.opportunity > 70) {
      return Math.min(100, currentWeight + 20); 
    }
    return currentWeight;
  }
}
