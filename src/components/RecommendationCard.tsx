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
  if (loading) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50/50 border-b border-slate-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              AI Optimal Configuration
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
                AI Confidence Score
              </div>
              <div className="text-lg font-bold text-blue-900">
                {(recommendation.confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-800 mb-4 tracking-tight">
            AI Recommended Parameters
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
              Dataset Size
            </div>
            <div className="text-3xl font-bold text-slate-700 tracking-tight">
              {recommendation.sampleSize}{" "}
              <span className="text-lg font-medium text-slate-400">runs</span>
            </div>
          </div>
        </div>

        {/* Gemini AI Deep Insights Panel */}
        <div className="bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50 border border-indigo-100/50 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>

          <div className="flex items-center gap-2 mb-3 relative z-10">
            <svg
              className="w-5 h-5 text-indigo-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            <h3 className="font-bold text-indigo-900 tracking-tight">
              Gemini Strategy Analysis
            </h3>
          </div>

          <div className="text-indigo-950/80 leading-relaxed text-sm whitespace-pre-line relative z-10 prose prose-sm prose-indigo">
            {recommendation.explanation}
          </div>
        </div>
      </div>
    </div>
  );
}
