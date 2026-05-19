import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

export async function DELETE() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return new Response("Unauthorized", { status: 401 });

  const supabase = createServerClient();
  const tables = ["tasks", "notes", "goals", "braindumps", "client_sessions", "client_tasks", "clients"];
  for (const table of tables) {
    await supabase.from(table).delete().eq("user_email", email);
  }

  return new Response("OK");
}
