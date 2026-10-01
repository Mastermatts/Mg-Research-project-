import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminRole =
  | "super_admin"
  | "research_admin"
  | "template_admin"
  | "finance_admin"
  | "reviewer";

export type AdminPermission =
  | "students.view"
  | "students.edit"
  | "research.view"
  | "research.edit"
  | "templates.view"
  | "templates.create"
  | "templates.edit"
  | "templates.publish"
  | "payments.view"
  | "payments.manage"
  | "settings.manage"
  | "admins.manage";

export interface AdminContext {
  userId: string;
  role: AdminRole;
}

/**
 * Loads the current signed-in admin's row from admin_users, or null if the
 * caller is not an active admin. This is the ONLY source of truth for admin
 * identity — never trust a client-sent role or permission flag.
 */
export async function getAdminContext(
  supabase: SupabaseClient
): Promise<AdminContext | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return null;

  const { data } = await supabase
    .from("admin_users")
    .select("role, is_active")
    .eq("id", auth.user.id)
    .single();

  if (!data || !data.is_active) return null;
  return { userId: auth.user.id, role: data.role as AdminRole };
}

/**
 * Server-side permission check. Always re-verifies against admin_permissions
 * via the admin_has_permission() SQL function — never inferred from a role
 * string the client sent.
 */
export async function requirePermission(
  supabase: SupabaseClient,
  permission: AdminPermission
): Promise<AdminContext> {
  const ctx = await getAdminContext(supabase);
  if (!ctx) {
    throw new AdminAuthError("Not signed in as an administrator.", 401);
  }

  const { data, error } = await supabase.rpc("admin_has_permission", {
    uid: ctx.userId,
    perm: permission,
  });

  if (error || !data) {
    throw new AdminAuthError(
      `You do not have the "${permission}" permission.`,
      403
    );
  }

  return ctx;
}

export class AdminAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Convenience wrapper for API routes: builds a server client and checks the permission in one call. */
export async function requireAdminPermission(permission: AdminPermission) {
  const supabase = await createServerSupabaseClient();
  const ctx = await requirePermission(supabase, permission);
  return { supabase, ctx };
}

/** Like requireAdminPermission, but only requires an active admin session (any role). */
export async function requireAnyAdmin() {
  const supabase = await createServerSupabaseClient();
  const ctx = await getAdminContext(supabase);
  if (!ctx) throw new AdminAuthError("Not signed in as an administrator.", 401);
  return { supabase, ctx };
}
