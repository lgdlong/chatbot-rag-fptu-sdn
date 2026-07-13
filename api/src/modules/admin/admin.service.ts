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

export interface TeacherStats {
  totalLecturers: number;
  activeLastWeek: number;
  unsyncedSyllabuses: number;
  topTeachers: Array<{
    userId: string;
    name: string;
    email: string;
    sessionCount: number;
  }>;
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

  /**
   * Returns teacher-related statistics for the admin dashboard.
   *
   * - totalLecturers: number of users with role LECTURER
   * - activeLastWeek: LECTURER users who created a chat session in last 7 days
   * - unsyncedSyllabuses: syllabuses without a SYNCED RagWorkspace
   * - topTeachers: top 5 LECTURER users by chat session count
   */
  static async getTeacherStats(): Promise<TeacherStats> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalLecturers,
      activeUsers,
      totalSyllabuses,
      syncedWorkspaces,
      topGroups,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "LECTURER" } }),
      prisma.chatSession.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          user: { role: "LECTURER" },
        },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.syllabus.count(),
      prisma.ragWorkspace.count({ where: { syncStatus: "SYNCED" } }),
      prisma.chatSession.groupBy({
        by: ["userId"],
        _count: { id: true },
        where: { user: { role: "LECTURER" } },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);

    const activeLastWeek = activeUsers.length;
    const unsyncedSyllabuses = totalSyllabuses - syncedWorkspaces;

    // Resolve user names/emails for top teachers
    const topUserIds = topGroups.map((g) => g.userId);
    const users =
      topUserIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: topUserIds } },
            select: { id: true, name: true, email: true },
          })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const topTeachers = topGroups.map((g) => ({
      userId: g.userId,
      name: userMap.get(g.userId)?.name ?? "Unknown",
      email: userMap.get(g.userId)?.email ?? "",
      sessionCount: g._count.id,
    }));

    return {
      totalLecturers,
      activeLastWeek,
      unsyncedSyllabuses,
      topTeachers,
    };
  }
}
