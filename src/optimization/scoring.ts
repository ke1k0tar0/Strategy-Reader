/**
 * Scoring engine
 * Converts experiment outcomes into comparable optimization scores
 */

import { NormalizedExperiment, ScoringConfig } from "@/src/types/strategy";
import { logger } from "@/src/utils/errors";

/**
 * Default scoring configuration
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  pnlWeight: 0.5,
  fillsWeight: 0.3,
  riskPenaltyWeight: 0.2,
};

/**
 * Calculate risk penalty based on fills and verdict
 */
function calculateRiskPenalty(experiment: NormalizedExperiment): number {
  let penalty = 0;

  // Penalize low fill rates
  if (experiment.fills < 50) {
    penalty += (50 - experiment.fills) * 0.02;
  }

  // Penalize negative verdict
  if (
    experiment.verdict.toLowerCase().includes("fail") ||
    experiment.verdict.toLowerCase().includes("poor")
  ) {
    penalty += 2;
  }

  return Math.max(0, penalty);
}

/**
 * Normalize value to 0-1 range using min-max normalization
 */
function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0.5; // Return neutral value if range is zero
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Calculate score for a single experiment
 */
export function calculateExperimentScore(
  experiment: NormalizedExperiment,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
  normalizedPnL?: number,
  normalizedFills?: number,
): number {
  // Use provided normalized values or normalize directly
  const pnlComponent =
    (normalizedPnL ?? normalizeValue(experiment.pnl, -10, 10)) *
    config.pnlWeight;
  const fillsComponent =
    (normalizedFills ?? normalizeValue(experiment.fills, 0, 100)) *
    config.fillsWeight;
  const riskPenalty =
    calculateRiskPenalty(experiment) * config.riskPenaltyWeight;

  const score = pnlComponent + fillsComponent - riskPenalty;

  return Math.max(0, Math.min(1, score)); // Clamp to 0-1 range
}

/**
 * Score all experiments with normalization
 */
export function scoreExperiments(
  experiments: NormalizedExperiment[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): NormalizedExperiment[] {
  if (experiments.length === 0) return [];

  // Calculate normalization bounds
  const pnls = experiments.map((e) => e.pnl);
  const fills = experiments.map((e) => e.fills);

  const minPnL = Math.min(...pnls);
  const maxPnL = Math.max(...pnls);
  const minFills = Math.min(...fills);
  const maxFills = Math.max(...fills);

  // Score each experiment
  const scored = experiments.map((exp) => {
    const normalizedPnL = normalizeValue(exp.pnl, minPnL, maxPnL);
    const normalizedFills = normalizeValue(exp.fills, minFills, maxFills);
    const score = calculateExperimentScore(
      exp,
      config,
      normalizedPnL,
      normalizedFills,
    );

    return {
      ...exp,
      score,
    };
  });

  logger("info", `Scored ${scored.length} experiments`, {
    avgScore: (
      scored.reduce((sum, e) => sum + e.score, 0) / scored.length
    ).toFixed(3),
  });

  return scored;
}

/**
 * Get top scored experiments
 */
export function getTopExperiments(
  experiments: NormalizedExperiment[],
  limit: number = 10,
): NormalizedExperiment[] {
  return experiments.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Validate scoring config
 */
export function validateScoringConfig(config: ScoringConfig): boolean {
  const sum = config.pnlWeight + config.fillsWeight + config.riskPenaltyWeight;
  const weightValid =
    config.pnlWeight >= 0 &&
    config.fillsWeight >= 0 &&
    config.riskPenaltyWeight >= 0;

  if (!weightValid) {
    logger(
      "warn",
      "Invalid scoring config: weights must be non-negative",
      config,
    );
    return false;
  }

  if (sum <= 0) {
    logger(
      "warn",
      "Invalid scoring config: sum of weights must be positive",
      config,
    );
    return false;
  }

  return true;
}
