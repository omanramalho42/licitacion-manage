import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// @ts-expect-error - pdf-parse não tem types oficiais completos
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { filePath } = await request.json();
  if (!filePath) {
    return NextResponse.json({ error: "filePath obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("documents").download(filePath);
  if (error || !data) {
    return NextResponse.json({ text: null });
  }

  try {
    const buffer = Buffer.from(await data.arrayBuffer());
    const parsed = await pdfParse(buffer);
    return NextResponse.json({ text: parsed.text.slice(0, 20_000) });
  } catch {
    return NextResponse.json({ text: null });
  }
}