import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// @ts-expect-error - pdf-parse não tem types oficiais completos
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { filePath } = await request.json();
  if (!filePath) {
    return NextResponse.json({ error: "filePath obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("documents").download(filePath);

  if (error || !data) {
    console.error("[v0] Erro ao baixar arquivo do storage:", filePath, error);
    return NextResponse.json({ text: null, error: error?.message || "Arquivo não encontrado" });
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const isPdf = buffer.subarray(0, 4).toString("ascii") === "%PDF";

  if (!isPdf) {
    console.error("[v0] Arquivo enviado não é um PDF:", filePath);
    return NextResponse.json({ text: null, error: "Arquivo não é um PDF válido" });
  }

  try {
    const parsed = await pdfParse(buffer);
    if (!parsed.text || parsed.text.trim().length === 0) {
      console.error("[v0] PDF sem texto extraível (provavelmente escaneado):", filePath);
      return NextResponse.json({ text: null, error: "PDF sem texto extraível (pode ser escaneado)" });
    }
    return NextResponse.json({ text: parsed.text.slice(0, 20_000) });
  } catch (err) {
    console.error("[v0] Erro ao interpretar PDF:!", filePath, err);
    return NextResponse.json({ text: null, error: "Falha ao interpretar o PDF" });
  }
}