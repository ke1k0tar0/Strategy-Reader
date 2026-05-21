"use client";

import { NormalizedExperiment } from "@/src/types/strategy";

interface HistoricalDataTableProps {
  experiments: NormalizedExperiment[];
}

export function HistoricalDataTable({ experiments }: HistoricalDataTableProps) {
  if (!experiments || experiments.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="bg-slate-50/50 border-b border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <svg
            className="w-5 h-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Historical Supporting Data
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Detailed breakdown of {experiments.length} analyzed experiment
          {experiments.length === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Hypothesis</th>
              <th className="px-6 py-4 text-right">Fills</th>
              <th className="px-6 py-4 text-right">PnL</th>
              <th className="px-6 py-4">AI Verdict Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {experiments.map((exp) => {
              const status = exp.aiVerdictStatus || "Neutral";

              // Dynamic color-coding based on the AI's classification
              const statusColors =
                status === "Pass"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : status === "Fail"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-slate-100 text-slate-700 border-slate-200";

              return (
                <tr
                  key={exp.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                    {exp.date}
                  </td>
                  <td className="px-6 py-4 max-w-[280px]">
                    {/* The hypothesis is visually clamped to 2 lines for summary readability, full text on hover */}
                    <span
                      className="text-slate-700 font-medium leading-snug line-clamp-2"
                      title={exp.hypothesis}
                    >
                      {exp.hypothesis || "No hypothesis recorded."}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-700">
                    {exp.fills}%
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-bold ${exp.pnl > 0 ? "text-emerald-600" : exp.pnl < 0 ? "text-red-600" : "text-slate-600"}`}
                  >
                    {exp.pnl > 0 ? "+" : ""}
                    {exp.pnl.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 min-w-[250px]">
                    <div className="flex flex-col items-start gap-1.5">
                      <span
                        className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${statusColors}`}
                      >
                        {status}
                      </span>
                      <span
                        className="text-slate-700 font-medium leading-snug line-clamp-2"
                        title={`Raw Sheet Notes: ${exp.verdict}`}
                      >
                        {exp.aiVerdictSummary || exp.verdict}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
