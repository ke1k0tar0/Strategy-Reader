/**
 * AI Analysis Engine
 * Uses Google's Gemini API to act as the sole optimization engine
 */

import { NormalizedExperiment } from "@/src/types/strategy";
import { logger, AppError } from "@/src/utils/errors";

export async function generateAIAnalysis(
  experiments: NormalizedExperiment[],
  strategyName: string,
): Promise<any> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new AppError(
        "API_KEY_MISSING",
        "GEMINI_API_KEY is not configured in environment variables.",
        500,
      );
    }

    const analysisData = experiments.map((exp) => ({
      date: exp.date,
      hypothesis: exp.hypothesis,
      change: exp.change,
      parameters: exp.parameterSet,
      verdict: exp.verdict,
      pnl: exp.pnl,
      fills: `${exp.fills}%`,
    }));

    const prompt = `
      You are an expert Quantitative Trading AI Optimization Engine.
      Analyze ALL the historical experiment data below for the strategy "${strategyName}".
      
      Data:
      ${JSON.stringify(analysisData)}
      
      YOUR TASK:
      Analyze the hypotheses, parameter changes, verdicts, PnL, and Fill Rates.
      Determine the absolute best optimal parameter combination by finding cross-parameter relationships and identifying the most successful historical conditions.
      
      Respond ONLY with a valid JSON object strictly matching this format:
      {
        "recommendedParameters": { "param_key": value },
        "expectedPnL": number (your estimated realistic PnL),
        "expectedFillRate": number (your estimated fill rate percentage, e.g. 85.5),
        "confidence": number (between 0 and 1, representing your confidence in this combo),
        "explanation": "A 2-3 paragraph deep explanation of WHY this combination is optimal, citing specific dates, data points, and cross-parameter relationships."
      }
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: {
            parts: [
              {
                text: "You are a quantitative trading JSON API. You evaluate data and output strictly valid JSON.",
              },
            ],
          },
          generationConfig: {
            temperature: 0.2, // Low temperature for high logical consistency
            responseMimeType: "application/json", // Forces Gemini to output pure JSON
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      logger("error", "Gemini API call failed", {
        status: response.status,
        error: errText,
      });
      throw new AppError(
        "AI_ERROR",
        "Failed to retrieve AI analysis.",
        500,
        errText,
      );
    }

    const aiResult = await response.json();
    const jsonText = aiResult.candidates[0].content.parts[0].text;

    return JSON.parse(jsonText);
  } catch (error) {
    logger("error", "Failed to generate AI analysis", error);
    throw error;
  }
}
