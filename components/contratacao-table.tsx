"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  Star,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Contratacao, RelatorioConformidade } from "@/lib/api";
import { verificarConformidade } from "@/lib/api";
import { useFavoritos } from "@/lib/use-favoritos";

interface ContratacaoTableProps {
  contratacoes: Contratacao[];
  totalRegistros: number;
  pagina: number;
  tamanhoPagina: number;
  onPageChange: (page: number) => void;
}

function formatCurrency(val: number | undefined) {
  if (!val) return "N/A";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDateTime(dateStr: string | undefined) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

const categoriaLabels: Record<string, string> = {
  juridica: "Habilitação Jurídica",
  fiscal: "Regularidade Fiscal",
  tecnica: "Qualificação Técnica",
  economico_financeira: "Qualificação Econômico-Financeira",
  outra: "Outros",
};

export function ContratacaoTable({
  contratacoes,
  totalRegistros,
  pagina,
  tamanhoPagina,
  onPageChange,
}: ContratacaoTableProps) {
  const totalPaginas = Math.ceil(totalRegistros / tamanhoPagina);
  const { isFavorito, toggleFavorito, isAuthenticated } = useFavoritos();

  const [conformidadeOpen, setConformidadeOpen] = useState(false);
  const [conformidadeLoading, setConformidadeLoading] = useState(false);
  const [conformidadeEdital, setConformidadeEdital] = useState<string | null>(null);
  const [conformidadeReport, setConformidadeReport] = useState<RelatorioConformidade | null>(null);
  const [conformidadeError, setConformidadeError] = useState<string | null>(null);

  async function handleVerificarConformidade(c: Contratacao) {
    const cnpj = c.orgaoEntidade?.cnpj;
    if (!cnpj || !c.anoCompra || !c.sequencialCompra) return;

    setConformidadeLoading(true);
    setConformidadeReport(null);
    setConformidadeError(null);
    setConformidadeEdital(c.numeroCompra || c.numeroControlePNCP || null);

    const result = await verificarConformidade({
      cnpj,
      ano: c.anoCompra,
      sequencial: c.sequencialCompra,
    });

    if ("error" in result) {
      if (result.limitReached) {
        // não abre o dialog, só o toast
        setConformidadeLoading(false);
        toast.error("Seus créditos acabaram", {
          description:
            "Você atingiu o limite de 10 verificações de conformidade neste mês. O limite renova no início do próximo mês.",
          duration: 6000,
        });
        return;
      }

      setConformidadeOpen(true);
      setConformidadeError(result.error);
    } else {
      setConformidadeOpen(true);
      setConformidadeReport(result);
    }
    setConformidadeLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalRegistros.toLocaleString("pt-BR")} editais encontrados
              </p>
              <p className="text-sm text-muted-foreground">
                Pagina {pagina} de {totalPaginas || 1}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-10" />
                  <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                    Numero do Edital
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                    Objeto
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                    Local
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase text-muted-foreground">
                    Valor da Contratacao
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                    Data da Disputa
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase text-muted-foreground">
                    Acoes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratacoes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-muted-foreground"
                    >
                      Nenhum edital encontrado. Ajuste os filtros e tente
                      novamente.
                    </TableCell>
                  </TableRow>
                ) : (
                  contratacoes.map((c, i) => {
                    const favorito = isFavorito(c.numeroControlePNCP);
                    const local =
                      [
                        c.unidadeOrgao?.municipioNome || c.municipioNome,
                        c.unidadeOrgao?.ufNome || c.uf,
                      ]
                        .filter(Boolean)
                        .join(" - ") || "N/A";
                    return (
                      <motion.tr
                        key={`${c.numeroControlePNCP || i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        className="border-b border-border transition-colors hover:bg-secondary/50"
                      >
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={!isAuthenticated}
                                  onClick={() => toggleFavorito(c)}
                                  aria-label={
                                    favorito
                                      ? "Remover dos favoritos"
                                      : "Adicionar aos favoritos"
                                  }
                                >
                                  <Star
                                    className={cn(
                                      "h-4 w-4 transition-colors",
                                      favorito
                                        ? "fill-primary text-primary"
                                        : "text-muted-foreground"
                                    )}
                                  />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {!isAuthenticated
                                  ? "Entre para favoritar"
                                  : favorito
                                    ? "Remover dos favoritos"
                                    : "Favoritar edital"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground">
                          <div className="flex flex-col">
                            <span>{c.numeroCompra || "N/A"}</span>
                            <span className="text-xs font-normal text-muted-foreground">
                              {c.modalidadeNome || ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[280px] truncate text-sm text-foreground">
                          {c.objetoCompra || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {local}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-foreground">
                          {formatCurrency(c.valorTotalEstimado)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(c.dataAberturaProposta)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs"
                                    disabled={!isAuthenticated}
                                    onClick={() => handleVerificarConformidade(c)}
                                  >
                                    <ShieldCheck className="h-4 w-4" />
                                    Conformidade
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {!isAuthenticated
                                    ? "Entre para verificar conformidade"
                                    : "Comparar com meus documentos"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Link
                              href={`/licitacoes/${c.orgaoEntidade?.cnpj}/${c.anoCompra}/${c.sequencialCompra}`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                              >
                                <Eye className="h-4 w-4" />
                                Visualizar
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <Button
                variant="outline"
                size="sm"
                disabled={pagina <= 1}
                onClick={() => onPageChange(pagina - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, totalPaginas) },
                  (_, i) => {
                    const start = Math.max(
                      1,
                      Math.min(pagina - 2, totalPaginas - 4)
                    );
                    const p = start + i;
                    if (p > totalPaginas) return null;
                    return (
                      <Button
                        key={p}
                        variant={p === pagina ? "default" : "ghost"}
                        size="icon"
                        className="h-8 w-8 text-xs"
                        onClick={() => onPageChange(p)}
                      >
                        {p}
                      </Button>
                    );
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={pagina >= totalPaginas}
                onClick={() => onPageChange(pagina + 1)}
              >
                Proximo
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de conformidade */}
      <Dialog open={conformidadeOpen} onOpenChange={setConformidadeOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verificação de Conformidade</DialogTitle>
            <DialogDescription>
              {conformidadeEdital
                ? `Edital ${conformidadeEdital} comparado com seus documentos de habilitação`
                : "Comparando edital com seus documentos de habilitação"}
            </DialogDescription>
          </DialogHeader>

          {conformidadeLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Lendo o edital e comparando com seus documentos...
              </p>
            </div>
          )}

          {!conformidadeLoading && conformidadeError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {conformidadeError}
            </div>
          )}

          {!conformidadeLoading && conformidadeReport && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Conformidade estimada
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {conformidadeReport.percentualConformidade}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      conformidadeReport.percentualConformidade >= 80
                        ? "bg-success"
                        : conformidadeReport.percentualConformidade >= 50
                          ? "bg-warning"
                          : "bg-destructive"
                    )}
                    style={{ width: `${conformidadeReport.percentualConformidade}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {conformidadeReport.resumo}
                </p>
              </div>
              {conformidadeReport.documentosFaltantes.length > 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                  <p className="mb-2 text-sm font-medium text-foreground">
                    Documentos que você ainda precisa providenciar
                  </p>
                  <ul className="space-y-1">
                    {conformidadeReport.documentosFaltantes.map((doc, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-warning" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                  <Link href="/documentos">
                    <Button variant="outline" size="sm" className="mt-3">
                      Enviar documentos
                    </Button>
                  </Link>
                </div>
              )}
              <div className="space-y-2">
                {conformidadeReport.requisitos.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    {r.atendido ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {categoriaLabels[r.categoria] || r.categoria}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-foreground">{r.descricao}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Documento necessário: <span className="font-medium">{r.documentoNecessario}</span>
                      </p>
                      {r.observacao && (
                        <p className="mt-1 text-xs text-muted-foreground">{r.observacao}</p>
                      )}
                      {r.atendido && r.documentoRelacionado && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Atendido por: {r.documentoRelacionado}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}