import crypto from "crypto";
import {
  NormalizedExperiment,
  FilterOptions,
  RecommendationResponse,
} from "@/src/types/strategy";
import { filterExperiments } from "@/src/optimization/filtering";
import { generateAIAnalysis } from "@/src/optimization/aiAnalyzer";
import { AppError, logger } from "@/src/utils/errors";

// Create a secure in-memory cache for the AI responses
const aiCache = new Map<
  string,
  { data: RecommendationResponse; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

  // Generate a unique hash based on the exact data being sent to the AI
  const cachePayload = JSON.stringify({
    strategy: options.strategy,
    condition: options.marketCondition,
    count: filtered.length,
  });
  const cacheKey = crypto
    .createHash("sha256")
    .update(cachePayload)
    .digest("hex");

  // Check if we already asked the AI this exact question in the last 5 minutes
  const cached = aiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger(
      "info",
      "Returning safely cached AI recommendation (Protects API Quota)",
    );
    return cached.data;
  }

  // If not cached, call Gemini
  const aiResult = await generateAIAnalysis(filtered, options.strategy);

  const response: RecommendationResponse = {
    strategy: options.strategy,
    marketCondition: options.marketCondition,
    recommendedParameters: aiResult.recommendedParameters,
    confidence: aiResult.confidence,
    expectedPnL: aiResult.expectedPnL,
    expectedFillRate: aiResult.expectedFillRate,
    sampleSize: filtered.length,
    explanation: aiResult.explanation,
    historicalDataPoints: filtered,
  };

  // Save to cache before returning
  aiCache.set(cacheKey, { data: response, timestamp: Date.now() });
  return response;
}
