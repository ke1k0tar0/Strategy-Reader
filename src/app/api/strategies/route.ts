/**
 * Strategies API route
 * GET /api/strategies - Returns strict list of available strategies
 */

import { NextRequest, NextResponse } from "next/server";
import { logger, handleError } from "@/src/utils/errors";

// The strict list of exactly 9 predefined strategies
const PREDEFINED_STRATEGIES = [
  "5m Cross-Arb",
  "Copy-Trade",
  "5m Endgame",
  "15m Endgame",
  "15m Cross-Arb",
  "15m Spot-Signal",
  "5m Spot-Signal",
  "1H Horizon",
  "4H Horizon",
].sort();

/**
 * Handle GET request - Return strictly the allowed strategies
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    logger("info", "Strategies API called");

    logger(
      "info",
      `Returning ${PREDEFINED_STRATEGIES.length} strict predefined strategies`,
    );

    // Return only the predefined strategies, ignoring the Google Sheet data for the dropdown
    return NextResponse.json({
      success: true,
      data: {
        strategies: PREDEFINED_STRATEGIES,
        count: PREDEFINED_STRATEGIES.length,
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
