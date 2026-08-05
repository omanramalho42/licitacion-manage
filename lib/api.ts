import axios from "axios";
import { isAxiosError } from "axios";

export interface ConformidadeError {
  error: string;
  limitReached?: boolean;
}

export const api = axios.create({
  baseURL: "/api",
  timeout: 30000, // um pouco acima do tempo máximo esperado da rota, mas não infinito
});

export interface Contratacao {
  orgaoEntidade?: {
    cnpj?: string;
    razaoSocial?: string;
    esferaId?: string;
    poderId?: string;
  };
  numeroControlePNCP?: string;
  anoCompra?: number;
  sequencialCompra?: number;
  numeroCompra?: string;
  objetoCompra?: string;
  modalidadeId?: number;
  modalidadeNome?: string;
  situacaoCompraId?: number;
  situacaoCompraNome?: string;
  valorTotalEstimado?: number;
  valorTotalHomologado?: number;
  dataPublicacaoPncp?: string;
  dataAberturaProposta?: string;
  dataEncerramentoProposta?: string;
  dataInclusao?: string;
  srp?: boolean;
  uf?: string;
  municipioNome?: string;
  unidadeOrgao?: {
    ufNome?: string;
    municipioNome?: string;
    codigoUnidade?: string;
    nomeUnidade?: string;
  };
  amparoLegal?: {
    nome?: string;
    descricao?: string;
  };
  tipoInstrumentoConvocatorioNome?: string;
}

export interface ContratacaoResponse {
  data?: Contratacao[];
  totalRegistros?: number;
  totalPaginas?: number;
  paginaAtual?: number;
  nroPagina?: number;
  tamanhoPagina?: number;
}

export interface Contrato {
  orgaoEntidade?: {
    cnpj?: string;
    razaoSocial?: string;
  };
  numeroContratoEmpenho?: string;
  anoContrato?: number;
  objetoContrato?: string;
  valorInicial?: number;
  valorGlobal?: number;
  dataVigenciaInicio?: string;
  dataVigenciaFim?: string;
  nomeRazaoSocialFornecedor?: string;
  tipoPessoaFornecedor?: string;
  niFornecedor?: string;
  numeroControlePNCP?: string;
}

export interface ContratoResponse {
  data?: Contrato[];
  totalRegistros?: number;
  totalPaginas?: number;
}

export interface Ata {
  orgaoEntidade?: {
    cnpj?: string;
    razaoSocial?: string;
  };
  numeroAtaRegistroPreco?: string;
  anoAta?: number;
  objetoAta?: string;
  valorTotal?: number;
  dataAssinatura?: string;
  dataVigenciaInicio?: string;
  dataVigenciaFim?: string;
  numeroControlePNCP?: string;
}

export interface ArquivoEdital {
  uri?: string;
  url?: string;
  sequencialDocumento?: number;
  titulo?: string;
  tipoDocumentoNome?: string;
  tipoDocumentoDescricao?: string;
  dataPublicacaoPncp?: string;
  statusAtivo?: boolean;
}

export interface SearchFilters {
  dataInicial?: string;
  dataFinal?: string;
  pagina?: number;
  tamanhoPagina?: number;
  codigoModalidadeContratacao?: string;
  uf?: string;
  cnpjOrgao?: string;
  fetchAll?: boolean;
  apenasAbertas?: boolean; // licitações com propostas em aberto (inclui futuras)
}
let currentController: AbortController | null = null;

import { createClient } from "@/lib/supabase/client";

export interface MeuContrato {
  id: string;
  title: string;
  document_type: string;
  content?: string;
  licitacao_numero?: string | null;
  orgao_destino?: string | null;
  status: string;
  created_at: string;
  metadata?: {
    contract_type?: string;
    contractor_cnpj?: string;
    contracted_name?: string;
    contracted_cnpj?: string;
    value?: string;
    duration?: string;
  } | null;
}

export async function searchMeusContratos(
  userId: string
): Promise<{ data: MeuContrato[] }> {
  const supabase = createClient();
  if (!supabase) return { data: [] };

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .eq("document_type", "contrato")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[v0] Error fetching meus contratos:", error);
    return { data: [] };
  }

  return { data: (data as MeuContrato[]) || [] };
}

export interface ArquivoContratacao {
  sequencialDocumento: number;
  titulo?: string;
  nomeArquivo?: string;
  tipoDocumentoId?: number;
  tipoDocumentoNome?: string;
  url?: string;
}


export async function listarArquivosContratacao(
  cnpj: string,
  ano: number | string,
  sequencial: number | string
): Promise<ArquivoContratacao[]> {
  try {
    const response = await api.get(`/pncp/arquivos/${cnpj}/${ano}/${sequencial}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("[v0] Error fetching arquivos:", error);
    return [];
  }
}

export interface RequisitoConformidade {
  descricao: string;
  categoria: "juridica" | "fiscal" | "tecnica" | "economico_financeira" | "outra";
  documentoNecessario: string; // qual documento comprova esse requisito
  atendido: boolean;
  documentoRelacionado?: string; // qual documento do usuário atende, se atendido
  observacao?: string;
}

export interface RelatorioConformidade {
  percentualConformidade: number;
  resumo: string;
  requisitos: RequisitoConformidade[];
  documentosFaltantes: string[]; // lista consolidada do que ainda falta providenciar
}

export async function verificarConformidade(params: {
  cnpj: string;
  ano: number | string;
  sequencial: number | string;
}): Promise<RelatorioConformidade | ConformidadeError> {
  try {
    const response = await api.post("/ai/verificar-conformidade", params, {
      timeout: 60_000,
    });
    return response.data;
  } catch (error) {
    console.error("[v0] Error checking conformidade:", error);

    if (isAxiosError(error) && error.response?.status === 429) {
      return {
        error:
          error.response.data?.error || "Limite mensal de análises atingido",
        limitReached: true,
      };
    }

    return { error: "Falha ao verificar conformidade" };
  }
}

export async function searchContratacoes(
  filters: SearchFilters
): Promise<ContratacaoResponse> {
  // cancela a busca anterior se ainda estiver em andamento
  currentController?.abort();
  currentController = new AbortController();

  try {
    const defaults = getDefaultDateRange();
    const params: Record<string, string | number> = {
      dataInicial: filters.dataInicial || defaults.dataInicial,
      dataFinal: filters.dataFinal || defaults.dataFinal,
      pagina: filters.pagina || 1,
      tamanhoPagina: filters.tamanhoPagina || 15,
    };

    if (filters.codigoModalidadeContratacao) {
      params.codigoModalidadeContratacao = filters.codigoModalidadeContratacao;
    }
    if (filters.uf) params.uf = filters.uf;
    if (filters.cnpjOrgao) params.cnpjOrgao = filters.cnpjOrgao;
    if (filters.fetchAll) params.fetchAll = "true";
    if (filters.apenasAbertas) params.apenasAbertas = "true";

    const response = await api.get("/pncp/contratacoes", {
      params,
      timeout: 25_000, // um pouco abaixo do maxDuration da function
      signal: currentController.signal,
    });
    return response.data || { data: [], totalRegistros: 0 };
  } catch (error) {
    if (axios.isCancel(error)) {
      // busca cancelada por uma nova busca — não é erro real, ignora
      return { data: [], totalRegistros: 0 };
    }
    console.error("[v0] Error fetching contratacoes:", error);
    return { data: [], totalRegistros: 0 };
  } finally {
    currentController = null;
  }
}

export function getDefaultDateRange(): { dataInicial: string; dataFinal: string } {
  const now = new Date();
  const endDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 30);
  const startStr = `${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, "0")}${String(startDate.getDate()).padStart(2, "0")}`;
  return { dataInicial: startStr, dataFinal: endDate };
}


export interface DocumentoContratacao {
  sequencialDocumento: number;
  url: string;
  tipoDocumentoId: number;
  tipoDocumentoNome: string;
  titulo: string;
  dataPublicacaoPncp: string;
}

export interface HistoricoContratacaoEvento {
  compraOrgaoCnpj: string;
  compraAno: number;
  compraSequencial: number;
  logManutencaoDataInclusao: string;
  tipoLogManutencao: number;
  tipoLogManutencaoNome: string; // "Inclusão" | "Retificação" | "Exclusão"
  categoriaLogManutencao: number;
  categoriaLogManutencaoNome: string;
  itemNumero?: number;
  itemResultadoNumero?: number;
  documentoSequencial?: number;
  documentoTipo?: string;
  documentoTitulo?: string;
  usuarioNome: string;
  justificativa?: string;
}

export async function getDocumentosContratacao(
  cnpj: string,
  ano: number,
  sequencial: number
): Promise<DocumentoContratacao[]> {
  try {
    const response = await api.get(
      `/pncp/contratacao/${cnpj}/${ano}/${sequencial}/arquivos`
    );
    return response.data ?? [];
  } catch (error) {
    console.error("[v0] Error fetching contratacao documentos:", error);
    return [];
  }
}

export async function getHistoricoContratacao(
  cnpj: string,
  ano: number,
  sequencial: number,
  pagina = 1,
  tamanhoPagina = 50
): Promise<HistoricoContratacaoEvento[]> {
  try {
    const response = await api.get(
      `/pncp/contratacao/${cnpj}/${ano}/${sequencial}/historico`,
      { params: { pagina, tamanhoPagina } }
    );
    return response.data ?? [];
  } catch (error) {
    console.error("[v0] Error fetching contratacao historico:", error);
    return [];
  }
}

export async function getContratacaoById(
  cnpj: string,
  ano: number,
  sequencial: number
): Promise<Contratacao | null> {
  try {
    const response = await api.get(`/pncp/contratacao/${cnpj}/${ano}/${sequencial}`);
    return response.data;
  } catch (error) {
    console.error("[v0] Error fetching contratacao detail:", error);
    return null;
  }
}

export async function getItensContratacao(
  cnpj: string,
  ano: number,
  sequencial: number
): Promise<unknown[]> {
  try {
    const response = await api.get(`/pncp/contratacao/${cnpj}/${ano}/${sequencial}/itens`);
    return response.data || [];
  } catch (error) {
    console.error("[v0] Error fetching itens:", error);
    return [];
  }
}

export async function getArquivosEdital(
  cnpj: string,
  ano: number,
  sequencial: number
): Promise<ArquivoEdital[]> {
  try {
    const response = await api.get(
      `/pncp/contratacao/${cnpj}/${ano}/${sequencial}/arquivos`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("[v0] Error fetching arquivos:", error);
    return [];
  }
}

// Monta a URL do proxy que faz o download/preview de um documento especifico
export function getArquivoDownloadUrl(
  cnpj: string,
  ano: number,
  sequencial: number,
  sequencialDocumento: number
): string {
  return `/api/pncp/contratacao/${cnpj}/${ano}/${sequencial}/arquivos/${sequencialDocumento}`;
}

export async function searchContratos(
  filters: SearchFilters
): Promise<ContratoResponse> {
  try {
    const defaults = getDefaultDateRange();
    const params: Record<string, string | number> = {
      dataInicial: filters.dataInicial || defaults.dataInicial,
      dataFinal: filters.dataFinal || defaults.dataFinal,
      pagina: filters.pagina || 1,
      tamanhoPagina: filters.tamanhoPagina || 15,
    };

    const response = await api.get("/contratos", { params });
    return response.data || { data: [], totalRegistros: 0 };
  } catch (error) {
    console.error("[v0] Error fetching contratos:", error);
    return { data: [], totalRegistros: 0 };
  }
}

export async function searchAtas(
  filters: SearchFilters
): Promise<{ data?: Ata[]; totalRegistros?: number }> {
  try {
    const defaults = getDefaultDateRange();
    const params: Record<string, string | number> = {
      dataInicial: filters.dataInicial || defaults.dataInicial,
      dataFinal: filters.dataFinal || defaults.dataFinal,
      pagina: filters.pagina || 1,
      tamanhoPagina: filters.tamanhoPagina || 15,
    };

    const response = await api.get("/atas", { params });
    return response.data || { data: [], totalRegistros: 0 };
  } catch (error) {
    console.error("[v0] Error fetching atas:", error);
    return { data: [], totalRegistros: 0 };
  }
}

export const MODALIDADES = [
  { value: "", label: "Todas" },
  { value: "1", label: "Leilao - Eletronico" },
  { value: "2", label: "Dialogo Competitivo" },
  { value: "3", label: "Concurso" },
  { value: "4", label: "Concorrencia - Eletronica" },
  { value: "5", label: "Concorrencia - Presencial" },
  { value: "6", label: "Pregao - Eletronico" },
  { value: "7", label: "Pregao - Presencial" },
  { value: "8", label: "Dispensa de Licitacao" },
  { value: "9", label: "Inexigibilidade" },
  { value: "10", label: "Manifestacao de Interesse" },
  { value: "11", label: "Pre-qualificacao" },
  { value: "12", label: "Credenciamento" },
  { value: "13", label: "Leilao - Presencial" },
];

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];
