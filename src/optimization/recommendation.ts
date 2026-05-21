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

  const filtered = filterExperiments(experiments, options);

  if (filtered.length === 0) {
    throw new AppError(
      "NO_RECOMMENDATIONS",
      "No historical data points match your filter criteria.",
      404,
    );
  }

  const aiResult = await generateAIAnalysis(filtered, options.strategy);

  // Map the Gemini-generated summaries back onto the historical data rows
  const enrichedHistoricalData = filtered.map((exp) => {
    const aiSummary = aiResult.historicalSummaries?.[exp.id];
    return {
      ...exp,
      aiVerdictStatus: aiSummary?.status || "Neutral",
      aiVerdictSummary: aiSummary?.summary || exp.verdict || "Pending",
    };
  });

  return {
    strategy: options.strategy,
    marketCondition: options.marketCondition,
    recommendedParameters: aiResult.recommendedParameters,
    confidence: aiResult.confidence,
    expectedPnL: aiResult.expectedPnL,
    expectedFillRate: aiResult.expectedFillRate,
    sampleSize: filtered.length,
    explanation: aiResult.explanation,
    aiExplanation: aiResult.explanation,
    historicalDataPoints: enrichedHistoricalData, // Pass the enriched array to the frontend
  };
}
