import { NextRequest, NextResponse } from "next/server";

const PNCP_BASE = "https://pncp.gov.br/api/pncp";

// Faz proxy do download de um documento especifico do PNCP.
// Isso evita problemas de CORS e permite exibir o PDF em um iframe/visualizador.
export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      cnpj: string;
      ano: string;
      sequencial: string;
      sequencialDocumento: string;
    }>;
  }
) {
  const { cnpj, ano, sequencial, sequencialDocumento } = await params;

  try {
    const url = `${PNCP_BASE}/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/arquivos/${sequencialDocumento}`;
    const response = await fetch(url, {
      headers: { Accept: "application/octet-stream" },
    });

    if (!response.ok) {
      console.error("[v0] PNCP download error:", response.status);
      return NextResponse.json(
        { error: "Arquivo nao encontrado" },
        { status: 404 }
      );
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const contentDisposition =
      response.headers.get("content-disposition") || "inline";

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("[v0] Download proxy error:", error);
    return NextResponse.json(
      { error: "Erro ao baixar arquivo" },
      { status: 500 }
    );
  }
}
