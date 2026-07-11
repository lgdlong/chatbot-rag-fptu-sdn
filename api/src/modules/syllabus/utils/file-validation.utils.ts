// Server-side MIME validation — do NOT trust file extension alone
// PDF magic bytes: %PDF- (hex: 25 50 44 46)
const PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46]);

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileValidationError";
  }
}

/**
 * Check file's first bytes match PDF magic number.
 * Only reads first 4 bytes — does NOT read entire file.
 */
export function isPdfByContent(header: Buffer): boolean {
  if (header.length < 4) return false;
  return (
    header[0] === PDF_MAGIC_BYTES[0] &&
    header[1] === PDF_MAGIC_BYTES[1] &&
    header[2] === PDF_MAGIC_BYTES[2] &&
    header[3] === PDF_MAGIC_BYTES[3]
  );
}

/**
 * Sanitize filename: remove path traversal chars, null bytes,
 * normalize whitespace, strip special chars except . - _
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, "") // strip path traversal + illegal chars
    .replace(/\0/g, "")            // strip null bytes
    .replace(/\s+/g, " ")          // normalize whitespace
    .trim()
    .slice(0, 255);                // max filename length
}

/**
 * Build safe publicId for Cloudinary:
 *   fptu_rag/{courseCode}/{timestamp}_{sanitized-name}
 * No spaces, no special chars beyond _ and -
 */
export function buildPublicId(courseCode: string, originalName: string): string {
  const safeName = sanitizeFilename(originalName.replace(/\.[^.]+$/, ""))
    .replace(/\s+/g, "_");
  const safeCode = courseCode.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return `fptu_rag/${safeCode}/${Date.now()}_${safeName}`;
}
