import app from "../../server";

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/AIzaSy[A-Za-z0-9_-]{33}/g, "AIzaSy[REDACTED_API_KEY]")
    .replace(/(api[_-]?key[:=]\s*["']?)[^"'\s,]+/gi, "$1[REDACTED]")
    .replace(/(bearer\s+)[A-Za-z0-9_.\-]+/gi, "$1[REDACTED_TOKEN]");
}

export default async function handler(req: any, res: any) {
  try {
    await app(req, res);
  } catch (error) {
    console.error("Generate-stream function handler failed:", safeErrorMessage(error));
    if (res.headersSent) {
      if (!res.writableEnded) res.end();
      return;
    }

    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({
      error: "Internal server error.",
      code: "INTERNAL_SERVER_ERROR",
    }));
  }
}
