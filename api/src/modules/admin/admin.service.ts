/**
 * AdminStatsService — aggregates dashboard statistics from the Prisma database.
 *
 * Layer rule: this is a read-only reporting service that queries multiple
 * tables via the global prisma client directly.  No write operations.
 */
import { prisma } from "../auth/services/db.service.js";

export interface DashboardStats {
  /** Users with role ADMIN */
  admins: number;
  /** Users with role LECTURER */
  lecturers: number;
  /** Whitelisted emails (email_whitelist table) */
  whitelist: number;
  /** Users with role STUDENT */
  students: number;
  /** Total syllabuses */
  syllabuses: number;
  /** Total courses */
  courses: number;
  /** Total uploaded documents */
  documents: number;
  /** Total chat sessions created */
  chatSessions: number;
}

export interface QueryTrendItem {
  month: string; // "YYYY-MM"
  queries: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: unknown;
  createdAt: string;
  user: {
    name: string;
    email: string;
  } | null;
}

export class AdminStatsService {
  /**
   * Returns aggregate counts across all major entity tables.
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    const [admins, whitelist, syllabuses, courses, documents, chatSessions] =
      await Promise.all([
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.emailWhitelist.count(),
        prisma.syllabus.count(),
        prisma.course.count(),
        prisma.document.count(),
        prisma.chatSession.count(),
      ]);

    // role-aware: grab lecturers + students from user table
    const lecturers = await prisma.user.count({
      where: { role: "LECTURER" },
    });
    const students = await prisma.user.count({
      where: { role: "STUDENT" },
    });

    return { admins, lecturers, whitelist, students, syllabuses, courses, documents, chatSessions };
  }

  /**
   * Returns monthly query counts from ChatMessage (sender = USER),
   * grouped by calendar month, newest first.
   */
  static async getQueryTrend(months = 12): Promise<QueryTrendItem[]> {
    // raw SQL to avoid Prisma's limited GROUP BY on DateTime
    const rows: Array<{ month: string; count: bigint }> = await prisma.$queryRaw`
      SELECT
        TO_CHAR("created_at", 'YYYY-MM') AS month,
        COUNT(*)::bigint AS count
      FROM chat_messages
      WHERE sender = 'USER'
        AND "created_at" >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month ASC
    `;

    return rows.map((r) => ({
      month: r.month,
      queries: Number(r.count),
    }));
  }

  /**
   * Returns the most recent audit log entries with the acting user's name
   * and email.  Falls back to bare entries when the user relation is missing.
   */
  static async getRecentActivity(limit = 20): Promise<ActivityItem[]> {
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return logs.map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      details: l.details,
      createdAt: l.createdAt.toISOString(),
      user: l.user
        ? { name: l.user.name, email: l.user.email }
        : null,
    }));
  }
}
