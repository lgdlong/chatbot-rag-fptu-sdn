// Supported file types: extension → { magic bytes, MIME type, label }
export const SUPPORTED_TYPES = {
  pdf:  { magic: [0x25, 0x50, 0x44, 0x46], mime: "application/pdf", label: "PDF" },
  docx: { magic: [0x50, 0x4b],              mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "DOCX" },
  pptx: { magic: [0x50, 0x4b],              mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", label: "PPTX" },
  txt:  { magic: null,                       mime: "text/plain", label: "TXT" },
  md:   { magic: null,                       mime: "text/markdown", label: "Markdown" },
} as const;

export type FileExtension = keyof typeof SUPPORTED_TYPES;

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileValidationError";
  }
}

/**
 * Detect file type by extension + magic bytes.
 * Returns the extension key or null if unsupported/invalid.
 */
export function detectFileType(
  fileName: string,
  header: Buffer,
): { ext: FileExtension; mime: string } | null {
  const ext = fileName.split(".").pop()?.toLowerCase() as FileExtension | undefined;
  if (!ext || !(ext in SUPPORTED_TYPES)) return null;

  const info = SUPPORTED_TYPES[ext];

  // Text types (txt, md) — no magic bytes, accept if text-like
  if (info.magic === null) {
    // Quick check: no null bytes in first 512 bytes (binary detection)
    const sample = header.subarray(0, Math.min(header.length, 512));
    const hasBinary = sample.includes(0x00);
    if (hasBinary) return null;
    return { ext, mime: info.mime };
  }

  // Binary types (pdf, docx, pptx) — check magic bytes
  if (header.length < info.magic.length) return null;
  for (let i = 0; i < info.magic.length; i++) {
    if (header[i] !== info.magic[i]) return null;
  }

  // DOCX and PPTX share PK magic; both are valid ZIP archives
  return { ext, mime: info.mime };
}

/**
 * Sanitize filename: remove path traversal chars, null bytes,
 * normalize whitespace, strip special chars except . - _
 */
/**
 * Filename regex: allow only letters, digits, spaces, dots, dashes, underscores.
 * Rejects anything else (incl & % # + = @ $ ;) that would break URLs / Cloudinary.
 */
export const SAFE_FILENAME_RE = /^[\w\s.\-]+$/;

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s.\-_]/g, "") // remove unsafe chars (& % # + = ...)
    .replace(/\0/g, "")                  // strip null bytes
    .replace(/\s+/g, " ")                // normalize whitespace
    .trim()
    .slice(0, 255);                      // max filename length
}

/**
 * Build safe publicId for Cloudinary (relative to `sdn302/fptu_rag` folder):
 *   {courseCode}/{syllabusId}/{timestamp}_{sanitized-name}
 * syllabusId = syllabus auto-increment ID (e.g. 153).
 * No spaces, no special chars beyond _ and -
 */
export function buildPublicId(courseCode: string, originalName: string, syllabusId: number): string {
  const safeName = sanitizeFilename(originalName.replace(/\.[^.]+$/, ""))
    .replace(/\s+/g, "_");
  const safeCode = courseCode.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return `${safeCode}/${syllabusId}/${Date.now()}_${safeName}`;
}
