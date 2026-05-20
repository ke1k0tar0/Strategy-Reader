/**
 * Strategies API route
 */

import { NextRequest, NextResponse } from "next/server";
import { logger, handleError } from "@/src/utils/errors";

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    logger("info", "Strategies API called");
    logger(
      "info",
      `Returning ${PREDEFINED_STRATEGIES.length} strict predefined strategies`,
    );

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
