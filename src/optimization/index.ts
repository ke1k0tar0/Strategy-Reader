/**
 * Optimization module exports
 */

export {
  filterExperiments,
  getUniqueStrategies,
  getUniqueMarketConditions,
  getUniqueVerdicts,
  getDateRange,
  filterByExactMatch,
  filterByParameterRange,
} from "./filtering";

export {
  calculateExperimentScore,
  scoreExperiments,
  getTopExperiments,
  validateScoringConfig,
  DEFAULT_SCORING_CONFIG,
} from "./scoring";

export {
  groupByParameterSet,
  calculateParameterCombinationStats,
  rankParameterCombinations,
  findSimilarCombinations,
  mergeSimilarParameterSets,
  calculateConfidence,
  type ParameterCombinationStats,
} from "./ranking";

export {
  generateRecommendation,
  generateMultiConditionRecommendations,
  getRecommendationAlternatives,
} from "./recommendation";

export {
  generateExplanation,
  explainParameterChanges,
  explainVerdict,
  explainPerformanceAnalysis,
  generateRiskAssessment,
} from "./explanations";
