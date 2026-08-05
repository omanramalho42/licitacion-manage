import { type NextRequest, NextResponse } from "next/server";

// A API de arquivos/documentos fica na API principal do PNCP (nao na de consulta)
const PNCP_BASE = "https://pncp.gov.br/api/pncp";

export async function GET(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ cnpj: string; ano: string; sequencial: string }> }
) {
  const { cnpj, ano, sequencial } = await params;

  try {
    const url = `${PNCP_BASE}/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/arquivos`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error("[v0] PNCP arquivos error:", response.status);
      return NextResponse.json([], { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Arquivos proxy error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
