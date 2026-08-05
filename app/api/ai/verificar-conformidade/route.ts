import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server"; // ajuste para o seu client server-side
import { PasswordException, InvalidPDFException } from "pdf-parse";

import { PDFParse } from "pdf-parse";
import { checkAndConsumeUsage } from "@/lib/usage";

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

  let listResponse: Response;
  try {
    listResponse = await fetch(listUrl, { headers: { Accept: "application/json" } });
  } catch (err) {
    console.error("[v0] Erro de rede ao listar arquivos:", listUrl, err);
    return null;
  }

  if (!listResponse.ok) {
    console.error("[v0] Lista de arquivos retornou status", listResponse.status, listUrl);
    return null;
  }

  const arquivos = await listResponse.json();
  if (!Array.isArray(arquivos) || arquivos.length === 0) {
    console.error("[v0] Nenhum arquivo encontrado para essa contratação:", listUrl);
    return null;
  }

  // ordena candidatos: Edital (2) primeiro, depois Aviso de Contratação Direta (1), depois o resto
  const prioritarios = arquivos.filter((a: any) => a.tipoDocumentoId === 2);
  const secundarios = arquivos.filter((a: any) => a.tipoDocumentoId === 1);
  const outros = arquivos.filter((a: any) => a.tipoDocumentoId !== 2 && a.tipoDocumentoId !== 1);
  const candidatos = [...prioritarios, ...secundarios, ...outros];

  for (const candidato of candidatos) {
    const fileUrl = `${PNCP_BASE}/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/arquivos/${candidato.sequencialDocumento}`;

    let fileResponse: Response;
    try {
      fileResponse = await fetch(fileUrl);
    } catch (err) {
      console.error("[v0] Erro de rede ao baixar arquivo:", fileUrl, err);
      continue;
    }

    if (!fileResponse.ok) {
      console.error("[v0] Download do arquivo retornou status", fileResponse.status, fileUrl);
      continue;
    }

    const buffer = Buffer.from(await fileResponse.arrayBuffer());
    const isPdf = buffer.subarray(0, 4).toString("ascii") === "%PDF";

    if (!isPdf) {
      console.error(
        "[v0] Arquivo não é PDF, pulando:",
        candidato.titulo || candidato.nomeArquivo || fileUrl
      );
      continue;
    }

    let parser: PDFParse | null = null;
    try {
      parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      if (result.text && result.text.trim().length > 0) {
        return result.text.slice(0, 60_000);
      }
      console.error(
        "[v0] PDF sem texto extraível (provavelmente escaneado/imagem):",
        candidato.titulo || fileUrl
      );
    } catch (err) {
      console.error("[v0!] Erro ao interpretar PDF:", fileUrl, err);
      if (err instanceof PasswordException) {
        console.error("[v0] PDF protegido por senha:", fileUrl);
      } else if (err instanceof InvalidPDFException) {
        console.error("[v0] PDF inválido/corrompido:", fileUrl);
      } else {
        console.error("[v0!] Erro ao interpretar PDF:", fileUrl, err);
      }
    } finally {
      // libera memória — importante, especialmente processando vários PDFs em sequência
      await parser?.destroy();
    }
  }

  console.error("[v0] Nenhum arquivo PDF com texto legível encontrado entre", candidatos.length, "candidatos");
  return null;
}

export async function POST(request: NextRequest) {
  const { cnpj, ano, sequencial } = await request.json();

  if (!cnpj || !ano || !sequencial) {
    return NextResponse.json({ error: "Parâmetros incompletos" }, { status: 400 });
  }

  const supabase = await createClient();
  if(!supabase) return
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const usage = await checkAndConsumeUsage(user.id);
  if (!usage.allowed) {
    return Response.json(
      {
        error: "Limite mensal de análises atingido (10/mês). Tente novamente no próximo mês.",
      },
      { status: 429 }
    );
  }

  const { data: meusDocumentos, error: docsError } = await supabase
    .from("documents")
    .select("title, document_type, extracted_text, expiry_date")
    .eq("user_id", user.id)
    .in("document_type", HABILITACAO_TYPES)
    .not("file_path", "is", null);

  if (docsError) {
    console.error("[v0] Erro ao buscar documentos:", docsError);
    return NextResponse.json({ error: `Erro ao buscar documentos: ${docsError.message}` }, { status: 500 });
  }

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
          "econômico-financeira) exigidos. Para CADA requisito, informe também qual " +
          "documento comprova o atendimento (ex: 'Certidão Negativa de Débitos Federais', " +
          "'Atestado de Capacidade Técnica', 'Balanço Patrimonial do último exercício'), " +
          "mesmo quando o usuário não possuir esse documento. Depois, verifique com base " +
          "na documentação do usuário quais requisitos já estão atendidos. Ao final, " +
          "consolide numa lista única e sem repetições os documentos que o usuário ainda " +
          "precisa providenciar (documentosFaltantes) — inclua só os que faltam ou estão " +
          "vencidos, na redação mais específica possível conforme o edital. " +
          "Responda em JSON no formato: " +
          '{"percentualConformidade": number, "resumo": string, "requisitos": ' +
          '[{"descricao": string, "categoria": "juridica"|"fiscal"|"tecnica"|"economico_financeira"|"outra", ' +
          '"documentoNecessario": string, "atendido": boolean, "documentoRelacionado": string, ' +
          '"observacao": string}], "documentosFaltantes": string[]}. ' +
          `Considere a data de hoje (${dataAtual}) para avaliar validade de certidões — ` +
          "uma certidão vencida conta como não atendido e o documento correspondente entra em documentosFaltantes.",
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