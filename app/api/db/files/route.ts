import { getToken } from "next-auth/jwt";
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
const secureCookie = process.env.NODE_ENV === "production";

async function getEmail(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret, secureCookie });
  return (token?.email as string) ?? null;
}

export async function GET(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) return Response.json({ error: "clientId required" }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("client_files")
    .select("*")
    .eq("user_email", email)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Attach short-lived signed URLs for reading
  const files = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: urlData } = await supabase.storage
        .from("client-files")
        .createSignedUrl(row.file_path, 3600);
      return {
        id: row.id,
        clientId: row.client_id,
        taskId: row.task_id ?? null,
        fileName: row.file_name,
        filePath: row.file_path,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        createdAt: row.created_at,
        signedUrl: urlData?.signedUrl ?? null,
      };
    })
  );

  return Response.json(files);
}

export async function POST(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServerClient();
  const f = await req.json();
  const { error } = await supabase.from("client_files").upsert({
    id: f.id,
    user_email: email,
    client_id: f.clientId,
    task_id: f.taskId ?? null,
    file_name: f.fileName,
    file_path: f.filePath,
    file_size: f.fileSize ?? null,
    mime_type: f.mimeType ?? null,
    created_at: f.createdAt,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const supabase = createServerClient();

  // Fetch the record first to get file_path
  const { data: row, error: fetchErr } = await supabase
    .from("client_files")
    .select("file_path")
    .eq("id", id)
    .eq("user_email", email)
    .single();
  if (fetchErr || !row) return Response.json({ error: "Not found" }, { status: 404 });

  // Delete from storage
  await supabase.storage.from("client-files").remove([row.file_path]);

  // Delete metadata
  const { error } = await supabase
    .from("client_files")
    .delete()
    .eq("id", id)
    .eq("user_email", email);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
