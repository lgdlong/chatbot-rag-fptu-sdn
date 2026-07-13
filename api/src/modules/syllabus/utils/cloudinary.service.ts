import { Readable } from "node:stream";
import { cloudinary, initCloudinary } from "./cloudinary.config.js";
import { logger } from "../../../utils/logger.js";

// Initialize Cloudinary once at module load
try {
  initCloudinary();
} catch (err) {
  logger.warn("[Cloudinary] Init failed — upload will fail", { error: err instanceof Error ? err.message : String(err) });
}

// ── Error Hierarchy ──────────────────────────────────

export class CloudinaryError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "CloudinaryError";
  }
}

export class CloudinaryUploadError extends CloudinaryError {
  constructor(m: string, c?: Error) {
    super(m, c);
    this.name = "CloudinaryUploadError";
  }
}

export class CloudinaryDeleteError extends CloudinaryError {
  constructor(m: string, c?: Error) {
    super(m, c);
    this.name = "CloudinaryDeleteError";
  }
}

// ── Retry Policy ─────────────────────────────────────

const RETRY_MAX = 3;
const BASE_DELAY_MS = 1000;

async function withRetry<T>(
  operation: () => Promise<T>,
  label: string,
): Promise<T> {
  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      return await operation();
    } catch (err) {
      const isLast = attempt === RETRY_MAX;
      if (isLast) throw err;

      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      logger.warn(
        `[Cloudinary] ${label} attempt ${attempt}/${RETRY_MAX} failed, retrying in ${delay}ms`,
        { error: err instanceof Error ? err.message : String(err) },
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("unreachable");
}

// ── Upload ───────────────────────────────────────────

interface UploadResult {
  secureUrl: string;
  publicId: string;
}

export async function uploadFileBuffer(
  buffer: Buffer,
  publicId: string,
): Promise<UploadResult> {
  return withRetry(async () => {
    return new Promise<UploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: "raw",
          folder: "sdn302/fptu_rag",
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (err, result) => {
          if (err) {
            logger.error("[Cloudinary] Upload stream error", {
              publicId,
              error: err.message,
            });
            return reject(
              new CloudinaryUploadError(`Upload failed: ${err.message}`, err),
            );
          }
          if (!result?.secure_url || !result?.public_id) {
            return reject(
              new CloudinaryUploadError(
                "Upload response missing secure_url or public_id",
              ),
            );
          }
          logger.info("[Cloudinary] Upload success", {
            publicId: result.public_id,
            bytes: result.bytes,
          });
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
          });
        },
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(stream);

      readable.on("error", (err) => {
        reject(
          new CloudinaryUploadError(
            `Buffer stream error: ${err.message}`,
            err,
          ),
        );
      });
    });
  }, `upload:${publicId}`);
}

// ── Delete ───────────────────────────────────────────

export async function deleteByUrl(fileUrl: string): Promise<void> {
  const publicId = extractPublicId(fileUrl);
  if (!publicId) {
    logger.warn(
      "[Cloudinary] Cannot extract publicId from URL, skipping delete",
      { fileUrl: fileUrl.substring(0, 100) },
    );
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
      invalidate: true,
    });

    if (result.result === "ok") {
      logger.info("[Cloudinary] Delete success", { publicId });
    } else if (result.result === "not found") {
      logger.info("[Cloudinary] Delete skipped — already deleted", { publicId });
    } else {
      logger.warn("[Cloudinary] Delete unexpected result", {
        publicId,
        result: result.result,
      });
    }
  } catch (err) {
    throw new CloudinaryDeleteError(
      `Delete failed for ${publicId}: ${err instanceof Error ? err.message : String(err)}`,
      err instanceof Error ? err : undefined,
    );
  }
}

// ── URL Parsing ──────────────────────────────────────

const CLOUDINARY_URL_PATTERN =
  /^https:\/\/res\.cloudinary\.com\/.+\/raw\/upload\/v\d+\/(.+)$/;

export function extractPublicId(secureUrl: string): string | null {
  if (!secureUrl || typeof secureUrl !== "string") return null;

  // Guard: only parse URLs from known Cloudinary domains
  if (!secureUrl.includes("cloudinary.com")) return null;

  const match = secureUrl.match(CLOUDINARY_URL_PATTERN);
  if (!match) {
    // Fallback: extract everything after version prefix
    const parts = secureUrl.split("/");
    const versionIdx = parts.findIndex((p) => /^v\d+$/.test(p));
    if (versionIdx === -1) return null;
    const raw = parts.slice(versionIdx + 1).join("/");
    return raw.replace(/\.[^.]+$/, "");
  }
  // Remove file extension from captured public_id
  return match[1].replace(/\.[^.]+$/, "");
}
