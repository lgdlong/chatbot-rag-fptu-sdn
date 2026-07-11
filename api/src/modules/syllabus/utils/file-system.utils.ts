import { readdir, unlink } from "node:fs/promises";
import { join } from "node:path";

/**
 * File-system helpers for the syllabus module. Lives here (not on the
 * service) so the delete pipeline is easy to read and the helpers easy
 * to test independently.
 *
 * All functions are async and best-effort: a missing file on the
 * `remove*` paths is silently skipped (`ENOENT`), anything else is
 * surfaced to the caller.
 */

const UPLOADS_DIR = "./uploads";
const CHUNKS_DIR = join(".", "uploads", "chunks");

/**
 * `unlink` that swallows `ENOENT` (idempotent delete). Any other error
 * propagates so the caller can decide what to do.
 */
export async function removeFileIfExists(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

/**
 * Delete every `chunks/<documentId>_page_N.pdf` file emitted by the
 * ingestion pipeline for a given document. Idempotent -- missing
 * directory or files are silently skipped.
 */
export async function removeChunkFiles(documentId: string): Promise<void> {
  try {
    const files = await readdir(CHUNKS_DIR);
    const chunkFiles = files.filter(
      (fileName) =>
        fileName.startsWith(`${documentId}_page_`) && fileName.endsWith(".pdf"),
    );

    await Promise.all(
      chunkFiles.map((fileName) =>
        removeFileIfExists(join(CHUNKS_DIR, fileName)),
      ),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}


