import { getSupabaseAdminClient } from "./supabase";

/**
 * Resolves a workspace slug to its UUID in the database.
 */
export async function resolveWorkspaceId(slug: string): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    throw new Error(`Failed to resolve workspace slug "${slug}": ${error?.message || "Not found"}`);
  }
  return data.id;
}
