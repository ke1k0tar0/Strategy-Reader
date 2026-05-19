/**
 * Ranking and aggregation engine
 * Ranks parameter combinations by performance
 */

import { NormalizedExperiment, ParameterSet } from "@/src/types/strategy";
import { logger } from "@/src/utils/errors";

/**
 * Parameter combination stats
 */
export interface ParameterCombinationStats {
  parameterSet: ParameterSet;
  occurrences: number;
  averageScore: number;
  averagePnL: number;
  averageFills: number;
  totalPnL: number;
  experiments: NormalizedExperiment[];
}

/**
 * Group experiments by parameter set
 */
export function groupByParameterSet(
  experiments: NormalizedExperiment[],
): Map<string, NormalizedExperiment[]> {
  const groups = new Map<string, NormalizedExperiment[]>();

  experiments.forEach((exp) => {
    const key = JSON.stringify(exp.parameterSet);
    const group = groups.get(key) || [];
    group.push(exp);
    groups.set(key, group);
  });

  return groups;
}

/**
 * Calculate stats for parameter combinations
 */
export function calculateParameterCombinationStats(
  groups: Map<string, NormalizedExperiment[]>,
): ParameterCombinationStats[] {
  const stats: ParameterCombinationStats[] = [];

  groups.forEach((experiments, paramSetJson) => {
    const parameterSet = JSON.parse(paramSetJson) as ParameterSet;

    const scores = experiments.map((e) => e.score);
    const pnls = experiments.map((e) => e.pnl);
    const fills = experiments.map((e) => e.fills);

    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const averagePnL = pnls.reduce((a, b) => a + b, 0) / pnls.length;
    const averageFills = fills.reduce((a, b) => a + b, 0) / fills.length;
    const totalPnL = pnls.reduce((a, b) => a + b, 0);

    stats.push({
      parameterSet,
      occurrences: experiments.length,
      averageScore,
      averagePnL,
      averageFills,
      totalPnL,
      experiments,
    });
  });

  return stats;
}

/**
 * Rank parameter combinations by score
 */
export function rankParameterCombinations(
  stats: ParameterCombinationStats[],
  minOccurrences: number = 1,
): ParameterCombinationStats[] {
  return stats
    .filter((s) => s.occurrences >= minOccurrences)
    .sort((a, b) => {
      // Primary: average score
      if (a.averageScore !== b.averageScore) {
        return b.averageScore - a.averageScore;
      }
      // Secondary: average PnL
      if (a.averagePnL !== b.averagePnL) {
        return b.averagePnL - a.averagePnL;
      }
      // Tertiary: occurrence count (prefer more tested)
      return b.occurrences - a.occurrences;
    });
}

/**
 * Find similar parameter combinations within tolerance
 */
export function findSimilarCombinations(
  targetParams: ParameterSet,
  allStats: ParameterCombinationStats[],
  tolerance: number = 0.05, // 5% tolerance
): ParameterCombinationStats[] {
  return allStats.filter((stat) => {
    return Object.entries(targetParams).every(([key, value]) => {
      const statValue = stat.parameterSet[key];

      if (typeof value === "number" && typeof statValue === "number") {
        const diff =
          Math.abs(value - statValue) / Math.max(Math.abs(value), 0.0001);
        return diff <= tolerance;
      }

      return value === statValue;
    });
  });
}

/**
 * Merge similar parameter sets based on threshold
 */
export function mergeSimilarParameterSets(
  stats: ParameterCombinationStats[],
  tolerance: number = 0.1,
): ParameterCombinationStats[] {
  const merged: ParameterCombinationStats[] = [];
  const processed = new Set<number>();

  stats.forEach((stat, index) => {
    if (processed.has(index)) return;

    const similar = [stat];
    processed.add(index);

    // Find all similar combinations
    stats.forEach((other, otherIndex) => {
      if (otherIndex <= index || processed.has(otherIndex)) return;

      const isSimilar = Object.entries(stat.parameterSet).every(
        ([key, value]) => {
          const otherValue = other.parameterSet[key];

          if (typeof value === "number" && typeof otherValue === "number") {
            const diff =
              Math.abs(value - otherValue) / Math.max(Math.abs(value), 0.0001);
            return diff <= tolerance;
          }

          return value === otherValue;
        },
      );

      if (isSimilar) {
        similar.push(other);
        processed.add(otherIndex);
      }
    });

    // Merge similar combinations
    const mergedExperiments = similar.flatMap((s) => s.experiments);
    const mergedScores = mergedExperiments.map((e) => e.score);
    const mergedPnLs = mergedExperiments.map((e) => e.pnl);
    const mergedFills = mergedExperiments.map((e) => e.fills);

    merged.push({
      parameterSet: stat.parameterSet,
      occurrences: mergedExperiments.length,
      averageScore:
        mergedScores.reduce((a, b) => a + b, 0) / mergedScores.length,
      averagePnL: mergedPnLs.reduce((a, b) => a + b, 0) / mergedPnLs.length,
      averageFills: mergedFills.reduce((a, b) => a + b, 0) / mergedFills.length,
      totalPnL: mergedPnLs.reduce((a, b) => a + b, 0),
      experiments: mergedExperiments,
    });
  });

  logger("info", `Merged parameter sets: ${stats.length} → ${merged.length}`);

  return merged;
}

/**
 * Calculate confidence score for a recommendation
 */
export function calculateConfidence(
  stats: ParameterCombinationStats,
  totalExperiments: number,
): number {
  // Factor 1: occurrence frequency (0.4 weight)
  const frequencyScore = Math.min(
    1,
    stats.occurrences / Math.max(totalExperiments * 0.1, 5),
  );

  // Factor 2: consistency (low variance) (0.3 weight)
  const scores = stats.experiments.map((e) => e.score);
  const variance =
    scores.reduce((sum, s) => sum + Math.pow(s - stats.averageScore, 2), 0) /
    scores.length;
  const consistencyScore = Math.exp(-variance * 2); // Exponential decay

  // Factor 3: performance quality (0.3 weight)
  const performanceScore = Math.min(1, stats.averageScore * 1.2);

  const confidence =
    frequencyScore * 0.4 + consistencyScore * 0.3 + performanceScore * 0.3;

  return Math.max(0, Math.min(1, confidence));
}
