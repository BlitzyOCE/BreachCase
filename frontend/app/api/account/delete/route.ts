import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  // Verify the user is authenticated
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // 1. Anonymize comments (set user_id to NULL so they show "Deleted User")
  // The comments table may not exist yet (Build 4), but this is safe — it's a no-op if the table doesn't exist
  try {
    await adminClient
      .from("comments")
      .update({ user_id: null })
      .eq("user_id", user.id);
  } catch {
    // Comments table may not exist yet — ignore
  }

  // 2. Delete the profile (cascades to saved_breaches, watchlists via FK)
  const { error: profileError } = await adminClient
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 500 }
    );
  }

  // 3. Delete from auth.users via admin API
  const { error: authError } =
    await adminClient.auth.admin.deleteUser(user.id);

  if (authError) {
    return NextResponse.json(
      { error: "Failed to delete auth account" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
