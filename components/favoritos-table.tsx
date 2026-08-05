"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Star, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useFavoritos, type FavoritoEdital } from "@/lib/use-favoritos";

interface FavoritosTableProps {
  favoritos: FavoritoEdital[];
  loading: boolean;
  isAuthenticated: boolean;
}

function formatCurrency(val: number | null) {
  if (!val) return "N/A";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleString("pt-BR", {
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

export function FavoritosTable({
  favoritos,
  loading,
  isAuthenticated,
}: FavoritosTableProps) {
  const { toggleFavorito } = useFavoritos();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
          <LogIn className="h-7 w-7 text-accent-foreground" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-foreground">
          Entre para ver seus favoritos
        </h3>
        <p className="mb-4 max-w-sm text-center text-sm text-muted-foreground">
          Faca login para salvar e acompanhar os editais do seu interesse.
        </p>
        <Link href="/auth/login">
          <Button>
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (favoritos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
          <Star className="h-7 w-7 text-accent-foreground" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-foreground">
          Nenhum edital favoritado
        </h3>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          Clique na estrela ao lado de um edital para adiciona-lo aos seus
          favoritos.
        </p>
      </div>
    );
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
            <p className="text-sm text-muted-foreground">
              {favoritos.length} edital(is) favoritado(s)
            </p>
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
                {favoritos.map((f, i) => {
                  const local =
                    [f.municipio, f.uf].filter(Boolean).join(" - ") || "N/A";
                  return (
                    <motion.tr
                      key={f.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className="border-b border-border transition-colors hover:bg-secondary/50"
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Remover dos favoritos"
                          onClick={() =>
                            toggleFavorito({
                              numeroControlePNCP: f.numero_controle_pncp,
                            })
                          }
                        >
                          <Star className="h-4 w-4 fill-primary text-primary" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        <div className="flex flex-col">
                          <span>{f.numero_compra || "N/A"}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {f.modalidade_nome || ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate text-sm text-foreground">
                        {f.objeto_compra || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {local}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-foreground">
                        {formatCurrency(f.valor_total_estimado)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(f.data_abertura_proposta)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/editais/${f.cnpj_orgao}/${f.ano_compra}/${f.sequencial_compra}`}
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
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
