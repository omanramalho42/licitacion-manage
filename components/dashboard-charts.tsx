"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { motion } from "framer-motion";
import type { Contratacao } from "@/lib/api";

const COLORS = [
  "hsl(217, 91%, 50%)",
  "hsl(173, 58%, 39%)",
  "hsl(43, 74%, 56%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 60%, 55%)",
];

interface DashboardChartsProps {
  contratacoes: Contratacao[];
}

function getModalidadeData(contratacoes: Contratacao[]) {
  const counts: Record<string, number> = {};
  for (const c of contratacoes) {
    const name = c.modalidadeNome || "Outros";
    const shortName =
      name.length > 20 ? `${name.substring(0, 18)}...` : name;
    counts[shortName] = (counts[shortName] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function getUfData(contratacoes: Contratacao[]) {
  const counts: Record<string, number> = {};
  for (const c of contratacoes) {
    const uf = c.unidadeOrgao?.ufNome || c.uf || "N/A";
    counts[uf] = (counts[uf] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([uf, total]) => ({ uf, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

function getValorData(contratacoes: Contratacao[]) {
  const byDate: Record<string, number> = {};
  for (const c of contratacoes) {
    const date = c.dataPublicacaoPncp
      ? c.dataPublicacaoPncp.substring(0, 10)
      : "N/A";
    const val = c.valorTotalEstimado || 0;
    byDate[date] = (byDate[date] || 0) + val;
  }
  return Object.entries(byDate)
    .map(([date, valor]) => ({
      date: date.substring(5),
      valor: valor / 1000000,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-15);
}

function getSituacaoData(contratacoes: Contratacao[]) {
  const counts: Record<string, number> = {};
  for (const c of contratacoes) {
    const name = c.situacaoCompraNome || "N/A";
    counts[name] = (counts[name] || 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function DashboardCharts({ contratacoes }: DashboardChartsProps) {
  const modalidadeData = getModalidadeData(contratacoes);
  const ufData = getUfData(contratacoes);
  const valorData = getValorData(contratacoes);
  const situacaoData = getSituacaoData(contratacoes);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Valor Estimado por Data (Milhoes R$)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={valorData}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(217, 91%, 50%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(217, 91%, 50%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(220, 13%, 90%)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 90%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(val: number) => [
                    `R$ ${val.toFixed(2)}M`,
                    "Valor",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="hsl(217, 91%, 50%)"
                  fill="url(#colorValor)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Licitacoes por Modalidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={modalidadeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {modalidadeData.map((_, index) => (
                    <Cell
                      key={`cell-${
                        // biome-ignore lint: index is needed
                        index
                      }`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 90%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-3">
              {modalidadeData.map((item, i) => (
                <div
                  key={item.name}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  {item.name} ({item.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Licitacoes por UF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ufData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(220, 13%, 90%)"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }}
                />
                <YAxis
                  dataKey="uf"
                  type="category"
                  width={120}
                  tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 90%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="hsl(173, 58%, 39%)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Situacao das Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={situacaoData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(220, 13%, 90%)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 90%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(43, 74%, 56%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
