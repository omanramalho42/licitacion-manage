"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { searchFormSchema, type SearchFormValues } from "@/lib/schemas";
import { MODALIDADES, UFS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, RotateCcw, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";

function getDefaultDates() {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  return { start: start.toISOString().split("T")[0], end };
}

interface SearchFiltersProps {
  onSearch: (values: SearchFormValues) => void;
  loading?: boolean;
}

export function SearchFilters({ onSearch, loading }: SearchFiltersProps) {
  const [expanded, setExpanded] = useState(true);
  const defaults = useMemo(() => getDefaultDates(), []);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      dataInicial: defaults.start,
      dataFinal: defaults.end,
      codigoModalidadeContratacao: "",
      uf: "",
      cnpjOrgao: "",
      pagina: 1,
      tamanhoPagina: 15,
    },
  });

  function onSubmit(values: SearchFormValues) {
    const formatted = {
      ...values,
      dataInicial: values.dataInicial.replace(/-/g, ""),
      dataFinal: values.dataFinal.replace(/-/g, ""),
    };
    onSearch(formatted);
  }

  function handleReset() {
    reset();
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros de Pesquisa
          </CardTitle>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="dataInicial"
                      className="text-sm text-foreground"
                    >
                      Data Inicial
                    </Label>
                    <Input
                      id="dataInicial"
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
                    <Label
                      htmlFor="dataFinal"
                      className="text-sm text-foreground"
                    >
                      Data Final
                    </Label>
                    <Input
                      id="dataFinal"
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

                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">
                      Modalidade
                    </Label>
                    <Select
                      onValueChange={(val) =>
                        setValue("codigoModalidadeContratacao", val)
                      }
                    >
                      <SelectTrigger className="bg-secondary text-foreground">
                        <SelectValue placeholder="Todas as modalidades" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODALIDADES.map((m) => (
                          <SelectItem key={m.value} value={m.value || "all"}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">UF</Label>
                    <Select
                      onValueChange={(val) => setValue("uf", val)}
                    >
                      <SelectTrigger className="bg-secondary text-foreground">
                        <SelectValue placeholder="Todos os estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {UFS.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="cnpjOrgao"
                      className="text-sm text-foreground"
                    >
                      CNPJ do Orgao
                    </Label>
                    <Input
                      id="cnpjOrgao"
                      placeholder="00.000.000/0000-00"
                      {...register("cnpjOrgao")}
                      className="bg-secondary text-foreground"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" disabled={loading}>
                    <Search className="mr-2 h-4 w-4" />
                    {loading ? "Pesquisando..." : "Pesquisar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                </div>
              </form>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
