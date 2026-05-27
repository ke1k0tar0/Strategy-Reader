/**
 * Google Sheets API reader
 * Handles connection and data retrieval from Google Sheets
 */

import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { RawSheetRow } from "@/src/types/strategy";
import { logger, AppError } from "@/src/utils/errors";

/**
 * Column mapping from sheet headers to typed fields
 */
function buildColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  headers.forEach((header) => {
    const normalized = header.toLowerCase().trim();

    // Map headers to field names (store actual header for use as row key)
    if (normalized.includes("date")) mapping["date"] = header;
    else if (normalized.includes("scope") || normalized.includes("strategy"))
      mapping["scope"] = header;
    else if (normalized.includes("parameter")) mapping["parameterSet"] = header;
    else if (normalized.includes("hypothesis")) mapping["hypothesis"] = header;
    else if (normalized.includes("change")) mapping["change"] = header;
    else if (normalized.includes("stop")) mapping["stopConditions"] = header;
    else if (normalized.includes("success")) mapping["successMetric"] = header;
    else if (normalized.includes("duration")) mapping["duration"] = header;
    else if (normalized.includes("market"))
      mapping["marketConditions"] = header;
    else if (normalized.includes("fill")) mapping["fills"] = header;
    else if (normalized.includes("pnl") || normalized.includes("profit"))
      mapping["pnl"] = header;
    else if (normalized.includes("gate") || normalized.includes("reason"))
      mapping["topGateReasons"] = header;
    else if (normalized.includes("verdict")) mapping["verdict"] = header;
    else if (normalized.includes("note")) mapping["notes"] = header;
  });

  return mapping;
}

/**
 * Convert array row to object using header mapping
 */
function rowToObject(
  row: (string | number | null)[],
  headers: string[],
): RawSheetRow {
  const obj: RawSheetRow = {};
  headers.forEach((header, index) => {
    const key =
      header && String(header).trim().length > 0
        ? header
        : `__col_${index + 1}`;
    obj[key] = row[index] ?? "";
  });
  return obj;
}

/**
 * Load and authenticate with Google Sheets API
 */
async function authenticateSheets(): Promise<ReturnType<typeof google.sheets>> {
  try {
    const credentialsPath =
      process.env.GOOGLE_SHEETS_CREDENTIALS_PATH || "credentials.json";

    if (!fs.existsSync(credentialsPath)) {
      throw new AppError(
        "MISSING_CREDENTIALS",
        `Google Sheets credentials not found at ${credentialsPath}. Follow the setup instructions in README.md`,
        400,
      );
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    return google.sheets({ version: "v4", auth });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "AUTH_FAILED",
      "Failed to authenticate with Google Sheets API",
      500,
      error,
    );
  }
}

/**
 * Fetch raw data from Google Sheets
 */
export async function fetchSheetData(): Promise<{
  headers: string[];
  rows: RawSheetRow[];
}> {
  try {
    const sheets = await authenticateSheets();
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const envRange = process.env.GOOGLE_SHEET_RANGE;

    let range = envRange || "Sheet1!A1:Z999";

    if (!sheetId) {
      throw new AppError(
        "MISSING_SHEET_ID",
        "GOOGLE_SHEET_ID environment variable not set",
        400,
      );
    }

    // Mask the sheet ID for security in logs
    const maskedSheetId = sheetId
      ? `${sheetId.substring(0, 4)}...${sheetId.substring(sheetId.length - 4)}`
      : "UNKNOWN";
    logger(
      "info",
      `Fetching Google Sheets data from ${maskedSheetId} / ${range}`,
    );
    try {
      const meta = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: "sheets.properties.title",
      });
      const firstSheetTitle =
        meta.data.sheets && meta.data.sheets.length > 0
          ? meta.data.sheets[0].properties?.title
          : undefined;

      if (firstSheetTitle) {
        const needsQuoting = !/^[A-Za-z0-9_]+$/.test(firstSheetTitle);
        const sheetNameForRange = needsQuoting
          ? `'${String(firstSheetTitle).replace(/'/g, "''")}'`
          : firstSheetTitle;
        if (envRange && envRange.includes("!")) {
          const [, suffix] = envRange.split("!");
          range = `${sheetNameForRange}!${suffix}`;
        } else {
          range = `${sheetNameForRange}!A1:Z999`;
        }
      }
    } catch (metaErr) {
      logger(
        "warn",
        "Could not read spreadsheet metadata, falling back to provided range",
        metaErr,
      );
    }

    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });
    } catch (apiError) {
      logger("error", "Google Sheets API call failed", apiError);
      throw apiError;
    }

    if (!response.data.values || response.data.values.length === 0) {
      throw new AppError("NO_DATA", "No data found in Google Sheet", 400);
    }

    const allRows = response.data.values as (string | number | null)[][];
    const maxHeaderScan = Math.min(allRows.length, 10);
    let headerRowIndex = -1;

    for (let i = 0; i < maxHeaderScan; i++) {
      const row = allRows[i] || [];
      if (row.some((cell) => String(cell ?? "").trim().length > 0)) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1)
      throw new AppError("INVALID_SHEET", "Google Sheet has no headers", 400);

    const rawHeaders = (allRows[headerRowIndex] || []) as string[];
    const headers = rawHeaders.map((h) => String(h ?? "").trim());

    const dataRows = allRows.slice(headerRowIndex + 1);

    // --- NEW: Forward Fill Logic for Merged Cells ---
    let lastDate = "";
    let lastScope = "";

    const rows = dataRows.map((row) => {
      const obj = rowToObject(row, headers);

      const dateKey = headers.find((h) => h.toLowerCase().includes("date"));
      const scopeKey = headers.find(
        (h) =>
          h.toLowerCase().includes("scope") ||
          h.toLowerCase().includes("strategy"),
      );

      if (dateKey) {
        const val = String(obj[dateKey] || "").trim();
        if (val) lastDate = val;
        else if (lastDate) obj[dateKey] = lastDate; // Forward fill empty merged cell
      }

      if (scopeKey) {
        const val = String(obj[scopeKey] || "").trim();
        if (val) lastScope = val;
        else if (lastScope) obj[scopeKey] = lastScope; // Forward fill empty merged cell
      }

      return obj;
    });

    logger(
      "info",
      `Successfully fetched ${rows.length} rows from Google Sheets`,
    );
    return { headers, rows };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "FETCH_FAILED",
      "Failed to fetch data from Google Sheets",
      500,
      error,
    );
  }
}

/**
 * Get all experiments from Google Sheets
 */
export async function getSheetExperiments(): Promise<{
  data: RawSheetRow[];
  columnMapping: Record<string, string>;
  headers: string[];
}> {
  const { headers, rows } = await fetchSheetData();
  const columnMapping = buildColumnMapping(headers);

  // Validate that we have all required columns
  const requiredColumns = ["date", "scope", "parameterSet", "fills", "pnl"];
  const missingColumns = requiredColumns.filter(
    (col) => !(col in columnMapping),
  );

  if (missingColumns.length > 0) {
    throw new AppError(
      "MISSING_COLUMNS",
      `Your spreadsheet is missing required columns: ${missingColumns.join(", ")}.`,
      400,
      { missingColumns },
    );
  }

  return {
    data: rows,
    columnMapping,
    headers,
  };
}
