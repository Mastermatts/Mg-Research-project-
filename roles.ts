import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "student" | "lecturer" | "admin";

export async function getUserRole(supabase: SupabaseClient, userId: string): Promise<UserRole | null> {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return (data?.role as UserRole) ?? null;
}

export function isStaffRole(role: UserRole | null): boolean {
  return role === "admin" || role === "lecturer";
}
