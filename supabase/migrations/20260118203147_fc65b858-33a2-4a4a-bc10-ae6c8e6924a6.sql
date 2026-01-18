-- Fix 1: Create a function for admins to get workspace invite codes
CREATE OR REPLACE FUNCTION public.get_workspace_invite_code(_workspace_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT invite_code 
  FROM public.workspaces 
  WHERE id = _workspace_id 
    AND (is_workspace_admin(auth.uid(), _workspace_id) OR is_app_admin(auth.uid()));
$$;

-- Fix 2: Create a public view that excludes invite_code for non-admins
CREATE OR REPLACE VIEW public.workspaces_public
WITH (security_invoker = on)
AS
SELECT 
  id,
  name,
  created_at,
  created_by,
  logo_url,
  primary_color,
  secondary_color,
  CASE 
    WHEN is_workspace_admin(auth.uid(), id) OR is_app_admin(auth.uid()) 
    THEN invite_code 
    ELSE NULL 
  END as invite_code
FROM public.workspaces;

-- Fix 3: Update pending_sync INSERT policy to validate workspace_id in data field
DROP POLICY IF EXISTS "Users can create pending sync" ON public.pending_sync;

CREATE POLICY "Users can create pending sync with validated workspace"
ON public.pending_sync
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND is_workspace_member(auth.uid(), workspace_id)
  AND (
    data->>'workspace_id' IS NULL 
    OR (data->>'workspace_id')::uuid = workspace_id
  )
);