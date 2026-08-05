import { NextRequest, NextResponse } from "next/server";

const PNCP_BASE = "https://pncp.gov.br/api/consulta";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const dataInicial = searchParams.get("dataInicial") || "20260101";
  const dataFinal = searchParams.get("dataFinal") || "20260131";
  const pagina = searchParams.get("pagina") || "1";
  const tamanhoPagina = searchParams.get("tamanhoPagina") || "15";

  const params = new URLSearchParams({
    dataInicial,
    dataFinal,
    pagina,
    tamanhoPagina,
  });

  try {
    const url = `${PNCP_BASE}/v1/atas/publicacao?${params.toString()}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[v0] PNCP atas error:", response.status, errorText);
      return NextResponse.json({ data: [], totalRegistros: 0 }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Atas proxy error:", error);
    return NextResponse.json({ data: [], totalRegistros: 0 }, { status: 200 });
  }
}
