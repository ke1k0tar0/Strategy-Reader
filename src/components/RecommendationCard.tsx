"use client";

import { RecommendationResponse } from "@/src/types/strategy";

interface RecommendationCardProps {
  recommendation: RecommendationResponse;
  loading?: boolean;
}

export function RecommendationCard({
  recommendation,
  loading = false,
}: RecommendationCardProps) {
  if (loading) return null; // Handled by LoadingSkeleton

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Section */}
      <div className="bg-slate-50/50 border-b border-slate-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Optimal Configuration
            </h2>
            <div className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              {recommendation.strategy}
              {recommendation.marketCondition && (
                <span className="text-sm font-medium bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-500 shadow-sm">
                  {recommendation.marketCondition}
                </span>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                Confidence Score
              </div>
              <div className="text-lg font-bold text-blue-900">
                {(recommendation.confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Parameters Grid */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-800 mb-4 tracking-tight">
            Recommended Parameters
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(recommendation.recommendedParameters).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="bg-slate-50 border border-slate-100 rounded-xl p-4 transition-colors hover:bg-slate-100"
                >
                  <div
                    className="text-xs font-medium text-slate-500 mb-1 truncate"
                    title={key}
                  >
                    {key}
                  </div>
                  <div className="font-mono text-lg font-semibold text-slate-800">
                    {typeof value === "number"
                      ? value.toFixed(4).replace(/\.?0+$/, "")
                      : String(value)}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Expected Outcomes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5">
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">
              Expected Session PnL
            </div>
            <div className="text-3xl font-bold text-emerald-700 tracking-tight">
              {recommendation.expectedPnL > 0 ? "+" : ""}
              {recommendation.expectedPnL.toFixed(2)}
            </div>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">
              Expected Fill Rate
            </div>
            <div className="text-3xl font-bold text-indigo-700 tracking-tight">
              {recommendation.expectedFillRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
              Analysis Sample Size
            </div>
            <div className="text-3xl font-bold text-slate-700 tracking-tight">
              {recommendation.sampleSize}{" "}
              <span className="text-lg font-medium text-slate-400">runs</span>
            </div>
          </div>
        </div>

        {/* AI Explanation */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="font-semibold text-blue-900">Analysis Summary</h3>
          </div>
          <p className="text-blue-800/80 leading-relaxed text-sm">
            {recommendation.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
