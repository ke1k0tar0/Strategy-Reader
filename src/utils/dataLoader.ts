/**
 * Data loader service
 * Handles complete data pipeline from sheets to normalized experiments
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

/**
 * Load and process all experiments from Google Sheets
 */
export async function loadAllExperiments(): Promise<NormalizedExperiment[]> {
  try {
    logger("info", "Loading experiments from Google Sheets");

    // Step 1: Fetch raw data
    const { data: rawRows, columnMapping } = await getSheetExperiments();

    logger("info", `Fetched ${rawRows.length} rows from Google Sheets`);

    // Step 2: Convert raw rows to experiments
    const experiments: StrategyExperiment[] = [];
    const errors: Array<{ rowIndex: number; error: string }> = [];

    rawRows.forEach((row, index) => {
      const displayRowIndex = index + 2; // +2 for 1-based index and header row

      // 1. Silently skip entirely blank spreadsheet rows
      const isEmpty = Object.values(row).every(
        (val) => !val || String(val).trim() === "",
      );
      if (isEmpty) return;

      // 2. Silently skip rows missing a primary Date key (like visual dividers)
      const dateKey = columnMapping["date"];
      if (!dateKey || !row[dateKey] || String(row[dateKey]).trim() === "")
        return;

      try {
        const exp = convertRawRowToExperiment(row, columnMapping, index);

        if (exp) {
          // Parse parameter JSON independently
          const paramSetKey = columnMapping["parameterSet"];
          const paramSetStr = paramSetKey ? String(row[paramSetKey] || "") : "";
          const paramSet = parseParameterJSON(paramSetStr);

          if (paramSet) {
            exp.parameterSet = paramSet;
            experiments.push(exp);
          } else {
            errors.push({
              rowIndex: displayRowIndex,
              error: `Invalid parameter JSON snapshot configuration. Value: ${paramSetStr.substring(0, 40)}...`,
            });
          }
        } else {
          errors.push({
            rowIndex: displayRowIndex,
            error:
              "Missing required fields or layout structure mismatch (Fills or PnL)",
          });
        }
      } catch (error) {
        errors.push({
          rowIndex: displayRowIndex,
          error: String(error),
        });
      }
    });

    if (errors.length > 0) {
      logger(
        "warn",
        `Failed to parse ${errors.length} rows due to format mismatch`,
        errors.slice(0, 5),
      );
    }

    logger("info", `Successfully parsed ${experiments.length} experiments`);

    if (experiments.length === 0) {
      throw new AppError(
        "NO_VALID_DATA",
        "No valid experiments found in Google Sheets",
        400,
      );
    }

    // Step 3: Score experiments
    const scored = scoreExperiments(experiments as NormalizedExperiment[]);

    // Step 4: Normalize with IDs
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

/**
 * Load experiments with caching (in-memory)
 */
let cachedExperiments: NormalizedExperiment[] | null = null;
let lastLoadTime: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function loadExperimentsWithCache(): Promise<
  NormalizedExperiment[]
> {
  const now = Date.now();

  // Return cached if fresh
  if (cachedExperiments && now - lastLoadTime < CACHE_TTL_MS) {
    logger("info", "Returning cached experiments");
    return cachedExperiments;
  }

  // Load fresh data
  cachedExperiments = await loadAllExperiments();
  lastLoadTime = now;

  return cachedExperiments;
}

/**
 * Clear cache (useful for testing)
 */
export function clearExperimentsCache(): void {
  cachedExperiments = null;
  lastLoadTime = 0;
  logger("info", "Experiments cache cleared");
}

/**
 * Get cache stats
 */
export function getCacheStats(): {
  isCached: boolean;
  age: number;
  size: number;
} {
  return {
    isCached: cachedExperiments !== null,
    age: cachedExperiments ? Date.now() - lastLoadTime : 0,
    size: cachedExperiments ? cachedExperiments.length : 0,
  };
}
