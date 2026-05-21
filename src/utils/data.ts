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
    // Dynamic searcher: ignores spaces, case, and special characters (e.g., matches "Top 3 Gate Reasons" with "gatereason")
    const getVal = (searchStr: string) => {
      const target = searchStr.toLowerCase().replace(/[^a-z0-9]/g, "");
      const key = Object.keys(row).find((k) =>
        k
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .includes(target),
      );
      return key ? String(row[key] || "").trim() : "";
    };

    const date = getVal("date");
    const scope = getVal("scope") || getVal("strategy");
    const hypothesis = getVal("hypothesis");
    const change = getVal("change");
    const stopConditions = getVal("stopcondition");
    const successMetric = getVal("successmetric");
    const duration = getVal("duration");
    const marketConditions = getVal("marketcondition");
    const topGateReasons = getVal("gatereason");
    const verdict = getVal("verdict");

    // Notes is specifically optional
    const notes = getVal("notes");

    // STRICT VALIDATOR: Fast-fail if ANY mandatory column is empty
    if (
      !date ||
      !scope ||
      !hypothesis ||
      !change ||
      !stopConditions ||
      !successMetric ||
      !duration ||
      !marketConditions ||
      !topGateReasons ||
      !verdict
    ) {
      return null;
    }

    let rawFillsStr = getVal("fills").replace(/%/g, "");
    let rawPnlStr = getVal("pnl");

    if (rawFillsStr === "-" || !rawFillsStr) rawFillsStr = "0";
    if (rawPnlStr === "-" || !rawPnlStr) rawPnlStr = "0";

    if (rawFillsStr.includes(",") && !rawFillsStr.includes("."))
      rawFillsStr = rawFillsStr.replace(",", ".");
    if (rawPnlStr.includes(",") && !rawPnlStr.includes("."))
      rawPnlStr = rawPnlStr.replace(",", ".");

    const fills = parseFloat(rawFillsStr.replace(/[^0-9.-]/g, "")) || 0;
    const pnl = parseFloat(rawPnlStr.replace(/[^0-9.-]/g, "")) || 0;

    return {
      date,
      scope,
      parameterSet: {}, // Real parsing happens securely in dataLoader
      hypothesis,
      change,
      stopConditions,
      successMetric,
      duration,
      marketConditions,
      fills,
      pnl,
      topGateReasons,
      verdict,
      notes,
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
