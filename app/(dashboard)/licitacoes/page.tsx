"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SearchFilters } from "@/components/search-filters";
import { ContratacaoTable } from "@/components/contratacao-table";
import { searchContratacoes, type Contratacao } from "@/lib/api";
import type { SearchFormValues } from "@/lib/schemas";
import { motion } from "framer-motion";
import { Gavel } from "lucide-react";

const STORAGE_KEY = "licitacoes-search-state";

type StoredState = {
  filters: SearchFormValues | null;
  pagina: number;
  apenasAbertas: boolean;
  hasSearched: boolean;
  contratacoes: Contratacao[];
  totalRegistros: number;
};

function loadStoredState(): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredState;
  } catch {
    return null;
  }
}

function saveStoredState(state: StoredState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage cheio/indisponível — ignora silenciosamente
  }
}

export default function LicitacoesPage() {
  const [contratacoes, setContratacoes] = useState<Contratacao[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentFilters, setCurrentFilters] =
    useState<SearchFormValues | null>(null);
  const [pagina, setPagina] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [apenasAbertas, setApenasAbertas] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const didInitRef = useRef(false);

  const runSearch = useCallback(
    async (values: SearchFormValues, page: number, abertas: boolean) => {
      setLoading(true);

      const isAllModalidades =
        !values.codigoModalidadeContratacao ||
        values.codigoModalidadeContratacao === "all" ||
        values.codigoModalidadeContratacao === "";

      const res = await searchContratacoes({
        dataInicial: values.dataInicial?.replace(/-/g, ""),
        dataFinal: values.dataFinal?.replace(/-/g, ""),
        codigoModalidadeContratacao: isAllModalidades
          ? undefined
          : values.codigoModalidadeContratacao,
        uf: values.uf === "all" ? undefined : values.uf,
        cnpjOrgao: values.cnpjOrgao || undefined,
        tamanhoPagina: values.tamanhoPagina,
        pagina: page,
        fetchAll: isAllModalidades,
        apenasAbertas: abertas,
      });

      const data = res.data || [];
      const total = res.totalRegistros || 0;

      setContratacoes(data);
      setTotalRegistros(total);
      setLoading(false);

      saveStoredState({
        filters: values,
        pagina: page,
        apenasAbertas: abertas,
        hasSearched: true,
        contratacoes: data,
        totalRegistros: total,
      });
    },
    []
  );

  // Restaura o estado salvo ao montar (inclusive ao voltar de outra página)
    useEffect(() => {
      if (didInitRef.current) return;
      didInitRef.current = true;

      const stored = loadStoredState();

      if (stored) {
        setApenasAbertas(stored.apenasAbertas);
        setPagina(stored.pagina);
        setHasSearched(stored.hasSearched);

        if (stored.filters) {
          setCurrentFilters(stored.filters);
          setContratacoes(stored.contratacoes);
          setTotalRegistros(stored.totalRegistros);
          // sem chamada a runSearch aqui — só restaura o que já foi salvo
        }
      }

      setHydrated(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  async function handleSearch(values: SearchFormValues) {
    setCurrentFilters(values);
    setPagina(1);
    setHasSearched(true);
    await runSearch(values, 1, apenasAbertas);
  }

  async function handlePageChange(newPage: number) {
    if (!currentFilters) return;
    setPagina(newPage);
    await runSearch(currentFilters, newPage, apenasAbertas);
  }

  function handleApenasAbertasChange(checked: boolean) {
    setApenasAbertas(checked);
    if (currentFilters) {
      runSearch(currentFilters, pagina, checked);
    } else {
      saveStoredState({
        filters: null,
        pagina: 1,
        apenasAbertas: checked,
        hasSearched: false,
        contratacoes: [],
        totalRegistros: 0,
      });
    }
  }

  // Evita "piscar" o estado vazio antes de ler o localStorage
  if (!hydrated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Licitacoes</h1>
        <p className="text-sm text-muted-foreground">
          Pesquise e filtre contratacoes publicas do PNCP
        </p>
      </motion.div>

      <SearchFilters
        onSearch={handleSearch}
        loading={loading}
        defaultValues={currentFilters ?? undefined}
      />

      <label className="flex w-fit items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={apenasAbertas}
          onChange={(e) => handleApenasAbertasChange(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        Mostrar licitações abertas e futuras (recebendo ou a receber propostas)
      </label>

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-16"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Pesquisando licitacoes...
            </p>
          </div>
        </motion.div>
      )}

      {!loading && hasSearched && (
        <ContratacaoTable
          contratacoes={contratacoes}
          totalRegistros={totalRegistros}
          pagina={pagina}
          tamanhoPagina={15}
          onPageChange={handlePageChange}
        />
      )}

      {!loading && !hasSearched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <Gavel className="h-7 w-7 text-accent-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">
            Pesquise Licitacoes
          </h3>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Use os filtros acima para buscar contratacoes publicas no Portal
            Nacional de Contratacoes Publicas (PNCP).
          </p>
        </motion.div>
      )}
    </div>
  );
}