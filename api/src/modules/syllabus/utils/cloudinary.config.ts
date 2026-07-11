import { v2 as cloudinary } from "cloudinary";
import { ENV } from "../../../config/env.js";

/**
 * Initialize Cloudinary SDK with environment variables.
 * Throws if any required variable is missing — call once at module load.
 *
 * IMPORTANT: This file must NOT import from cloudinary.service.ts
 * to avoid circular dependency. Error is thrown as a plain Error.
 */
export function initCloudinary(): void {
  if (
    !ENV.CLOUDINARY_CLOUD_NAME ||
    !ENV.CLOUDINARY_API_KEY ||
    !ENV.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Cloudinary is not configured. Missing CLOUDINARY_CLOUD_NAME, " +
        "CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET in environment variables.",
    );
  }

  cloudinary.config({
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    api_key: ENV.CLOUDINARY_API_KEY,
    api_secret: ENV.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary };
