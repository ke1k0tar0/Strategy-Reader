/**
 * Parameter JSON parser
 */
import { ParameterSet } from "@/src/types/strategy";

export function parseParameterJSON(jsonString: string): ParameterSet | null {
  try {
    if (
      !jsonString ||
      String(jsonString).trim() === "" ||
      jsonString.trim() === "-"
    )
      return null;

    let sanitized = String(jsonString).trim();
    let parsed: any = null;

    try {
      // 1. Strict parse
      parsed = JSON.parse(sanitized);
    } catch (e1) {
      // 2. Auto-wrap braces
      let wrapped = sanitized;
      if (!wrapped.startsWith("{") && !wrapped.startsWith("[")) {
        wrapped = "{" + wrapped.replace(/,\s*$/, "") + "}";
      }
      try {
        parsed = JSON.parse(wrapped);
      } catch (e2) {
        // 3. Relaxed JS evaluation
        try {
          const fn = new Function("return " + wrapped);
          parsed = fn();
        } catch (e3) {
          return null;
        }
      }
    }

    // Handle double-stringification
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch (e) {}
    }

    if (!parsed || typeof parsed !== "object") return null;

    // We no longer flatten the parameters here so the AI and UI can maintain logical groups!
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch (error) {
    return null;
  }
}
