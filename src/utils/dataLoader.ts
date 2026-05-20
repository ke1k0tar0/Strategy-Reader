/**
 * Data loader service
 */

import { getSheetExperiments } from "@/src/sheets/googleSheets";
import { parseParameterJSON } from "@/src/parsers/parameterParser";
import {
  convertRawRowToExperiment,
  normalizeExperiment,
} from "@/src/utils/data";
import { scoreExperiments } from "@/src/optimization/scoring";
import { NormalizedExperiment, StrategyExperiment } from "@/src/types/strategy";
import { logger, AppError } from "@/src/utils/errors";

export async function loadAllExperiments(): Promise<NormalizedExperiment[]> {
  try {
    logger("info", "Loading experiments from Google Sheets");

    const { data: rawRows, columnMapping } = await getSheetExperiments();
    logger("info", `Fetched ${rawRows.length} rows from Google Sheets`);

    const experiments: StrategyExperiment[] = [];
    const errors: Array<{ rowIndex: number; error: string }> = [];

    rawRows.forEach((row, index) => {
      const displayRowIndex = index + 2;

      // 1. Silently skip rows that are completely empty
      const isEmpty = Object.values(row).every(
        (val) => !val || String(val).trim() === "",
      );
      if (isEmpty) return;

      // 2. Silently skip rows where the core identifiers or JSON are intentionally left blank
      const dateKey = columnMapping["date"];
      const scopeKey = columnMapping["scope"];
      const paramSetKey = columnMapping["parameterSet"];

      const dateStr = dateKey ? String(row[dateKey] || "").trim() : "";
      const scopeStr = scopeKey ? String(row[scopeKey] || "").trim() : "";
      const paramSetStr = paramSetKey
        ? String(row[paramSetKey] || "").trim()
        : "";

      if (!dateStr || !scopeStr || !paramSetStr || paramSetStr === "-") {
        return;
      }

      try {
        const exp = convertRawRowToExperiment(row, columnMapping, index);

        if (exp) {
          const paramSet = parseParameterJSON(paramSetStr);

          if (paramSet) {
            exp.parameterSet = paramSet;
            experiments.push(exp);
          } else {
            errors.push({
              rowIndex: displayRowIndex,
              error: `Invalid parameter JSON snapshot. Review formatting near: ${paramSetStr.substring(0, 40)}...`,
            });
          }
        }
        // Notice we no longer push an error if 'exp' is null.
        // Missing Fills or PnL simply means the experiment is not yet ready to score!
      } catch (error) {
        errors.push({ rowIndex: displayRowIndex, error: String(error) });
      }
    });

    if (errors.length > 0) {
      logger(
        "warn",
        `Failed to parse ${errors.length} rows due to format mismatch`,
      );
    }

    if (experiments.length === 0) {
      throw new AppError(
        "NO_VALID_DATA",
        "No valid experiments were found matching the required format. Please check the spreadsheet data.",
        400,
        { errors },
      );
    }

    const scored = scoreExperiments(experiments as NormalizedExperiment[]);
    const normalized = scored.map((exp) => normalizeExperiment(exp, exp.score));

    logger("info", `Loaded and normalized ${normalized.length} experiments`);
    return normalized;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "LOAD_FAILED",
      "Failed to load experiments from Google Sheets",
      500,
      error,
    );
  }
}

let cachedExperiments: NormalizedExperiment[] | null = null;
let lastLoadTime: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function loadExperimentsWithCache(): Promise<
  NormalizedExperiment[]
> {
  const now = Date.now();
  if (cachedExperiments && now - lastLoadTime < CACHE_TTL_MS) {
    logger("info", "Returning cached experiments");
    return cachedExperiments;
  }
  cachedExperiments = await loadAllExperiments();
  lastLoadTime = now;
  return cachedExperiments;
}

export function clearExperimentsCache(): void {
  cachedExperiments = null;
  lastLoadTime = 0;
  logger("info", "Experiments cache cleared");
}

export function getCacheStats() {
  return {
    isCached: cachedExperiments !== null,
    age: cachedExperiments ? Date.now() - lastLoadTime : 0,
    size: cachedExperiments ? cachedExperiments.length : 0,
  };
}
