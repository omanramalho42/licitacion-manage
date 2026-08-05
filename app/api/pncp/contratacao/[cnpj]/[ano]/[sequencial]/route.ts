import { NextRequest, NextResponse } from "next/server";
import { fetchPncp } from "@/lib/pncp-fetch";

const PNCP_BASE = "https://pncp.gov.br/api/consulta";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cnpj: string; ano: string; sequencial: string }> }
) {
  const { cnpj, ano, sequencial } = await params;

  try {
    const url = `${PNCP_BASE}/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error("[v0] PNCP detail error:", response.status);
      return NextResponse.json(null, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Detail proxy error:", error);
    return NextResponse.json(null, { status: 200 });
  }
}
