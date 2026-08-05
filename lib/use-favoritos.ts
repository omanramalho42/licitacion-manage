"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Contratacao } from "@/lib/api";

export interface FavoritoEdital {
  id: string;
  numero_controle_pncp: string;
  cnpj_orgao: string | null;
  ano_compra: number | null;
  sequencial_compra: number | null;
  numero_compra: string | null;
  objeto_compra: string | null;
  orgao_razao_social: string | null;
  municipio: string | null;
  uf: string | null;
  valor_total_estimado: number | null;
  data_abertura_proposta: string | null;
  modalidade_nome: string | null;
  created_at: string;
}

async function fetchFavoritos(
  userId: string | undefined
): Promise<FavoritoEdital[]> {
  if (!userId) return [];
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("favoritos_editais")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[v0] Erro ao buscar favoritos:", error.message);
    return [];
  }
  return (data as FavoritoEdital[]) || [];
}

export function useFavoritos() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data, error, isLoading, mutate } = useSWR(
    userId ? ["favoritos", userId] : null,
    () => fetchFavoritos(userId)
  );

  const favoritos = data || [];

  const isFavorito = useCallback(
    (numeroControlePNCP: string | undefined) => {
      if (!numeroControlePNCP) return false;
      return favoritos.some(
        (f) => f.numero_controle_pncp === numeroControlePNCP
      );
    },
    [favoritos]
  );

  const toggleFavorito = useCallback(
    async (c: Contratacao) => {
      if (!userId || !c.numeroControlePNCP) return;
      const supabase = createClient();
      if (!supabase) return;

      const jaFavorito = favoritos.some(
        (f) => f.numero_controle_pncp === c.numeroControlePNCP
      );

      if (jaFavorito) {
        // Remove
        await supabase
          .from("favoritos_editais")
          .delete()
          .eq("user_id", userId)
          .eq("numero_controle_pncp", c.numeroControlePNCP);
      } else {
        // Adiciona
        await supabase.from("favoritos_editais").insert({
          user_id: userId,
          numero_controle_pncp: c.numeroControlePNCP,
          cnpj_orgao: c.orgaoEntidade?.cnpj ?? null,
          ano_compra: c.anoCompra ?? null,
          sequencial_compra: c.sequencialCompra ?? null,
          numero_compra: c.numeroCompra ?? null,
          objeto_compra: c.objetoCompra ?? null,
          orgao_razao_social: c.orgaoEntidade?.razaoSocial ?? null,
          municipio:
            c.unidadeOrgao?.municipioNome ?? c.municipioNome ?? null,
          uf: c.unidadeOrgao?.ufNome ?? c.uf ?? null,
          valor_total_estimado: c.valorTotalEstimado ?? null,
          data_abertura_proposta: c.dataAberturaProposta ?? null,
          modalidade_nome: c.modalidadeNome ?? null,
        });
      }

      mutate();
    },
    [userId, favoritos, mutate]
  );

  return {
    favoritos,
    isFavorito,
    toggleFavorito,
    isLoading,
    error,
    isAuthenticated: !!userId,
    mutate,
  };
}
