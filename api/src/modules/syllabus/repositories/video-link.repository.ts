import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * VideoLinkRepository -- pure data-access wrapper for the `video_links`
 * table (external lecture video URLs).
 *
 * Track G surface. All methods static, accept optional
 * `tx?: Prisma.TransactionClient` (Phase 0.4 transaction pattern).
 */
export class VideoLinkRepository {
  static async deleteBySyllabus(
    syllabusId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.videoLink.deleteMany({ where: { syllabusId } });
  }

  static async create(
    data: Prisma.VideoLinkCreateInput,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.videoLink.create({ data });
  }
}
