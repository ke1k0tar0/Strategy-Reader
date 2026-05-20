/**
 * Main Dashboard Page
 */

"use client";

import { useEffect, useState } from "react";
import { RecommendationCard } from "@/src/components/RecommendationCard";
import { FilterControls } from "@/src/components/FilterControls";
import { HistoricalDataTable } from "@/src/components/HistoricalDataTable";
import { ErrorAlert } from "@/src/components/ErrorAlert";
import { LoadingSkeleton } from "@/src/components/LoadingSkeleton";
import {
  RecommendationResponse,
  ApiErrorResponse,
  NormalizedExperiment,
  FilterOptions,
} from "@/src/types/strategy";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  const [recommendation, setRecommendation] =
    useState<RecommendationResponse | null>(null);
  const [strategies, setStrategies] = useState<string[]>([]);
  const [marketConditions, setMarketConditions] = useState<string[]>([]);

  /**
   * Load available strategies and market conditions
   */
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        // Fetch strategies from API
        const strategiesResponse = await fetch("/api/strategies");
        if (!strategiesResponse.ok) {
          throw new Error("Failed to fetch strategies");
        }

        const strategiesData = await strategiesResponse.json();
        setStrategies(strategiesData.data.strategies);

        // Set predefined market conditions
        setMarketConditions([
          "Bearish",
          "Bullish",
          "Neutral",
          "High Volatility",
          "Low Volatility",
        ]);
        setLoading(false);
      } catch (err) {
        setError({
          error: "Failed to load available strategies",
          code: "METADATA_ERROR",
        });
        setLoading(false);
      }
    };

    loadMetadata();
  }, []);

  /**
   * Handle filter submission
   */
  const handleFilter = async (filters: FilterOptions) => {
    try {
      setLoading(true);
      setError(null);

      // Build query string
      const params = new URLSearchParams({
        strategy: filters.strategy,
      });

      if (filters.marketCondition) {
        params.append("marketCondition", filters.marketCondition);
      }

      if (filters.minPnL !== undefined) {
        params.append("minPnL", String(filters.minPnL));
      }

      if (filters.minFills !== undefined) {
        params.append("minFills", String(filters.minFills));
      }

      // Fetch recommendation
      const response = await fetch(`/api/recommendation?${params.toString()}`);

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        setError(errorData);
        setRecommendation(null);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setRecommendation(data.data);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError({
        error: "Failed to fetch recommendation",
        code: "FETCH_ERROR",
      });
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">
            Strategy Optimization Engine
          </h1>
          <p className="text-blue-100">
            Analyze historical experiments and get optimal parameter
            recommendations
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter Controls */}
        <FilterControls
          strategies={strategies}
          marketConditions={marketConditions}
          onFilter={handleFilter}
          loading={loading}
        />

        {/* Error Alert */}
        {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}

        {/* Loading State */}
        {loading && recommendation === null && <LoadingSkeleton />}

        {/* Recommendation */}
        {recommendation && (
          <>
            <RecommendationCard
              recommendation={recommendation}
              loading={false}
            />

            {/* Historical Data */}
            {recommendation.historicalDataPoints.length > 0 && (
              <div className="mt-8">
                <HistoricalDataTable
                  experiments={recommendation.historicalDataPoints}
                />
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !recommendation && !error && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              No Recommendation Yet
            </h2>
            <p className="text-slate-600">
              Select a strategy and click &quot;Get Recommendation&quot; to
              analyze historical data and get optimal parameters.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
