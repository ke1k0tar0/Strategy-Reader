/**
 * Utility functions for error handling and logging
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleError(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
  details?: unknown;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: "UNKNOWN_ERROR",
      statusCode: 500,
    };
  }

  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}

export function logger(
  level: "info" | "warn" | "error",
  message: string,
  data?: unknown,
): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (level === "error") {
    if (data !== undefined) console.error(prefix, message, data);
    else console.error(prefix, message);
  } else if (level === "warn") {
    if (data !== undefined) console.warn(prefix, message, data);
    else console.warn(prefix, message);
  } else {
    if (data !== undefined) console.log(prefix, message, data);
    else console.log(prefix, message);
  }
}
