import { NextRequest, NextResponse } from "next/server";
import { fetchPncp } from "@/lib/pncp-fetch";

const PNCP_BASE = "https://pncp.gov.br/api/consulta";
const TOP_MODALIDADES = ["6", "8"]; // Pregão Eletrônico e Dispensa — mais comuns

function formatYyyymmdd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function defaultDataInicial() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return formatYyyymmdd(d);
}

function defaultDataFinal() {
  return formatYyyymmdd(new Date());
}

function defaultDataFinalAbertas() {
  const d = new Date();
  d.setDate(d.getDate() + 180);
  return formatYyyymmdd(d);
}

// A PNCP nem sempre exclui de forma confiável contratações cujo prazo de
// propostas já encerrou. Filtramos e ordenamos no nosso lado como garantia.
function filtrarSomenteAbertas(contratacoes: any[]) {
  const agora = new Date();

  return contratacoes
    .filter((c) => {
      const encerramento = c?.dataEncerramentoProposta;
      if (!encerramento) return true; // sem data informada, mantém por segurança
      const dataEncerramento = new Date(encerramento);
      if (Number.isNaN(dataEncerramento.getTime())) return true;
      return dataEncerramento >= agora;
    })
    .sort((a, b) => {
      const da = a?.dataEncerramentoProposta
        ? new Date(a.dataEncerramentoProposta).getTime()
        : Infinity;
      const db = b?.dataEncerramentoProposta
        ? new Date(b.dataEncerramentoProposta).getTime()
        : Infinity;
      return da - db;
    });
}

async function fetchPublicacao(baseParams: URLSearchParams, modalidade: string) {
  const params = new URLSearchParams(baseParams);
  params.set("codigoModalidadeContratacao", modalidade);
  const url = `${PNCP_BASE}/v1/contratacoes/publicacao?${params.toString()}`;
  try {
    const response = await fetchPncp(url);
    if (!response.ok) return { data: [], totalRegistros: 0 };
    const json = await response.json();
    return { data: json.data || [], totalRegistros: json.totalRegistros || 0 };
  } catch {
    return { data: [], totalRegistros: 0 };
  }
}

async function fetchProposta(baseParams: URLSearchParams, modalidade: string) {
  const params = new URLSearchParams(baseParams);
  params.set("codigoModalidadeContratacao", modalidade);
  const url = `${PNCP_BASE}/v1/contratacoes/proposta?${params.toString()}`;
  try {
    const response = await fetchPncp(url);
    if (!response.ok) return { data: [], totalRegistros: 0 };
    const json = await response.json();
    return { data: json.data || [], totalRegistros: json.totalRegistros || 0 };
  } catch {
    return { data: [], totalRegistros: 0 };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const dataInicial = searchParams.get("dataInicial") || defaultDataInicial();
  const dataFinal = searchParams.get("dataFinal") || defaultDataFinal();
  const pagina = searchParams.get("pagina") || "1";
  const tamanhoPagina = searchParams.get("tamanhoPagina") || "15";
  const codigoModalidadeContratacao = searchParams.get("codigoModalidadeContratacao");
  const uf = searchParams.get("uf");
  const cnpjOrgao = searchParams.get("cnpjOrgao");
  const fetchAll = searchParams.get("fetchAll");
  const apenasAbertas = searchParams.get("apenasAbertas") === "true";

  try {
    if (apenasAbertas) {
      const propostaDataFinal = defaultDataFinalAbertas();
      const propostaParams = new URLSearchParams({
        dataFinal: propostaDataFinal,
        pagina,
        tamanhoPagina,
      });
      if (uf) propostaParams.set("uf", uf);
      if (cnpjOrgao) propostaParams.set("cnpj", cnpjOrgao);

      const modalidades = codigoModalidadeContratacao
        ? [codigoModalidadeContratacao]
        : TOP_MODALIDADES;

      const settled = await Promise.allSettled(
        modalidades.map((m) => fetchProposta(propostaParams, m))
      );
      const results = settled.map((r) =>
        r.status === "fulfilled" ? r.value : { data: [], totalRegistros: 0 }
      );

      const allDataBruta = results.flatMap((r) => r.data);
      const allData = filtrarSomenteAbertas(allDataBruta);

      return NextResponse.json({
        data: allData,
        totalRegistros: allData.length,
        totalPaginas: 1,
        nroPagina: 1,
      });
    }

    const baseParams = new URLSearchParams({ dataInicial, dataFinal, pagina, tamanhoPagina });
    if (uf) baseParams.set("uf", uf);
    if (cnpjOrgao) baseParams.set("cnpjOrgao", cnpjOrgao);

    if (codigoModalidadeContratacao) {
      baseParams.set("codigoModalidadeContratacao", codigoModalidadeContratacao);
      const url = `${PNCP_BASE}/v1/contratacoes/publicacao?${baseParams.toString()}`;
      const response = await fetchPncp(url);
      if (!response.ok) {
        return NextResponse.json(
          { data: [], totalRegistros: 0, error: `API returned ${response.status}` },
          { status: 200 }
        );
      }
      const data = await response.json();
      return NextResponse.json(data);
    }

    if (fetchAll === "true") {
      const settled = await Promise.allSettled(
        TOP_MODALIDADES.map((m) => fetchPublicacao(baseParams, m))
      );
      const results = settled.map((r) =>
        r.status === "fulfilled" ? r.value : { data: [], totalRegistros: 0 }
      );
      const allData = results.flatMap((r) => r.data);
      const totalRegistros = results.reduce((sum, r) => sum + r.totalRegistros, 0);
      return NextResponse.json({ data: allData, totalRegistros, totalPaginas: 1, nroPagina: 1 });
    }

    baseParams.set("codigoModalidadeContratacao", "6");
    const url = `${PNCP_BASE}/v1/contratacoes/publicacao?${baseParams.toString()}`;
    const response = await fetchPncp(url);
    if (!response.ok) {
      return NextResponse.json(
        { data: [], totalRegistros: 0, error: `API returned ${response.status}` },
        { status: 200 }
      );
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Proxy error:", error);
    return NextResponse.json(
      { data: [], totalRegistros: 0, error: "Failed to fetch from PNCP" },
      { status: 200 }
    );
  }
}

export const maxDuration = 30;