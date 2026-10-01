import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditAction =
  | "student.account_updated"
  | "student.account_deactivated"
  | "student.account_reactivated"
  | "template.created"
  | "template.version_created"
  | "template.version_published"
  | "template.archived"
  | "programme.created"
  | "programme.updated"
  | "programme.deleted"
  | "department.created"
  | "department.updated"
  | "department.deleted"
  | "campus.created"
  | "campus.updated"
  | "campus.deleted"
  | "supervisor.created"
  | "supervisor.updated"
  | "supervisor.deleted"
  | "facility.created"
  | "facility.updated"
  | "facility.deleted"
  | "research_area.created"
  | "research_area.updated"
  | "research_area.deleted"
  | "topic.approved"
  | "topic.rejected"
  | "topic.marked_unavailable"
  | "topic.archived"
  | "ai_config.updated"
  | "pricing.updated"
  | "payment.status_changed"
  | "payment.refund_issued"
  | "document.viewed_metadata"
  | "drive.connection_viewed"
  | "admin_user.created"
  | "admin_user.role_changed"
  | "admin_user.deactivated"
  | "settings.updated"
  | "integrity_flag.reviewed";

/**
 * Writes an append-only audit log row. There is no update/delete policy on
 * audit_logs for any role, so once written an entry cannot be altered by the
 * application — only inserted. Never await-fails the caller's own action:
 * logging failures are swallowed (and reported to console) rather than
 * blocking the admin operation that triggered them.
 */
export async function logAdminAction(
  supabase: SupabaseClient,
  params: {
    adminId: string;
    action: AuditAction;
    entityType?: string;
    entityId?: string;
    details?: Record<string, unknown>;
    result?: "successful" | "failed";
  }
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      admin_id: params.adminId,
      action: params.action,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      details: params.details ?? null,
      result: params.result ?? "successful",
    });
  } catch (err) {
    console.error("[audit] failed to write audit log entry:", err);
  }
}
