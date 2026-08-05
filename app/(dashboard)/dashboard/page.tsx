"use client";

import { useEffect, useState } from "react";
import { FileText, Gavel, TrendingUp, Building2 } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { DashboardCharts } from "@/components/dashboard-charts";
import { RecentContratacoes } from "@/components/recent-contratacoes";
import {
  searchContratacoes,
  getDefaultDateRange,
  type Contratacao,
} from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [contratacoes, setContratacoes] = useState<Contratacao[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await searchContratacoes({
          dataInicial: dateRange.dataInicial,
          dataFinal: dateRange.dataFinal,
          tamanhoPagina: 20,
          pagina: 1,
          fetchAll: true,
        });
        setContratacoes(res.data || []);
        setTotalRegistros(res.totalRegistros || 0);
      } catch {
        // silently handle errors - dashboard shows empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dateRange]);

  const totalValor = contratacoes.reduce(
    (sum, c) => sum + (c.valorTotalEstimado || 0),
    0
  );

  const orgaosUnicos = new Set(
    contratacoes.map((c) => c.orgaoEntidade?.cnpj).filter(Boolean)
  ).size;

  const modalidades = new Set(
    contratacoes.map((c) => c.modalidadeNome).filter(Boolean)
  ).size;

  function formatCurrency(val: number) {
    if (val >= 1_000_000_000)
      return `R$ ${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(1)}K`;
    return `R$ ${val.toFixed(0)}`;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={`stat-skel-${
                // biome-ignore lint: index key
                i
              }`}
              className="h-32"
            />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={`chart-skel-${
                // biome-ignore lint: index key
                i
              }`}
              className="h-80"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visao geral das contratacoes publicas - Ultimos 30 dias
        </p>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total de Licitacoes"
          value={totalRegistros.toLocaleString("pt-BR")}
          description="no periodo selecionado"
          icon={Gavel}
          trend="+12%"
          trendUp
          index={0}
        />
        <StatCard
          title="Valor Total Estimado"
          value={formatCurrency(totalValor)}
          description="soma dos valores"
          icon={TrendingUp}
          trend="+8%"
          trendUp
          index={1}
        />
        <StatCard
          title="Orgaos Participantes"
          value={orgaosUnicos.toString()}
          description="orgaos unicos"
          icon={Building2}
          index={2}
        />
        <StatCard
          title="Modalidades"
          value={modalidades.toString()}
          description="tipos distintos"
          icon={FileText}
          index={3}
        />
      </div>

      <DashboardCharts contratacoes={contratacoes} />

      <RecentContratacoes contratacoes={contratacoes.slice(0, 8)} />
    </div>
  );
}
