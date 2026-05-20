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
  FilterOptions,
} from "@/src/types/strategy";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  const [recommendation, setRecommendation] =
    useState<RecommendationResponse | null>(null);
  const [strategies, setStrategies] = useState<string[]>([]);
  const [marketConditions, setMarketConditions] = useState<string[]>([]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const strategiesResponse = await fetch("/api/strategies");
        if (!strategiesResponse.ok)
          throw new Error("Failed to fetch strategies");

        const strategiesData = await strategiesResponse.json();
        setStrategies(strategiesData.data.strategies);

        setMarketConditions([
          "Down (Bearish)",
          "Up (Bullish)",
          "Sideways (Neutral)",
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

  const handleFilter = async (filters: FilterOptions) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ strategy: filters.strategy });
      if (filters.marketCondition)
        params.append("marketCondition", filters.marketCondition);

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
    <main className="min-h-screen bg-slate-50/50 selection:bg-blue-100 selection:text-blue-900">
      {/* Modern Header */}
      <div className="bg-slate-950 text-white pt-16 pb-24 border-b border-slate-800 relative overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-gradient-to-b from-blue-600/20 to-transparent opacity-50 blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Quant Systems Live
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Strategy{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Optimization Engine
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Analyze historical experiment snapshots to algorithmically identify
            your most profitable, highest-fill parameter configurations.
          </p>
        </div>
      </div>

      {/* Main Content Area - Overlaps the header */}
      <div className="max-w-6xl mx-auto px-6 -mt-12 pb-20 relative z-20">
        <FilterControls
          strategies={strategies}
          marketConditions={marketConditions}
          onFilter={handleFilter}
          loading={loading}
        />

        {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}
        {loading && recommendation === null && <LoadingSkeleton />}

        {recommendation && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <RecommendationCard
              recommendation={recommendation}
              loading={false}
            />
            {recommendation.historicalDataPoints.length > 0 && (
              <HistoricalDataTable
                experiments={recommendation.historicalDataPoints}
              />
            )}
          </div>
        )}

        {!loading && !recommendation && !error && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
              📊
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
              Awaiting Parameters
            </h2>
            <p className="text-slate-500 max-w-sm mx-auto">
              Select a strategy and click generate to query the Google Sheets
              database and analyze historical runs.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
