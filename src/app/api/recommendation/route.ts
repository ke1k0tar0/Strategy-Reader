/**
 * Recommendation API route
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loadExperimentsWithCache } from "@/src/utils/dataLoader";
import { generateRecommendation } from "@/src/optimization/recommendation";
import {
  FilterOptions,
  ApiErrorResponse,
  ApiSuccessResponse,
  RecommendationResponse,
} from "@/src/types/strategy";
import { logger, handleError } from "@/src/utils/errors";

const QuerySchema = z.object({
  strategy: z.string().min(1, "Strategy is required"),
  marketCondition: z.string().optional(),
  date: z.string().optional(),
  minPnL: z.coerce.number().optional(),
  minFills: z.coerce.number().optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  let requestedStrategy = "Unknown";

  try {
    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      strategy: searchParams.get("strategy"),
      marketCondition: searchParams.get("marketCondition") || undefined,
      date: searchParams.get("date") || undefined,
      minPnL: searchParams.get("minPnL")
        ? Number(searchParams.get("minPnL"))
        : undefined,
      minFills: searchParams.get("minFills")
        ? Number(searchParams.get("minFills"))
        : undefined,
    };

    const parsed = QuerySchema.parse(queryData);
    requestedStrategy = parsed.strategy;

    logger("info", "Recommendation API called", {
      strategy: parsed.strategy,
      marketCondition: parsed.marketCondition,
      date: parsed.date,
    });

    const experiments = await loadExperimentsWithCache();

    const filterOptions: FilterOptions = {
      strategy: parsed.strategy,
      marketCondition: parsed.marketCondition,
      date: parsed.date,
      minPnL: parsed.minPnL,
      minFills: parsed.minFills,
    };

    // The AI Engine now handles the entire optimization logic natively
    const recommendation = await generateRecommendation(
      experiments,
      filterOptions,
    );

    const response: ApiSuccessResponse<RecommendationResponse> = {
      data: recommendation,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorInfo = handleError(error);

    // Check if this is just an expected empty state and log it peacefully
    if (errorInfo.code === "NO_RECOMMENDATIONS") {
      logger(
        "warn",
        `Awaiting data: No valid historical rows found for strategy '${requestedStrategy}'`,
      );
    } else {
      logger("error", "Recommendation API error", error);
    }

    const errorResponse: ApiErrorResponse = {
      error: errorInfo.message,
      code: errorInfo.code,
      details: errorInfo.details,
    };
    return NextResponse.json(errorResponse, { status: errorInfo.statusCode });
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  // Only allow requests from your specific domain (fallback to localhost for dev)
  const allowedOrigin =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  );
}
