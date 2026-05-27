import { getToken } from "next-auth/jwt";
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
const secureCookie = process.env.NODE_ENV === "production";

async function getEmail(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret, secureCookie });
  return (token?.email as string) ?? null;
}

export async function POST(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, taskId, fileName } = await req.json();
  if (!clientId || !fileName) return Response.json({ error: "clientId and fileName required" }, { status: 400 });

  const safeName = fileName.replace(/[^a-zA-Z0-9._\-]/g, "_");
  const path = `${email}/${clientId}${taskId ? `/${taskId}` : ""}/${Date.now()}-${safeName}`;

  const supabase = createServerClient();
  const { data, error } = await supabase.storage
    .from("Client files")
    .createSignedUploadUrl(path);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ signedUrl: data.signedUrl, path });
}
