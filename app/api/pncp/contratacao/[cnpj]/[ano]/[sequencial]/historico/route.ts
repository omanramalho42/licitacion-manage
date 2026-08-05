import { NextRequest, NextResponse } from "next/server";
import { fetchPncp } from "@/lib/pncp-fetch";

const PNCP_BASE = "https://pncp.gov.br/api/pncp";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cnpj: string; ano: string; sequencial: string }> }
) {
  const { cnpj, ano, sequencial } = await params;
  const { searchParams } = new URL(request.url);
  const pagina = searchParams.get("pagina") ?? "1";
  const tamanhoPagina = searchParams.get("tamanhoPagina") ?? "50";

  try {
    const url = `${PNCP_BASE}/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/historico?pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`;
    const response = await fetchPncp(url);

    if (!response.ok) {
      console.error("[v0] PNCP historico error:", response.status);
      return NextResponse.json([], { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Historico proxy error:", error);
    return NextResponse.json([], { status: 200 });
  }
}