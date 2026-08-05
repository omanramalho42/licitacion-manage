-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'visitante',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Profiles RLS policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'visitante')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Add user_id to documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Drop old permissive policies on documents
DROP POLICY IF EXISTS "allow_all_documents" ON public.documents;
DROP POLICY IF EXISTS "documents_select_all" ON public.documents;
DROP POLICY IF EXISTS "documents_insert_own" ON public.documents;
DROP POLICY IF EXISTS "documents_update_own" ON public.documents;
DROP POLICY IF EXISTS "documents_delete_own" ON public.documents;
DROP POLICY IF EXISTS "documents_admin_all" ON public.documents;

-- Documents: visitors can view, authed users can CRUD their own
CREATE POLICY "documents_select_all" ON public.documents FOR SELECT USING (true);
CREATE POLICY "documents_insert_own" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_update_own" ON public.documents FOR UPDATE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "documents_delete_own" ON public.documents FOR DELETE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. Drop old attachments policies
DROP POLICY IF EXISTS "allow_all_attachments" ON public.document_attachments;
DROP POLICY IF EXISTS "attachments_select_all" ON public.document_attachments;
DROP POLICY IF EXISTS "attachments_insert_auth" ON public.document_attachments;
DROP POLICY IF EXISTS "attachments_delete_own" ON public.document_attachments;
DROP POLICY IF EXISTS "attachments_admin_all" ON public.document_attachments;

CREATE POLICY "attachments_select_all" ON public.document_attachments FOR SELECT USING (true);
CREATE POLICY "attachments_insert_auth" ON public.document_attachments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "attachments_delete_own" ON public.document_attachments FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;

-- 8. Storage policies
DROP POLICY IF EXISTS "documents_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_storage_delete" ON storage.objects;

CREATE POLICY "documents_storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "documents_storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "documents_storage_delete" ON storage.objects FOR DELETE USING (bucket_id = 'documents');
