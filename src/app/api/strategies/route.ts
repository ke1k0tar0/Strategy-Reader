/**
 * Strategies API route
 * GET /api/strategies - Returns list of available strategies from Google Sheets
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchSheetData } from "@/src/sheets/googleSheets";
import { logger, handleError, AppError } from "@/src/utils/errors";

/**
 * Extract unique strategies (scope) from sheet data
 */
function extractUniqueStrategies(
  rows: Array<Record<string, unknown>>,
  columnMapping: Record<string, string>,
): string[] {
  const strategies = new Set<string>();

  rows.forEach((row) => {
    const scopeColumn = columnMapping["scope"];
    if (scopeColumn) {
      const strategy = String(row[scopeColumn] || "").trim();
      if (strategy && strategy.length > 0) {
        strategies.add(strategy);
      }
    }
  });

  return Array.from(strategies).sort();
}

/**
 * Handle GET request - Return available strategies
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    logger("info", "Strategies API called");

    // Fetch raw sheet data. If the Sheets call fails (credentials, range,
    // permissions, etc.), return a safe fallback list so the build and UI
    // don't fail. This prevents pre-render/build-time errors.
    let headers: string[] = [];
    let rows: Array<Record<string, unknown>> = [];
    try {
      const sheetData = await fetchSheetData();
      headers = sheetData.headers;
      rows = sheetData.rows as Array<Record<string, unknown>>;
    } catch (fetchError) {
      // Log a warning and return a default fallback list below
      logger(
        "warn",
        "Unable to load strategies from Google Sheets, using fallback list",
        fetchError,
      );
      const fallback = ["1H Horizon"];
      return NextResponse.json({
        success: true,
        data: { strategies: fallback, count: fallback.length, fallback: true },
      });
    }

    // Build column mapping
    const columnMapping: Record<string, string> = {};
    headers.forEach((header) => {
      const normalized = header.toLowerCase().trim();
      if (normalized.includes("scope") || normalized.includes("strategy")) {
        columnMapping["scope"] = header;
      }
    });

    if (!columnMapping["scope"]) {
      throw new AppError(
        "MISSING_SCOPE_COLUMN",
        "No 'Scope' or 'Strategy' column found in Google Sheet headers",
        400,
      );
    }

    // Extract unique strategies
    const strategies = extractUniqueStrategies(
      rows as Array<Record<string, unknown>>,
      columnMapping,
    );

    if (strategies.length === 0) {
      throw new AppError(
        "NO_STRATEGIES",
        "No strategies found in Google Sheets",
        400,
      );
    }

    logger("info", `Found ${strategies.length} unique strategies`);

    return NextResponse.json({
      success: true,
      data: {
        strategies,
        count: strategies.length,
      },
    });
  } catch (error) {
    logger("error", "Strategies API error", error);
    const errorResponse = handleError(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.message,
        code: errorResponse.code,
      },
      { status: errorResponse.statusCode },
    );
  }
}
