/**
 * Data transformation and normalization utilities
 */

import {
  StrategyExperiment,
  NormalizedExperiment,
  RawSheetRow,
} from "@/src/types/strategy";

export function normalizeColumnName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\(.*?\)/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .split("-")
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join("");
}

export function generateExperimentId(
  date: string,
  scope: string,
  index: number,
): string {
  return `${date}-${scope}-${index}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

export function parseJSON<T = Record<string, unknown>>(
  jsonString: string,
): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

export function convertRawRowToExperiment(
  row: RawSheetRow,
  columnMapping: Record<string, string>,
  rowIndex: number,
): StrategyExperiment | null {
  try {
    const dateKey = columnMapping["date"];
    const scopeKey = columnMapping["scope"];

    if (!dateKey || !scopeKey) return null;

    const date = String(row[dateKey] || "").trim();
    const scope = String(row[scopeKey] || "").trim();

    // Per Requirements: Redact/skip if a date has strictly not been assigned
    // (Meaning it was blank and there was no previous date to forward-fill)
    if (!date || !scope) {
      return null;
    }

    // Safely parse numbers. Treat dashes or blanks as 0 so the row survives.
    let rawFillsStr = String(row[columnMapping["fills"]] || "")
      .replace(/%/g, "")
      .trim();
    if (rawFillsStr === "-" || !rawFillsStr) rawFillsStr = "0";
    if (rawFillsStr.includes(",") && !rawFillsStr.includes("."))
      rawFillsStr = rawFillsStr.replace(",", ".");
    const fills = parseFloat(rawFillsStr.replace(/[^0-9.-]/g, "")) || 0;

    let rawPnlStr = String(row[columnMapping["pnl"]] || "").trim();
    if (rawPnlStr === "-" || !rawPnlStr) rawPnlStr = "0";
    if (rawPnlStr.includes(",") && !rawPnlStr.includes("."))
      rawPnlStr = rawPnlStr.replace(",", ".");
    const pnl = parseFloat(rawPnlStr.replace(/[^0-9.-]/g, "")) || 0;

    // Real parameter parsing is handled in dataLoader.ts
    const parameterSet = {};

    return {
      date,
      scope,
      parameterSet,
      hypothesis: String(row[columnMapping["hypothesis"] || ""] || "").trim(),
      change: String(row[columnMapping["change"] || ""] || "").trim(),
      stopConditions: String(
        row[columnMapping["stopConditions"] || ""] || "",
      ).trim(),
      successMetric: String(
        row[columnMapping["successMetric"] || ""] || "",
      ).trim(),
      duration: String(row[columnMapping["duration"] || ""] || "").trim(),
      marketConditions: String(
        row[columnMapping["marketConditions"] || ""] || "",
      ).trim(),
      fills,
      pnl,
      topGateReasons: String(
        row[columnMapping["topGateReasons"] || ""] || "",
      ).trim(),
      verdict: String(row[columnMapping["verdict"] || ""] || "").trim(),
      notes: String(row[columnMapping["notes"] || ""] || "").trim(),
      rowIndex,
      rawRow: row,
    };
  } catch {
    return null;
  }
}

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

export function validateNumericField(
  value: unknown,
  fieldName: string,
): number {
  const num = Number(value);
  if (isNaN(num))
    throw new Error(`Invalid ${fieldName}: expected a number, got ${value}`);
  return num;
}

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function stringifyJSON(obj: unknown, pretty: boolean = false): string {
  try {
    return JSON.stringify(obj, null, pretty ? 2 : 0);
  } catch {
    return "{}";
  }
}
