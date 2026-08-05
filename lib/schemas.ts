import { z } from "zod";

export const searchFormSchema = z.object({
  dataInicial: z.string().min(1, "Data inicial e obrigatoria"),
  dataFinal: z.string().min(1, "Data final e obrigatoria"),
  codigoModalidadeContratacao: z.string().optional(),
  uf: z.string().optional(),
  cnpjOrgao: z.string().optional(),
  pagina: z.number().optional().default(1),
  tamanhoPagina: z.number().optional().default(15),
});

export type SearchFormValues = z.infer<typeof searchFormSchema>;

export const contratoSearchSchema = z.object({
  dataInicial: z.string().min(1, "Data inicial e obrigatoria"),
  dataFinal: z.string().min(1, "Data final e obrigatoria"),
  pagina: z.number().optional().default(1),
  tamanhoPagina: z.number().optional().default(15),
});

export type ContratoSearchValues = z.infer<typeof contratoSearchSchema>;
