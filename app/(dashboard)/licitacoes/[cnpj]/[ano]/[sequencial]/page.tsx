"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Building2, Calendar, MapPin, FileText,
  DollarSign, ExternalLink, FileDown, History,
} from "lucide-react";
import {
  getContratacaoById, getDocumentosContratacao, getHistoricoContratacao,
  type Contratacao, type DocumentoContratacao, type HistoricoContratacaoEvento,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { motion } from "framer-motion";

function formatCurrency(val: number | undefined) {
  if (!val) return "N/A";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function DetalheLicitacaoPage() {
  const params = useParams();
  const [contratacao, setContratacao] = useState<Contratacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentos, setDocumentos] = useState<DocumentoContratacao[]>([]);
  const [historico, setHistorico] = useState<HistoricoContratacaoEvento[]>([]);

  useEffect(() => {
    async function load() {
      if (!params.cnpj || !params.ano || !params.sequencial) return;
      setLoading(true);
      const cnpj = params.cnpj as string;
      const ano = Number(params.ano);
      const sequencial = Number(params.sequencial);

      const [contratacaoData, documentosData, historicoData] = await Promise.all([
        getContratacaoById(cnpj, ano, sequencial),
        getDocumentosContratacao(cnpj, ano, sequencial),
        getHistoricoContratacao(cnpj, ano, sequencial),
      ]);

      setContratacao(contratacaoData);
      setDocumentos(documentosData);
      setHistorico(historicoData);
      setLoading(false);
    }
    load();
  }, [params.cnpj, params.ano, params.sequencial]);

  const portalPncpUrl = `https://pncp.gov.br/app/editais/${params.cnpj}/${params.ano}/${params.sequencial}`;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!contratacao) {
    return (
      <div className="space-y-6">
        <Link href="/licitacoes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-semibold text-foreground">
            Licitacao nao encontrada
          </p>
          <p className="text-sm text-muted-foreground">
            Verifique os parametros e tente novamente.
          </p>
        </div>
      </div>
    );
  }

  console.log(contratacao, "contratação")

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <Link href="/licitacoes">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar para licitacoes</span>
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {contratacao.numeroCompra || "Licitacao"}
              </h1>
              <Badge variant="default">
                {contratacao.situacaoCompraNome || "N/A"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              PNCP: {contratacao.numeroControlePNCP || "N/A"}
            </p>
          </div>
        </div>

        <a href={portalPncpUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver no Portal PNCP
          </Button>
        </a>
      </motion.div>

      {/* Bloco principal: detalhes + sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <FileText className="h-4 w-4" />
                Informacoes da Contratacao
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Objeto
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">
                  {contratacao.objetoCompra || "N/A"}
                </p>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Modalidade
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {contratacao.modalidadeNome || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Tipo de Instrumento
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {contratacao.tipoInstrumentoConvocatorioNome || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Amparo Legal
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {contratacao.amparoLegal?.nome || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    SRP
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {contratacao.srp ? "Sim" : "Nao"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <DollarSign className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Valor Total Estimado
                    </p>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {formatCurrency(contratacao.valorTotalEstimado)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Valor Total Homologado
                    </p>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {formatCurrency(contratacao.valorTotalHomologado)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar: 2 colunas em telas médias, 1 coluna dentro do lg:col 1/3 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border bg-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Building2 className="h-4 w-4" />
                  Orgao
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Razao Social
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {contratacao.orgaoEntidade?.razaoSocial || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    CNPJ
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {contratacao.orgaoEntidade?.cnpj || "N/A"}
                  </p>
                </div>
                {contratacao.unidadeOrgao && (
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Unidade
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {contratacao.unidadeOrgao.nomeUnidade || "N/A"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border bg-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Calendar className="h-4 w-4" />
                  Datas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Publicacao PNCP
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {formatDate(contratacao.dataPublicacaoPncp)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Abertura de Propostas
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {formatDate(contratacao.dataAberturaProposta)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Encerramento de Propostas
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {formatDate(contratacao.dataEncerramentoProposta)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <Card className="border-border bg-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <MapPin className="h-4 w-4" />
                  Localizacao
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Municipio
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {contratacao.unidadeOrgao?.municipioNome ||
                      contratacao.municipioNome ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    UF
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {contratacao.unidadeOrgao?.ufNome || contratacao.uf || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Documentos + Histórico lado a lado */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="border-border bg-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <FileDown className="h-4 w-4" />
                Documentos ({documentos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum documento disponível.</p>
              ) : (
                <ul className="space-y-2">
                  {documentos.map((doc) => (
                    <li
                      key={doc.sequencialDocumento}
                      className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {doc.titulo || `Documento ${doc.sequencialDocumento}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.tipoDocumentoNome} • {formatDate(doc.dataPublicacaoPncp)}
                        </p>
                      </div>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <FileDown className="mr-2 h-4 w-4" />
                          Baixar
                        </Button>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-border bg-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <History className="h-4 w-4" />
                Histórico ({historico.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
              ) : (
                <ul className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {historico
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.logManutencaoDataInclusao).getTime() -
                        new Date(a.logManutencaoDataInclusao).getTime()
                    )
                    .map((evento, idx) => (
                      <li key={idx} className="rounded-md border border-border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant={
                              evento.tipoLogManutencaoNome === "Retificação"
                                ? "default"
                                : evento.tipoLogManutencaoNome === "Exclusão"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {evento.tipoLogManutencaoNome}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(evento.logManutencaoDataInclusao)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-foreground">
                          {evento.categoriaLogManutencaoNome}
                          {evento.documentoTitulo ? ` — ${evento.documentoTitulo}` : ""}
                        </p>
                        {evento.justificativa && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {evento.justificativa}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          por {evento.usuarioNome}
                        </p>
                      </li>
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}