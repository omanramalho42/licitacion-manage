"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchFilters } from "@/components/search-filters";
import { ContratacaoTable } from "@/components/contratacao-table";
import { FavoritosTable } from "@/components/favoritos-table";
import { searchContratacoes, type Contratacao } from "@/lib/api";
import type { SearchFormValues } from "@/lib/schemas";
import { useFavoritos } from "@/lib/use-favoritos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { FileText, Star } from "lucide-react";

export default function EditaisPage() {
  const [contratacoes, setContratacoes] = useState<Contratacao[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentFilters, setCurrentFilters] =
    useState<SearchFormValues | null>(null);
  const [pagina, setPagina] = useState(1);

  const { favoritos, isLoading: loadingFavoritos, isAuthenticated } =
    useFavoritos();

  const runSearch = useCallback(
    async (values: SearchFormValues | null, page: number) => {
      setLoading(true);
      setPagina(page);

      const isAllModalidades =
        !values?.codigoModalidadeContratacao ||
        values.codigoModalidadeContratacao === "all" ||
        values.codigoModalidadeContratacao === "";

      const res = await searchContratacoes({
        dataInicial: values?.dataInicial?.replace(/-/g, ""),
        dataFinal: values?.dataFinal?.replace(/-/g, ""),
        codigoModalidadeContratacao: isAllModalidades
          ? undefined
          : values?.codigoModalidadeContratacao,
        uf: values?.uf === "all" ? undefined : values?.uf,
        cnpjOrgao: values?.cnpjOrgao || undefined,
        tamanhoPagina: values?.tamanhoPagina || 15,
        pagina: page,
        fetchAll: isAllModalidades,
      });
      setContratacoes(res.data || []);
      setTotalRegistros(res.totalRegistros || 0);
      setLoading(false);
    },
    []
  );

  // Carrega editais recentes automaticamente ao abrir a pagina (sem precisar buscar)
  useEffect(() => {
    runSearch(null, 1);
  }, [runSearch]);

  function handleSearch(values: SearchFormValues) {
    setCurrentFilters(values);
    runSearch(values, 1);
  }

  function handlePageChange(newPage: number) {
    runSearch(currentFilters, newPage);
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Editais</h1>
        <p className="text-sm text-muted-foreground">
          Editais recentes de contratacoes publicas do PNCP, atualizados
          automaticamente
        </p>
      </motion.div>

      <Tabs defaultValue="todos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="todos" className="gap-2">
            <FileText className="h-4 w-4" />
            Todos os Editais
          </TabsTrigger>
          <TabsTrigger value="favoritos" className="gap-2">
            <Star className="h-4 w-4" />
            Favoritos
            {favoritos.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {favoritos.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-6">
          <SearchFilters onSearch={handleSearch} loading={loading} />

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-16"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">
                  Carregando editais...
                </p>
              </div>
            </motion.div>
          ) : (
            <ContratacaoTable
              contratacoes={contratacoes}
              totalRegistros={totalRegistros}
              pagina={pagina}
              tamanhoPagina={15}
              onPageChange={handlePageChange}
            />
          )}
        </TabsContent>

        <TabsContent value="favoritos">
          <FavoritosTable
            favoritos={favoritos}
            loading={loadingFavoritos}
            isAuthenticated={isAuthenticated}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
