"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import type { Contratacao } from "@/lib/api";

interface RecentContatacoesProps {
  contratacoes: Contratacao[];
}

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

export function RecentContratacoes({ contratacoes }: RecentContatacoesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Licitacoes Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">
                    Orgao
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Objeto
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Modalidade
                  </TableHead>
                  <TableHead className="text-right text-muted-foreground">
                    Valor
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Data
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratacoes.map((c, i) => (
                  <TableRow
                    key={`${c.numeroControlePNCP || i}`}
                    className="border-border"
                  >
                    <TableCell className="max-w-[200px] truncate text-sm text-foreground">
                      {c.orgaoEntidade?.razaoSocial || "N/A"}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-sm text-foreground">
                      {c.objetoCompra || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {c.modalidadeNome || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-foreground">
                      {formatCurrency(c.valorTotalEstimado)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.dataPublicacaoPncp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
