-- Create RPC function to find workspace by invite code without requiring membership
-- This solves the catch-22 where users can't query workspace to join because they're not members yet
CREATE OR REPLACE FUNCTION public.find_workspace_by_invite_code(_invite_code TEXT)
RETURNS TABLE (id UUID, name TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.id, w.name, w.created_at
  FROM public.workspaces w
  WHERE LOWER(w.invite_code) = LOWER(_invite_code)
  LIMIT 1;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.find_workspace_by_invite_code(TEXT) TO authenticated;