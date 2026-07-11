import { AuditLogRepository } from "../repositories/audit-log.repository.js";

export type AuditAction =
  | "CREATE_SYLLABUS"
  | "UPDATE_SYLLABUS"
  | "APPROVE_SYLLABUS"
  | "ACTIVATE_SYLLABUS"
  | "DEACTIVATE_SYLLABUS"
  | "DELETE_SYLLABUS"
  | "UPLOAD_DOCUMENT"
  | "DELETE_DOCUMENT"
  | "DISABLE_LECTURER"
  | "ENABLE_LECTURER"
  | "CREATE_LECTURER";

export type AuditEntityType = "Syllabus" | "Document" | "Lecturer" | "User";

export async function createAuditLog(params: {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  details?: Record<string, unknown>;
}) {
  await AuditLogRepository.create({
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
  });
}
