-- Favoritos de editais (por usuario)
CREATE TABLE IF NOT EXISTS public.favoritos_editais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_controle_pncp TEXT NOT NULL,
  cnpj_orgao TEXT,
  ano_compra INTEGER,
  sequencial_compra INTEGER,
  numero_compra TEXT,
  objeto_compra TEXT,
  orgao_razao_social TEXT,
  municipio TEXT,
  uf TEXT,
  valor_total_estimado NUMERIC,
  data_abertura_proposta TIMESTAMPTZ,
  modalidade_nome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, numero_controle_pncp)
);

ALTER TABLE public.favoritos_editais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favoritos_select_own" ON public.favoritos_editais;
DROP POLICY IF EXISTS "favoritos_insert_own" ON public.favoritos_editais;
DROP POLICY IF EXISTS "favoritos_delete_own" ON public.favoritos_editais;
CREATE POLICY "favoritos_select_own" ON public.favoritos_editais FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favoritos_insert_own" ON public.favoritos_editais FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favoritos_delete_own" ON public.favoritos_editais FOR DELETE USING (auth.uid() = user_id);

-- Meus contratos (CRUD proprio)
CREATE TABLE IF NOT EXISTS public.meus_contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_contrato TEXT NOT NULL,
  objeto TEXT,
  orgao TEXT,
  fornecedor TEXT,
  cnpj_fornecedor TEXT,
  valor_global NUMERIC,
  data_vigencia_inicio DATE,
  data_vigencia_fim DATE,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado', 'suspenso', 'rascunho')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.meus_contratos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meus_contratos_select_own" ON public.meus_contratos;
DROP POLICY IF EXISTS "meus_contratos_insert_own" ON public.meus_contratos;
DROP POLICY IF EXISTS "meus_contratos_update_own" ON public.meus_contratos;
DROP POLICY IF EXISTS "meus_contratos_delete_own" ON public.meus_contratos;
CREATE POLICY "meus_contratos_select_own" ON public.meus_contratos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "meus_contratos_insert_own" ON public.meus_contratos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meus_contratos_update_own" ON public.meus_contratos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "meus_contratos_delete_own" ON public.meus_contratos FOR DELETE USING (auth.uid() = user_id);

-- Minhas atas de registro de precos (CRUD proprio)
CREATE TABLE IF NOT EXISTS public.minhas_atas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_ata TEXT NOT NULL,
  objeto TEXT,
  orgao TEXT,
  fornecedor TEXT,
  valor_total NUMERIC,
  data_assinatura DATE,
  data_vigencia_inicio DATE,
  data_vigencia_fim DATE,
  status TEXT DEFAULT 'vigente' CHECK (status IN ('vigente', 'encerrada', 'suspensa', 'rascunho')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.minhas_atas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "minhas_atas_select_own" ON public.minhas_atas;
DROP POLICY IF EXISTS "minhas_atas_insert_own" ON public.minhas_atas;
DROP POLICY IF EXISTS "minhas_atas_update_own" ON public.minhas_atas;
DROP POLICY IF EXISTS "minhas_atas_delete_own" ON public.minhas_atas;
CREATE POLICY "minhas_atas_select_own" ON public.minhas_atas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "minhas_atas_insert_own" ON public.minhas_atas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "minhas_atas_update_own" ON public.minhas_atas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "minhas_atas_delete_own" ON public.minhas_atas FOR DELETE USING (auth.uid() = user_id);
