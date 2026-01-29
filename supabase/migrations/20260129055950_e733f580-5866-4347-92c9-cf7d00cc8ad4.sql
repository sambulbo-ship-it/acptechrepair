-- 1. Bucket pour les factures de réparation et vente
INSERT INTO storage.buckets (id, name, public) 
VALUES ('repair-invoices', 'repair-invoices', false);

-- 2. Politiques RLS pour le bucket - SELECT (voir les factures)
CREATE POLICY "Members can view invoices in their workspace" 
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'repair-invoices' AND
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND workspace_id::text = (storage.foldername(name))[1]
  )
);

-- 3. Politiques RLS pour le bucket - INSERT (uploader des factures)
CREATE POLICY "Members can upload invoices to their workspace" 
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'repair-invoices' AND
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND workspace_id::text = (storage.foldername(name))[1]
  )
);

-- 4. Politiques RLS pour le bucket - UPDATE (modifier des factures)
CREATE POLICY "Members can update invoices in their workspace" 
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'repair-invoices' AND
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND workspace_id::text = (storage.foldername(name))[1]
  )
);

-- 5. Politiques RLS pour le bucket - DELETE (admins seulement)
CREATE POLICY "Admins can delete invoices in their workspace" 
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'repair-invoices' AND
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND workspace_id::text = (storage.foldername(name))[1]
    AND role = 'admin'
  )
);

-- 6. Table knowledge_entries pour l'expertise partagée
CREATE TABLE public.knowledge_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  category text NOT NULL,
  brand text,
  model text,
  problem_description text NOT NULL,
  solution_description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Index pour recherche efficace
CREATE INDEX idx_knowledge_entries_workspace ON public.knowledge_entries(workspace_id);
CREATE INDEX idx_knowledge_entries_category ON public.knowledge_entries(category);
CREATE INDEX idx_knowledge_entries_brand ON public.knowledge_entries(brand);

-- 8. Enable RLS on knowledge_entries
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;

-- 9. RLS policies for knowledge_entries
CREATE POLICY "Members can view knowledge entries in their workspace" 
ON public.knowledge_entries FOR SELECT
USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create knowledge entries in their workspace" 
ON public.knowledge_entries FOR INSERT
WITH CHECK (is_workspace_member(auth.uid(), workspace_id) AND user_id = auth.uid());

CREATE POLICY "Members can update their own knowledge entries" 
ON public.knowledge_entries FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins can delete knowledge entries in their workspace" 
ON public.knowledge_entries FOR DELETE
USING (is_workspace_admin(auth.uid(), workspace_id) OR user_id = auth.uid());

-- 10. Trigger pour updated_at
CREATE TRIGGER update_knowledge_entries_updated_at
BEFORE UPDATE ON public.knowledge_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Colonne invoice_url sur rental_transactions
ALTER TABLE public.rental_transactions 
ADD COLUMN IF NOT EXISTS invoice_url text;

-- 12. Colonne invoice_url sur external_repairs pour les réparations externes
ALTER TABLE public.external_repairs 
ADD COLUMN IF NOT EXISTS invoice_url text;