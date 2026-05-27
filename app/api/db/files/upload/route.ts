export const maxDuration = 30;

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

  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    return Response.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const file = form.get("file") as File | null;
  const clientId = form.get("clientId") as string | null;
  const taskId = form.get("taskId") as string | null;

  if (!file || !clientId) return Response.json({ error: "file and clientId required" }, { status: 400 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._\-]/g, "_");
  const path = `${email}/${clientId}${taskId ? `/${taskId}` : ""}/${Date.now()}-${safeName}`;

  // Convert to Buffer for reliable server-side upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const supabase = createServerClient();
  const { error: uploadError } = await supabase.storage
    .from("Client files")
    .upload(path, buffer, { contentType: file.type || "application/octet-stream", upsert: false });

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

  const id = crypto.randomUUID();
  const { error: dbError } = await supabase.from("client_files").insert({
    id,
    user_email: email,
    client_id: clientId,
    task_id: taskId ?? null,
    file_name: file.name,
    file_path: path,
    file_size: file.size,
    mime_type: file.type || null,
    created_at: new Date().toISOString(),
  });
  if (dbError) return Response.json({ error: dbError.message }, { status: 500 });

  const { data: urlData } = await supabase.storage.from("Client files").createSignedUrl(path, 3600);

  return Response.json({
    id,
    clientId,
    taskId: taskId ?? null,
    fileName: file.name,
    filePath: path,
    fileSize: file.size,
    mimeType: file.type || null,
    createdAt: new Date().toISOString(),
    signedUrl: urlData?.signedUrl ?? null,
  });
}
