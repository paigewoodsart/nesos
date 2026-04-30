import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function DELETE() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return new Response("Unauthorized", { status: 401 });

  const tables = ["tasks", "notes", "goals", "braindumps", "client_sessions", "client_tasks", "clients"];
  for (const table of tables) {
    await supabase.from(table).delete().eq("user_email", email);
  }

  return new Response("OK");
}
