/**
 * Core recommendation engine
 * Now powered 100% by Gemini AI
 */

import {
  NormalizedExperiment,
  FilterOptions,
  RecommendationResponse,
} from "@/src/types/strategy";
import { filterExperiments } from "@/src/optimization/filtering";
import { generateAIAnalysis } from "@/src/optimization/aiAnalyzer";
import { AppError, logger } from "@/src/utils/errors";

export async function generateRecommendation(
  experiments: NormalizedExperiment[],
  options: FilterOptions,
): Promise<RecommendationResponse> {
  logger("info", "Starting AI-driven optimization pipeline");

  // 1. Filter the dataset based on strategy and exact date
  const filtered = filterExperiments(experiments, options);

  if (filtered.length === 0) {
    throw new AppError(
      "NO_RECOMMENDATIONS",
      "No historical data points match your filter criteria.",
      404,
    );
  }

  // 2. Delegate the entire optimization process to Gemini
  // We send the full filtered dataset to the AI
  const aiResult = await generateAIAnalysis(filtered, options.strategy);

  // 3. Return the AI's JSON output alongside ALL historical data points
  return {
    strategy: options.strategy,
    marketCondition: options.marketCondition,
    recommendedParameters: aiResult.recommendedParameters,
    confidence: aiResult.confidence,
    expectedPnL: aiResult.expectedPnL,
    expectedFillRate: aiResult.expectedFillRate,
    sampleSize: filtered.length,
    explanation: aiResult.explanation,
    aiExplanation: aiResult.explanation, // Maintained for UI compatibility
    historicalDataPoints: filtered, // Returning ALL filtered records to the UI table!
  };
}
