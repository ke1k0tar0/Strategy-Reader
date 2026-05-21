"use client";

import { ApiErrorResponse } from "@/src/types/strategy";

interface ErrorAlertProps {
  error: ApiErrorResponse | string;
  onDismiss?: () => void;
}

export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  const message = typeof error === "string" ? error : error.error;
  const code = typeof error === "string" ? "ERROR" : error.code;
  const details = typeof error === "string" ? null : (error.details as any);

  // Determine if this is an informational empty state vs a real error
  const isInfo = code === "NO_RECOMMENDATIONS";

  const colors = isInfo
    ? {
        bg: "bg-blue-50/90",
        border: "border-blue-200",
        text: "text-blue-900",
        subtext: "text-blue-700",
        iconBg: "bg-blue-100",
        iconText: "text-blue-600",
      }
    : {
        bg: "bg-red-50/90",
        border: "border-red-200",
        text: "text-red-900",
        subtext: "text-red-700",
        iconBg: "bg-red-100",
        iconText: "text-red-600",
      };

  return (
    <div
      className={`${colors.bg} backdrop-blur-md border ${colors.border} rounded-2xl p-6 mb-8 shadow-sm animate-in fade-in slide-in-from-top-2`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 ${colors.iconBg} ${colors.iconText} rounded-full flex items-center justify-center shrink-0`}
          >
            {isInfo ? (
              <svg
                className="w-5 h-5"
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
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${colors.text} tracking-tight`}>
              {code === "NO_VALID_DATA"
                ? "Spreadsheet Parsing Error"
                : code === "MISSING_COLUMNS"
                  ? "Missing Required Columns"
                  : code === "NO_RECOMMENDATIONS"
                    ? "Awaiting Experiment Data"
                    : `System Error: ${code}`}
            </h3>
            <p className={`${colors.subtext} font-medium mt-0.5 text-sm`}>
              {code === "NO_RECOMMENDATIONS"
                ? "You haven't added any completed experiments for this strategy to your Google Sheet yet (or the rows were redacted due to a missing date). Please add data to generate AI insights."
                : message}
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${colors.subtext} hover:opacity-70 p-2 rounded-full transition-opacity`}
            title="Dismiss"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {details && typeof details === "object" && (
        <div
          className={`mt-5 ${isInfo ? "bg-white/50 border-blue-100" : "bg-white/70 border-red-100"} rounded-xl p-4 border`}
        >
          <h4
            className={`text-xs font-bold ${isInfo ? "text-blue-800" : "text-red-800"} uppercase tracking-wider mb-3 flex items-center gap-2`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Diagnostic Details
          </h4>

          {code === "MISSING_COLUMNS" && details.missingColumns && (
            <div className="text-sm text-red-800">
              <p className="mb-2">
                Your Google Sheet is missing the following headers. Please add
                them to Row 1:
              </p>
              <div className="flex gap-2 flex-wrap">
                {details.missingColumns.map((col: string) => (
                  <span
                    key={col}
                    className="font-mono bg-red-100 border border-red-200 px-2.5 py-1 rounded-md text-red-900 font-semibold shadow-sm"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {details.errors &&
            Array.isArray(details.errors) &&
            details.errors.length > 0 && (
              <div className="max-h-56 overflow-y-auto pr-2 space-y-2">
                {details.errors.slice(0, 50).map((err: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex gap-3 text-sm items-start bg-red-50/50 p-2 rounded-lg border border-red-50"
                  >
                    <span className="font-mono text-xs bg-red-200 text-red-900 px-2 py-1 rounded shadow-sm shrink-0 mt-0.5">
                      Row {err.rowIndex}
                    </span>
                    <span className="text-red-800 leading-relaxed">
                      {err.error}
                    </span>
                  </div>
                ))}
                {details.errors.length > 50 && (
                  <div className="text-center text-xs font-bold text-red-500 py-2">
                    ...and {details.errors.length - 50} more rows with errors.
                  </div>
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
