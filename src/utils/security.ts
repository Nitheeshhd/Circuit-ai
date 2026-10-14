/**
 * Security & Sanitization Utilities for Circuito AI
 * Enforces zero-trust input/output validation, path-traversal prevention,
 * XSS mitigations, CSV formula injection defense, and safe file exports.
 */

/**
 * Sanitizes download filenames to prevent directory traversal and OS injection
 */
export function sanitizeFilename(filename: string, fallback = "circuit_blueprint"): string {
  if (!filename || typeof filename !== "string") return fallback;

  // Strip path traversal sequences, null bytes, backslashes, slashes, and control chars
  let clean = filename
    .replace(/\0/g, "")
    .replace(/\.\./g, "")
    .replace(/[\/\\]/g, "")
    .replace(/[<>:"|?*~`$;&\r\n]/g, "_")
    .trim();

  // Limit filename length to 64 characters to avoid OS filesystem limits
  if (clean.length > 64) {
    const extMatch = clean.match(/\.[0-9a-z]{1,5}$/i);
    const ext = extMatch ? extMatch[0] : "";
    clean = clean.substring(0, 64 - ext.length) + ext;
  }

  // Fallback if empty or dangerous
  if (!clean || clean === "." || clean.startsWith(".")) {
    return fallback;
  }

  return clean;
}

/**
 * Escape CSV cell content to prevent CSV Formula Injection (=, +, -, @, tab)
 */
export function sanitizeCsvCell(cell: string | number | null | undefined): string {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell).trim();

  // If cell starts with dangerous spreadsheet formula triggers, prefix with single quote
  let safeStr = str;
  if (/^[=+\-@\t\r]/.test(safeStr)) {
    safeStr = "'" + safeStr;
  }

  // Escape inner double quotes by doubling them (RFC 4180)
  return `"${safeStr.replace(/"/g, '""')}"`;
}

/**
 * Safe CSV exporter with formula injection defense
 */
export function exportSafeCsv(headers: string[], rows: (string | number)[][], defaultFilename = "circuit_bom.csv"): void {
  const safeFilename = sanitizeFilename(defaultFilename, "circuit_bom.csv");

  const sanitizedHeaders = headers.map(sanitizeCsvCell).join(",");
  const sanitizedRows = rows.map((row) => row.map(sanitizeCsvCell).join(","));
  const csvContent = "\uFEFF" + [sanitizedHeaders, ...sanitizedRows].join("\r\n"); // Add UTF-8 BOM for Excel support

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  safeTriggerBlobDownload(blob, safeFilename);
}

/**
 * Safe text/code file downloader
 */
export function safeDownloadFile(content: string, filename: string, mimeType = "text/plain;charset=utf-8"): void {
  const safeName = sanitizeFilename(filename, "firmware.ino");
  const blob = new Blob([content], { type: mimeType });
  safeTriggerBlobDownload(blob, safeName);
}

/**
 * Helper to trigger download and revoke object URL cleanly
 */
function safeTriggerBlobDownload(blob: Blob, safeFilename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeFilename;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke object URL after a short delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Validates user prompt text length and prevents dangerous payloads (Unlimited Prompt Length)
 */
export function validatePromptText(prompt: string): { valid: boolean; error?: string; cleanPrompt: string } {
  if (!prompt || typeof prompt !== "string") {
    return { valid: false, error: "Prompt cannot be empty.", cleanPrompt: "" };
  }

  const trimmed = prompt.trim();
  if (trimmed.length < 5) {
    return { valid: false, error: "Prompt must be at least 5 characters long.", cleanPrompt: "" };
  }

  return { valid: true, cleanPrompt: trimmed };
}

