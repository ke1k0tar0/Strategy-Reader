/**
 * Explanation engine
 * Generates human-readable explanations for recommendations
 */

import { FilterOptions, ParameterSet } from "@/src/types/strategy";
import { ParameterCombinationStats } from "@/src/optimization/ranking";

/**
 * Template-based explanation generator
 */
export function generateExplanation(
  bestStats: ParameterCombinationStats,
  filterOptions: FilterOptions,
  totalExperiments: number,
  alternativeStats: ParameterCombinationStats[],
): string {
  const parts: string[] = [];

  // Part 1: Base explanation
  if (bestStats.occurrences === 1) {
    parts.push(`This parameter set was tested once with strong results.`);
  } else {
    parts.push(
      `This parameter set has been tested ${bestStats.occurrences} times with consistent results.`,
    );
  }

  // Part 2: Performance metrics
  const pnlText =
    bestStats.averagePnL > 0
      ? `an average PnL of ${bestStats.averagePnL.toFixed(2)}`
      : `an average PnL of ${bestStats.averagePnL.toFixed(2)} (loss)`;

  const fillText = `${bestStats.averageFills.toFixed(1)}% fill rate`;

  parts.push(`Historically, it has produced ${pnlText} and a ${fillText}.`);

  // Part 3: Market condition context
  if (filterOptions.marketCondition) {
    parts.push(
      `Under ${filterOptions.marketCondition} market conditions, this configuration has proven effective.`,
    );
  }

  // Part 4: Competitive analysis
  if (alternativeStats.length > 1) {
    const secondBest = alternativeStats[1];
    const improvementPercent = (
      ((bestStats.averageScore - secondBest.averageScore) /
        bestStats.averageScore) *
      100
    ).toFixed(1);

    parts.push(
      `It outperforms the second-best configuration by approximately ${improvementPercent}% in overall score.`,
    );
  }

  // Part 5: Confidence statement
  if (bestStats.occurrences >= 5) {
    parts.push(
      `Based on ${bestStats.occurrences} test results, this recommendation has high statistical support.`,
    );
  } else if (bestStats.occurrences >= 2) {
    parts.push(
      `While based on a limited sample size (${bestStats.occurrences} tests), this remains the best observed configuration.`,
    );
  } else {
    parts.push(
      `This is a single-test result. Consider testing multiple times before deployment.`,
    );
  }

  return parts.join(" ");
}

/**
 * Generate parameter change explanation
 */
export function explainParameterChanges(
  from: ParameterSet,
  to: ParameterSet,
): string {
  const changes: string[] = [];

  const allKeys = new Set([...Object.keys(from), ...Object.keys(to)]);

  allKeys.forEach((key) => {
    const fromValue = from[key];
    const toValue = to[key];

    if (!(key in from)) {
      changes.push(`Added ${key}: ${toValue}`);
    } else if (!(key in to)) {
      changes.push(`Removed ${key}`);
    } else if (fromValue !== toValue) {
      changes.push(`${key}: ${fromValue} → ${toValue}`);
    }
  });

  if (changes.length === 0) {
    return "No parameter changes detected.";
  }

  return `Parameters changed: ${changes.join("; ")}.`;
}

/**
 * Generate verdict explanation
 */
export function explainVerdict(verdict: string): string {
  const lowerVerdict = verdict.toLowerCase();

  if (lowerVerdict.includes("success") || lowerVerdict.includes("pass")) {
    return "This configuration was marked as successful.";
  }

  if (lowerVerdict.includes("fail") || lowerVerdict.includes("poor")) {
    return "This configuration showed poor results and was marked as failed.";
  }

  if (
    lowerVerdict.includes("inconclusive") ||
    lowerVerdict.includes("neutral")
  ) {
    return "This configuration produced mixed or inconclusive results.";
  }

  return `Verdict: ${verdict}`;
}

/**
 * Generate performance analysis explanation
 */
export function explainPerformanceAnalysis(
  averagePnL: number,
  averageFills: number,
  score: number,
): string {
  const parts: string[] = [];

  // PnL analysis
  if (averagePnL > 5) {
    parts.push("Strong profitability");
  } else if (averagePnL > 0) {
    parts.push("Positive profitability");
  } else {
    parts.push("Negative profitability");
  }

  // Fill rate analysis
  if (averageFills > 85) {
    parts.push("excellent fill rate");
  } else if (averageFills > 70) {
    parts.push("good fill rate");
  } else if (averageFills > 50) {
    parts.push("moderate fill rate");
  } else {
    parts.push("low fill rate");
  }

  return `Performance characteristics: ${parts.join(", ")}.`;
}

/**
 * Generate risk assessment
 */
export function generateRiskAssessment(
  experiments: ParameterCombinationStats[],
): string {
  if (experiments.length === 0) return "Insufficient data for risk assessment.";

  const pnlValues = experiments.flatMap((e) =>
    e.experiments.map((exp) => exp.pnl),
  );
  const fillValues = experiments.flatMap((e) =>
    e.experiments.map((exp) => exp.fills),
  );

  // Calculate standard deviation
  const pnlMean = pnlValues.reduce((a, b) => a + b, 0) / pnlValues.length;
  const pnlVariance =
    pnlValues.reduce((sum, v) => sum + Math.pow(v - pnlMean, 2), 0) /
    pnlValues.length;
  const pnlStdDev = Math.sqrt(pnlVariance);

  if (pnlStdDev > Math.abs(pnlMean) * 0.5) {
    return "High variance in results. Exercise caution in deployment.";
  }

  const negativeCount = pnlValues.filter((v) => v < 0).length;
  const negativeRatio = negativeCount / pnlValues.length;

  if (negativeRatio > 0.3) {
    return "Significant proportion of negative outcomes. Review before deployment.";
  }

  return "Results are relatively consistent with acceptable risk levels.";
}
