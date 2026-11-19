import { NextRequest } from "next/server";
import { getEmail } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";

// Works for both the web (session cookie) and the native app (bearer token),
// so account deletion is reachable from the iPhone app (Guideline 5.1.1).
export async function DELETE(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return new Response("Unauthorized", { status: 401 });

  const supabase = createServerClient();
  const tables = ["tasks", "notes", "goals", "braindumps", "client_sessions", "client_tasks", "clients"];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("user_email", email);
    if (error) return new Response(`Could not delete ${table}`, { status: 500 });
  }

  // Revoke all native bearer tokens issued before now
  await supabase.from("token_revocations").upsert({
    user_email: email,
    revoked_at: new Date().toISOString(),
  });

  // Clean up any pending mobile session tokens
  await supabase.from("mobile_session_tokens").delete().eq("user_email", email);

  return new Response("OK");
}
