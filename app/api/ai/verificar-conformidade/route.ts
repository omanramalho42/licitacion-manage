import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server"; // ajuste para o seu client server-side
// @ts-expect-error - pdf-parse não tem types oficiais completos
import pdfParse from "pdf-parse";

export const runtime = "nodejs";
export const maxDuration = 60;

const PNCP_BASE = "https://pncp.gov.br/api/pncp";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const HABILITACAO_TYPES = [
  "certidao_negativa_federal",
  "certidao_negativa_estadual",
  "certidao_negativa_municipal",
  "certidao_fgts",
  "certidao_trabalhista",
  "contrato_social",
  "atestado",
  "balanco_patrimonial",
  "outro",
];

async function baixarTextoEdital(
  cnpj: string,
  ano: string,
  sequencial: string
): Promise<string | null> {
  const listUrl = `${PNCP_BASE}/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/arquivos`;
  const listResponse = await fetch(listUrl, { headers: { Accept: "application/json" } });
  if (!listResponse.ok) return null;
  const arquivos = await listResponse.json();
  if (!Array.isArray(arquivos) || arquivos.length === 0) return null;

  // prioriza Edital (tipoDocumentoId=2) ou Aviso de Contratação Direta (1)
  const edital =
    arquivos.find((a: any) => a.tipoDocumentoId === 2) ||
    arquivos.find((a: any) => a.tipoDocumentoId === 1) ||
    arquivos[0];

  const fileUrl = `${PNCP_BASE}/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/arquivos/${edital.sequencialDocumento}`;
  const fileResponse = await fetch(fileUrl);
  if (!fileResponse.ok) return null;

  const contentType = fileResponse.headers.get("content-type") || "";
  const buffer = Buffer.from(await fileResponse.arrayBuffer());

  if (contentType.includes("pdf")) {
    const parsed = await pdfParse(buffer);
    return parsed.text.slice(0, 60_000);
  }

  return null; // .docx, .zip etc — não processamos por ora
}

export async function POST(request: NextRequest) {
  const { cnpj, ano, sequencial } = await request.json();

  if (!cnpj || !ano || !sequencial) {
    return NextResponse.json({ error: "Parâmetros incompletos" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: meusDocumentos } = await supabase
    .from("documents")
    .select("title, document_type, extracted_text, expiry_date")
    .eq("user_id", user.id)
    .in("document_type", HABILITACAO_TYPES)
    .not("file_path", "is", null);

  if (!meusDocumentos || meusDocumentos.length === 0) {
    return NextResponse.json({
      error: "Você ainda não enviou documentos de habilitação em 'Meus Documentos'.",
    });
  }

  const textoEdital = await baixarTextoEdital(cnpj, String(ano), String(sequencial));

  if (!textoEdital) {
    return NextResponse.json({
      error: "Não foi possível localizar ou ler o edital em PDF desta contratação.",
    });
  }

  const perfilDocumentos = meusDocumentos
    .map(
      (d) =>
        `- ${d.title} (tipo: ${d.document_type}${
          d.expiry_date ? `, validade: ${d.expiry_date}` : ""
        })${d.extracted_text ? `\n  resumo: ${d.extracted_text.slice(0, 500)}` : ""}`
    )
    .join("\n");

  const dataAtual = new Date().toISOString().split("T")[0];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Você é um especialista em licitações públicas brasileiras (Lei 14.133/2021). " +
          "Extraia do edital os requisitos de habilitação (jurídica, fiscal, técnica, " +
          "econômico-financeira) e verifique, com base na documentação do usuário, quais " +
          "estão atendidos. Responda em JSON no formato: " +
          '{"percentualConformidade": number, "resumo": string, "requisitos": ' +
          '[{"descricao": string, "categoria": "juridica"|"fiscal"|"tecnica"|"economico_financeira"|"outra", ' +
          '"atendido": boolean, "documentoRelacionado": string, "observacao": string}]}. ' +
          `Considere a data de hoje (${dataAtual}) para avaliar validade de certidões.`,
      },
      {
        role: "user",
        content:
          `EDITAL (trecho relevante, pode estar truncado):\n${textoEdital}\n\n` +
          `DOCUMENTOS DO USUÁRIO CADASTRADOS:\n${perfilDocumentos}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return NextResponse.json({ error: "IA não retornou resposta" }, { status: 500 });
  }

  try {
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Falha ao interpretar resposta da IA" }, { status: 500 });
  }
}