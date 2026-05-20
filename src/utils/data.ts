/**
 * Data transformation and normalization utilities
 */

import {
  StrategyExperiment,
  NormalizedExperiment,
  RawSheetRow,
} from "@/src/types/strategy";

/**
 * Normalize column names from Google Sheets (convert to camelCase)
 */
export function normalizeColumnName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\(.*?\)/g, "") // Remove parentheses
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w-]/g, "") // Remove special characters
    .split("-")
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join("");
}

/**
 * Create an ID from experiment data
 */
export function generateExperimentId(
  date: string,
  scope: string,
  index: number,
): string {
  return `${date}-${scope}-${index}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

/**
 * Parse JSON safely
 */
export function parseJSON<T = Record<string, unknown>>(
  jsonString: string,
): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

/**
 * Convert raw sheet row to experiment
 */
export function convertRawRowToExperiment(
  row: RawSheetRow,
  columnMapping: Record<string, string>,
  rowIndex: number,
): StrategyExperiment | null {
  try {
    // Extract values using column mapping
    const dateKey = columnMapping["date"];
    const scopeKey = columnMapping["scope"];
    const fillsKey = columnMapping["fills"];
    const pnlKey = columnMapping["pnl"];

    if (!dateKey || !scopeKey || !fillsKey || !pnlKey) {
      return null;
    }

    const date = String(row[dateKey] || "").trim();
    const scope = String(row[scopeKey] || "").trim();

    // Safety check for primary identifiers
    if (!date || !scope) {
      return null;
    }

    // Smart numeric string parsing (strips currency/percent symbols, handles EU commas)
    let rawFillsStr = String(row[fillsKey] || "0")
      .replace(/%/g, "")
      .trim();
    if (rawFillsStr.includes(",") && !rawFillsStr.includes(".")) {
      rawFillsStr = rawFillsStr.replace(",", ".");
    }
    const fills = parseFloat(rawFillsStr.replace(/[^0-9.-]/g, ""));

    let rawPnlStr = String(row[pnlKey] || "0").trim();
    if (rawPnlStr.includes(",") && !rawPnlStr.includes(".")) {
      rawPnlStr = rawPnlStr.replace(",", ".");
    }
    const pnl = parseFloat(rawPnlStr.replace(/[^0-9.-]/g, ""));

    if (isNaN(fills) || isNaN(pnl)) {
      return null;
    }

    // Dummy assign - actual deep parsing handled safely in dataLoader.ts
    const parameterSet = {};

    return {
      date,
      scope,
      parameterSet,
      hypothesis: String(row[columnMapping["hypothesis"] || ""] || ""),
      change: String(row[columnMapping["change"] || ""] || ""),
      stopConditions: String(row[columnMapping["stopConditions"] || ""] || ""),
      successMetric: String(row[columnMapping["successMetric"] || ""] || ""),
      duration: String(row[columnMapping["duration"] || ""] || ""),
      marketConditions: String(
        row[columnMapping["marketConditions"] || ""] || "",
      ),
      fills,
      pnl,
      topGateReasons: String(row[columnMapping["topGateReasons"] || ""] || ""),
      verdict: String(row[columnMapping["verdict"] || ""] || ""),
      notes: String(row[columnMapping["notes"] || ""] || ""),
      rowIndex,
      rawRow: row,
    };
  } catch {
    return null;
  }
}

/**
 * Normalize experiment with computed fields
 */
export function normalizeExperiment(
  experiment: StrategyExperiment,
  score: number,
): NormalizedExperiment {
  return {
    ...experiment,
    id: generateExperimentId(
      experiment.date,
      experiment.scope,
      experiment.rowIndex || 0,
    ),
    score,
  };
}

/**
 * Validate numeric field
 */
export function validateNumericField(
  value: unknown,
  fieldName: string,
): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Invalid ${fieldName}: expected a number, got ${value}`);
  }
  return num;
}

/**
 * Format number for display
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Safe JSON stringify
 */
export function stringifyJSON(obj: unknown, pretty: boolean = false): string {
  try {
    return JSON.stringify(obj, null, pretty ? 2 : 0);
  } catch {
    return "{}";
  }
}
