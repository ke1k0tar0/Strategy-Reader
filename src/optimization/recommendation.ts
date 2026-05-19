/**
 * Recommendation engine
 * Generates optimization recommendations based on historical data
 */

import {
  NormalizedExperiment,
  RecommendationResponse,
  FilterOptions,
  ParameterSet,
} from "@/src/types/strategy";
import { filterExperiments } from "@/src/optimization/filtering";
import { scoreExperiments } from "@/src/optimization/scoring";
import {
  groupByParameterSet,
  calculateParameterCombinationStats,
  rankParameterCombinations,
  calculateConfidence,
  ParameterCombinationStats,
} from "@/src/optimization/ranking";
import { generateExplanation } from "@/src/optimization/explanations";
import { logger, AppError } from "@/src/utils/errors";

/**
 * Generate recommendation for a strategy
 */
export async function generateRecommendation(
  allExperiments: NormalizedExperiment[],
  filterOptions: FilterOptions,
): Promise<RecommendationResponse> {
  try {
    logger("info", "Generating recommendation", {
      strategy: filterOptions.strategy,
    });

    // Step 1: Filter experiments
    const filtered = filterExperiments(allExperiments, filterOptions);

    if (filtered.length === 0) {
      throw new AppError(
        "NO_DATA",
        `No experiments found for strategy: ${filterOptions.strategy}`,
        404,
      );
    }

    logger("info", `Filtered to ${filtered.length} experiments`);

    // Step 2: Score experiments
    const scored = scoreExperiments(filtered);

    // Step 3: Group by parameter set
    const groups = groupByParameterSet(scored);

    // Step 4: Calculate stats for each combination
    const stats = calculateParameterCombinationStats(groups);

    // Step 5: Rank combinations
    const ranked = rankParameterCombinations(stats, 1); // minOccurrences = 1 for now

    if (ranked.length === 0) {
      throw new AppError(
        "NO_RECOMMENDATIONS",
        "Unable to generate recommendation from available data",
        400,
      );
    }

    // Step 6: Select best recommendation
    const bestStats = ranked[0];
    const confidence = calculateConfidence(bestStats, filtered.length);

    // Step 7: Generate explanation
    const explanation = generateExplanation(
      bestStats,
      filterOptions,
      scored.length,
      ranked.slice(0, 3),
    );

    // Step 8: Format response
    const response: RecommendationResponse = {
      strategy: filterOptions.strategy,
      marketCondition: filterOptions.marketCondition,
      recommendedParameters: bestStats.parameterSet,
      confidence,
      expectedPnL: bestStats.averagePnL,
      expectedFillRate: bestStats.averageFills,
      sampleSize: bestStats.occurrences,
      explanation,
      historicalDataPoints: bestStats.experiments.slice(0, 10), // Return top 10 supporting experiments
    };

    logger("info", "Recommendation generated successfully", {
      strategy: response.strategy,
      confidence: response.confidence.toFixed(3),
      sampleSize: response.sampleSize,
    });

    return response;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "RECOMMENDATION_FAILED",
      "Failed to generate recommendation",
      500,
      error,
    );
  }
}

/**
 * Generate multiple recommendations for different market conditions
 */
export async function generateMultiConditionRecommendations(
  allExperiments: NormalizedExperiment[],
  strategy: string,
  marketConditions: string[],
): Promise<RecommendationResponse[]> {
  const recommendations: RecommendationResponse[] = [];

  for (const condition of marketConditions) {
    try {
      const rec = await generateRecommendation(allExperiments, {
        strategy,
        marketCondition: condition,
      });
      recommendations.push(rec);
    } catch (error) {
      logger(
        "warn",
        `Failed to generate recommendation for condition: ${condition}`,
        error,
      );
    }
  }

  return recommendations;
}

/**
 * Get recommendation alternatives (top-N parameter sets)
 */
export function getRecommendationAlternatives(
  allExperiments: NormalizedExperiment[],
  filterOptions: FilterOptions,
  topN: number = 5,
): ParameterSet[] {
  try {
    // Filter and score
    const filtered = filterExperiments(allExperiments, filterOptions);
    const scored = scoreExperiments(filtered);

    // Group and rank
    const groups = groupByParameterSet(scored);
    const stats = calculateParameterCombinationStats(groups);
    const ranked = rankParameterCombinations(stats, 1);

    // Return top-N parameter sets
    return ranked.slice(0, topN).map((r) => r.parameterSet);
  } catch (error) {
    logger("error", "Failed to get recommendation alternatives", error);
    return [];
  }
}
