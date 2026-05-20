/**
 * Filtering engine
 * Filters experiments based on various criteria
 */

import { NormalizedExperiment, FilterOptions } from "@/src/types/strategy";
import { logger } from "@/src/utils/errors";

export function filterExperiments(
  experiments: NormalizedExperiment[],
  options: FilterOptions,
): NormalizedExperiment[] {
  let filtered = experiments;

  // Filter by strategy (required)
  filtered = filtered.filter(
    (exp) => exp.scope.toLowerCase() === options.strategy.toLowerCase(),
  );

  logger("info", `Filtered by strategy: ${filtered.length} experiments`);

  // Filter by exact date
  if (options.date) {
    filtered = filtered.filter((exp) => {
      // Direct string match first (in case Google Sheets sends '20-May')
      if (exp.date === options.date) return true;

      // Fallback to strict ISO Date parsing comparison
      try {
        const expDate = new Date(exp.date).toISOString().split("T")[0];
        const filterDate = new Date(options.date as string)
          .toISOString()
          .split("T")[0];
        return expDate === filterDate;
      } catch {
        return false;
      }
    });
    logger(
      "info",
      `Filtered by exact date (${options.date}): ${filtered.length} experiments`,
    );
  }

  // Filter by market condition
  if (options.marketCondition) {
    filtered = filtered.filter((exp) =>
      exp.marketConditions
        .toLowerCase()
        .includes(options.marketCondition!.toLowerCase()),
    );
    logger(
      "info",
      `Filtered by market condition: ${filtered.length} experiments`,
    );
  }

  // Filter by date range
  if (options.dateRange) {
    const startDate = new Date(options.dateRange.start);
    const endDate = new Date(options.dateRange.end);

    filtered = filtered.filter((exp) => {
      try {
        const expDate = new Date(exp.date);
        return expDate >= startDate && expDate <= endDate;
      } catch {
        return false;
      }
    });
    logger("info", `Filtered by date range: ${filtered.length} experiments`);
  }

  // Filter by verdict
  if (options.verdict) {
    filtered = filtered.filter((exp) =>
      exp.verdict.toLowerCase().includes(options.verdict!.toLowerCase()),
    );
    logger("info", `Filtered by verdict: ${filtered.length} experiments`);
  }

  // Filter by minimum PnL
  if (options.minPnL !== undefined) {
    filtered = filtered.filter((exp) => exp.pnl >= options.minPnL!);
    logger(
      "info",
      `Filtered by min PnL (${options.minPnL}): ${filtered.length} experiments`,
    );
  }

  // Filter by minimum fills
  if (options.minFills !== undefined) {
    filtered = filtered.filter((exp) => exp.fills >= options.minFills!);
    logger(
      "info",
      `Filtered by min fills (${options.minFills}): ${filtered.length} experiments`,
    );
  }

  return filtered;
}

export function getUniqueStrategies(
  experiments: NormalizedExperiment[],
): string[] {
  const strategies = new Set(experiments.map((exp) => exp.scope));
  return Array.from(strategies).sort();
}

export function getUniqueMarketConditions(
  experiments: NormalizedExperiment[],
): string[] {
  const conditions = new Set<string>();
  experiments.forEach((exp) => {
    const conditionParts = exp.marketConditions
      .split(/[,;]/)
      .map((p) => p.trim());
    conditionParts.forEach((part) => {
      if (part) conditions.add(part);
    });
  });
  return Array.from(conditions).sort();
}

export function getUniqueVerdicts(
  experiments: NormalizedExperiment[],
): string[] {
  const verdicts = new Set(
    experiments.map((exp) => exp.verdict).filter((v) => v && v.length > 0),
  );
  return Array.from(verdicts).sort();
}

export function getDateRange(
  experiments: NormalizedExperiment[],
): { min: string; max: string } | null {
  if (experiments.length === 0) return null;
  const dates = experiments
    .map((exp) => {
      try {
        return new Date(exp.date).getTime();
      } catch {
        return null;
      }
    })
    .filter((d) => d !== null) as number[];

  if (dates.length === 0) return null;
  return {
    min: new Date(Math.min(...dates)).toISOString().split("T")[0],
    max: new Date(Math.max(...dates)).toISOString().split("T")[0],
  };
}

export function filterByExactMatch(
  experiments: NormalizedExperiment[],
  paramKey: string,
  paramValue: unknown,
): NormalizedExperiment[] {
  return experiments.filter((exp) => exp.parameterSet[paramKey] === paramValue);
}

export function filterByParameterRange(
  experiments: NormalizedExperiment[],
  paramKey: string,
  min: number,
  max: number,
): NormalizedExperiment[] {
  return experiments.filter((exp) => {
    const value = exp.parameterSet[paramKey];
    if (typeof value !== "number") return false;
    return value >= min && value <= max;
  });
}
