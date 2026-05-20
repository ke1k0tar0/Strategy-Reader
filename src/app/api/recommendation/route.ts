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
  minPnL: z.coerce.number().optional(),
  minFills: z.coerce.number().optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      strategy: searchParams.get("strategy"),
      marketCondition: searchParams.get("marketCondition") || undefined,
      minPnL: searchParams.get("minPnL")
        ? Number(searchParams.get("minPnL"))
        : undefined,
      minFills: searchParams.get("minFills")
        ? Number(searchParams.get("minFills"))
        : undefined,
    };

    const parsed = QuerySchema.parse(queryData);
    logger("info", "Recommendation API called", {
      strategy: parsed.strategy,
      marketCondition: parsed.marketCondition,
    });

    const experiments = await loadExperimentsWithCache();
    const filterOptions: FilterOptions = {
      strategy: parsed.strategy,
      marketCondition: parsed.marketCondition,
      minPnL: parsed.minPnL,
      minFills: parsed.minFills,
    };
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
    logger("error", "Recommendation API error", error);
    const errorInfo = handleError(error);
    const errorResponse: ApiErrorResponse = {
      error: errorInfo.message,
      code: errorInfo.code,
      details: errorInfo.details,
    };
    return NextResponse.json(errorResponse, { status: errorInfo.statusCode });
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  );
}
