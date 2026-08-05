"use client";

import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contratoSearchSchema, type ContratoSearchValues } from "@/lib/schemas";
import { searchContratos, searchMeusContratos, type Contrato, type MeuContrato } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

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

export default function ContratosPage() {
  const { user } = useAuth();

  // ---- Contratos públicos (PNCP) ----
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // ---- Meus contratos (pessoais) ----
  const [meusContratos, setMeusContratos] = useState<MeuContrato[]>([]);
  const [loadingMeus, setLoadingMeus] = useState(false);

  // ---- Filtros de tipo ----
  const [mostrarPublico, setMostrarPublico] = useState(true);
  const [mostrarPessoal, setMostrarPessoal] = useState(true);

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

  const carregarMeusContratos = async () => {
    if (!user) return;
    setLoadingMeus(true);
    const res = await searchMeusContratos(user.id);
    setMeusContratos(res.data);
    setLoadingMeus(false);
  };

  useEffect(() => {
    if (mostrarPessoal && user) {
      carregarMeusContratos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarPessoal, user]);

  async function onSubmit(values: ContratoSearchValues) {
    if (!mostrarPublico) return;
    setLoading(true);
    setPagina(1);
    setHasSearched(true);
    const res = await searchContratos({
      dataInicial: values.dataInicial.replace(/-/g, ""),
      dataFinal: values.dataFinal.replace(/-/g, ""),
      pagina: 1,
      tamanhoPagina: 15,
    });
    setContratos(res.data || []);
    setTotalRegistros(res.totalRegistros || 0);
    setLoading(false);
  }

  async function handlePageChange(newPage: number) {
    setLoading(true);
    setPagina(newPage);
    const values = getValues();
    const res = await searchContratos({
      dataInicial: values.dataInicial.replace(/-/g, ""),
      dataFinal: values.dataFinal.replace(/-/g, ""),
      pagina: newPage,
      tamanhoPagina: 15,
    });
    setContratos(res.data || []);
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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          <p className="text-sm text-muted-foreground">
            Consulte contratos públicos (PNCP) e seus contratos pessoais
          </p>
        </div>
        <Button asChild>
          <Link href="/documentos/criar-contrato">
            <Plus className="mr-2 h-4 w-4" />
            Criar Contrato
          </Link>
        </Button>
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
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="filtro-publico"
                  checked={mostrarPublico}
                  onCheckedChange={(v) => setMostrarPublico(!!v)}
                />
                <Label htmlFor="filtro-publico" className="text-sm font-normal">
                  Contratos Público (PNCP)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="filtro-pessoal"
                  checked={mostrarPessoal}
                  onCheckedChange={(v) => setMostrarPessoal(!!v)}
                />
                <Label htmlFor="filtro-pessoal" className="text-sm font-normal">
                  Contratos Pessoais
                </Label>
              </div>
            </div>

            {mostrarPublico && (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-wrap items-end gap-4"
              >
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Data Inicial</Label>
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
                  <Label className="text-sm text-foreground">Data Final</Label>
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
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- Seção: Meus Contratos ---- */}
      {mostrarPessoal && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Meus Contratos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingMeus ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                          Título
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                          Contratante
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                          Contratado
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                          Valor
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {meusContratos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                            Nenhum contrato pessoal criado ainda.
                          </TableCell>
                        </TableRow>
                      ) : (
                        meusContratos.map((c) => (
                          <TableRow key={c.id} className="border-border hover:bg-secondary/50">
                            <TableCell className="text-sm text-foreground">{c.title}</TableCell>
                            <TableCell className="text-sm text-foreground">
                              {c.orgao_destino || "N/A"}
                            </TableCell>
                            <TableCell className="text-sm text-foreground">
                              {c.metadata?.contracted_name || "N/A"}
                            </TableCell>
                            <TableCell className="text-sm text-foreground">
                              {c.metadata?.value || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {c.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/documentos/${c.id}`}>
                                  Ver / Editar
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ---- Seção: Contratos Públicos (PNCP) ---- */}
      {mostrarPublico && loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Pesquisando contratos...</p>
          </div>
        </div>
      )}

      {mostrarPublico && !loading && hasSearched && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Contratos Públicos (PNCP)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-b border-border px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  {totalRegistros.toLocaleString("pt-BR")} contratos encontrados
                </p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Órgão</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Número</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Objeto</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Fornecedor</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase text-muted-foreground">Valor Global</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Vigência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contratos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                          Nenhum contrato encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      contratos.map((c, i) => (
                        <motion.tr
                          key={`${c.numeroControlePNCP || i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                          className="border-b border-border transition-colors hover:bg-secondary/50"
                        >
                          <TableCell className="max-w-[180px] truncate text-sm text-foreground">
                            {c.orgaoEntidade?.razaoSocial || "N/A"}
                          </TableCell>
                          <TableCell className="text-sm text-foreground">
                            <Badge variant="outline" className="font-mono text-xs">
                              {c.numeroContratoEmpenho || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-foreground">
                            {c.objetoContrato || "N/A"}
                          </TableCell>
                          <TableCell className="max-w-[160px] truncate text-sm text-foreground">
                            {c.nomeRazaoSocialFornecedor || "N/A"}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-foreground">
                            {formatCurrency(c.valorGlobal)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(c.dataVigenciaInicio)} - {formatDate(c.dataVigenciaFim)}
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPaginas > 1 && (
                <div className="flex items-center justify-between border-t border-border px-6 py-4">
                  <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => handlePageChange(pagina - 1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {pagina} de {totalPaginas}
                  </span>
                  <Button variant="outline" size="sm" disabled={pagina >= totalPaginas} onClick={() => handlePageChange(pagina + 1)}>
                    Próximo
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {mostrarPublico && !loading && !hasSearched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <FileText className="h-7 w-7 text-accent-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">Pesquise Contratos</h3>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Selecione um período e pesquise contratos e empenhos publicados no PNCP.
          </p>
        </motion.div>
      )}
    </div>
  );
}