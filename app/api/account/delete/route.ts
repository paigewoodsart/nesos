import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";

export async function DELETE() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return new Response("Unauthorized", { status: 401 });

  const tables = ["tasks", "notes", "goals", "braindumps", "client_sessions", "client_tasks", "clients"];
  for (const table of tables) {
    await supabase.from(table).delete().eq("user_email", email);
  }

  // Revoke all native bearer tokens issued before now
  const serverSupabase = createServerClient();
  await serverSupabase.from("token_revocations").upsert({
    user_email: email,
    revoked_at: new Date().toISOString(),
  });

  // Clean up any pending mobile session tokens
  await serverSupabase.from("mobile_session_tokens").delete().eq("user_email", email);

  return new Response("OK");
}
