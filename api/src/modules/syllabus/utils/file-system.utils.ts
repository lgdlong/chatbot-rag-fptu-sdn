import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * File-system helpers for the syllabus module. Lives here (not on the
 * service) because the upload pipeline in `SyllabusService` writes
 * binary blobs to disk and the delete pipeline tears them back down
 * (original chunks + original PDF). Keeping the helpers in one place
 * makes the upload/delete flows easy to read and the helpers easy to
 * test independently.
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

/**
 * Persist an uploaded `File` to the `uploads/` directory under a
 * timestamped filename. Returns the relative web path (leading slash,
 * matches the pre-refactor `/uploads/...` contract) and the buffer
 * in memory so the caller can hand it to AnythingLLM without a second
 * read.
 */
export async function saveUploadedFile(
  file: File,
): Promise<{ filePath: string; buffer: Buffer }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fileName = `${Date.now()}_${file.name}`;
  await mkdir(UPLOADS_DIR, { recursive: true });

  const filePath = `/uploads/${fileName}`;
  await writeFile(`.${filePath}`, buffer);

  return { filePath, buffer };
}
