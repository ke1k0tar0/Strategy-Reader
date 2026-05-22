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

export async function loadAllExperiments(): Promise<NormalizedExperiment[]> {
  try {
    logger("info", "Loading experiments from Google Sheets");

    const { data: rawRows, columnMapping } = await getSheetExperiments();
    logger("info", `Fetched ${rawRows.length} rows from Google Sheets`);

    const experiments: StrategyExperiment[] = [];
    const errors: Array<{ rowIndex: number; error: string }> = [];

    rawRows.forEach((row, index) => {
      try {
        const exp = convertRawRowToExperiment(row, columnMapping, index);

        if (exp) {
          const paramSetKey = Object.keys(row).find((k) =>
            k.toLowerCase().includes("parameter"),
          );
          const paramSetStr = paramSetKey
            ? String(row[paramSetKey] || "").trim()
            : "";
          const paramSet = parseParameterJSON(paramSetStr);

          // We no longer redact the row if the JSON is missing. We just supply an empty object.
          exp.parameterSet = paramSet || {};
          experiments.push(exp);
        } else {
          const isEmpty = Object.values(row).every(
            (val) => !val || String(val).trim() === "",
          );
          if (!isEmpty) {
            errors.push({
              rowIndex: index + 2,
              error: "Row skipped: Missing primary identifiers (Date or Scope)",
            });
          }
        }
      } catch (error) {
        errors.push({ rowIndex: index + 2, error: String(error) });
      }
    });

    if (errors.length > 0) {
      logger("warn", `Skipped ${errors.length} incomplete rows`);
    }

    if (experiments.length === 0) {
      throw new AppError(
        "NO_VALID_DATA",
        "No valid experiments were found matching the required format. Please check the spreadsheet data.",
        400,
        { errors },
      );
    }

    // Score and normalize
    const scored = scoreExperiments(experiments as NormalizedExperiment[]);
    const normalized = scored.map((exp) => normalizeExperiment(exp, exp.score));

    logger(
      "info",
      `Loaded and normalized ${normalized.length} valid experiments`,
    );
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
