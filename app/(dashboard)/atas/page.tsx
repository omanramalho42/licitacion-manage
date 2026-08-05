"use client";

import { useMemo } from "react"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contratoSearchSchema, type ContratoSearchValues } from "@/lib/schemas";
import { searchAtas, type Ata } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

function formatCurrency(val: number | undefined) {
  if (!val) return "N/A";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

export default function AtasPage() {
  const [atas, setAtas] = useState<Ata[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  const defaultDates = useMemo(() => {
    const now = new Date();
    const end = now.toISOString().split("T")[0];
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { start: start.toISOString().split("T")[0], end };
  }, []);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ContratoSearchValues>({
    resolver: zodResolver(contratoSearchSchema),
    defaultValues: {
      dataInicial: defaultDates.start,
      dataFinal: defaultDates.end,
      pagina: 1,
      tamanhoPagina: 15,
    },
  });

  async function onSubmit(values: ContratoSearchValues) {
    setLoading(true);
    setPagina(1);
    setHasSearched(true);
    const res = await searchAtas({
      dataInicial: values.dataInicial.replace(/-/g, ""),
      dataFinal: values.dataFinal.replace(/-/g, ""),
      pagina: 1,
      tamanhoPagina: 15,
    });
    setAtas(res.data || []);
    setTotalRegistros(res.totalRegistros || 0);
    setLoading(false);
  }

  async function handlePageChange(newPage: number) {
    setLoading(true);
    setPagina(newPage);
    const values = getValues();
    const res = await searchAtas({
      dataInicial: values.dataInicial.replace(/-/g, ""),
      dataFinal: values.dataFinal.replace(/-/g, ""),
      pagina: newPage,
      tamanhoPagina: 15,
    });
    setAtas(res.data || []);
    setTotalRegistros(res.totalRegistros || 0);
    setLoading(false);
  }

  const totalPaginas = Math.ceil(totalRegistros / 15);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground">
          Atas de Registro de Precos
        </h1>
        <p className="text-sm text-muted-foreground">
          Consulte atas de registro de precos publicadas no PNCP
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Filtros de Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-wrap items-end gap-4"
            >
              <div className="space-y-2">
                <Label className="text-sm text-foreground">
                  Data Inicial
                </Label>
                <Input
                  type="date"
                  {...register("dataInicial")}
                  className="bg-secondary text-foreground"
                />
                {errors.dataInicial && (
                  <p className="text-xs text-destructive">
                    {errors.dataInicial.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-foreground">
                  Data Final
                </Label>
                <Input
                  type="date"
                  {...register("dataFinal")}
                  className="bg-secondary text-foreground"
                />
                {errors.dataFinal && (
                  <p className="text-xs text-destructive">
                    {errors.dataFinal.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                {loading ? "Pesquisando..." : "Pesquisar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Pesquisando atas...
            </p>
          </div>
        </div>
      )}

      {!loading && hasSearched && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              <div className="border-b border-border px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  {totalRegistros.toLocaleString("pt-BR")} atas encontradas
                </p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                        Orgao
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                        Numero
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                        Objeto
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase text-muted-foreground">
                        Valor Total
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                        Assinatura
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                        Vigencia
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atas.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-12 text-center text-muted-foreground"
                        >
                          Nenhuma ata encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      atas.map((a, i) => (
                        <motion.tr
                          key={`${a.numeroControlePNCP || i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.2,
                            delay: i * 0.03,
                          }}
                          className="border-b border-border transition-colors hover:bg-secondary/50"
                        >
                          <TableCell className="max-w-[180px] truncate text-sm text-foreground">
                            {a.orgaoEntidade?.razaoSocial || "N/A"}
                          </TableCell>
                          <TableCell className="text-sm text-foreground">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {a.numeroAtaRegistroPreco || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-foreground">
                            {a.objetoAta || "N/A"}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-foreground">
                            {formatCurrency(a.valorTotal)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(a.dataAssinatura)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(a.dataVigenciaInicio)} -{" "}
                            {formatDate(a.dataVigenciaFim)}
                          </TableCell>
                        </motion.tr>
                      ))
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
                    onClick={() => handlePageChange(pagina - 1)}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Pagina {pagina} de {totalPaginas}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagina >= totalPaginas}
                    onClick={() => handlePageChange(pagina + 1)}
                  >
                    Proximo
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!loading && !hasSearched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <ScrollText className="h-7 w-7 text-accent-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">
            Pesquise Atas de Registro de Precos
          </h3>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Selecione um periodo e pesquise atas de registro de precos
            publicadas no PNCP.
          </p>
        </motion.div>
      )}
    </div>
  );
}
