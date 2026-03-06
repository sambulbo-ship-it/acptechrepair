-- Fix: Restrict repair_service_providers to workspace members only
-- Public access now goes through the public-providers edge function
DROP POLICY IF EXISTS "Authenticated users can view visible providers" ON public.repair_service_providers;

CREATE POLICY "Workspace members can view visible providers"
ON public.repair_service_providers
FOR SELECT
TO authenticated
USING (is_workspace_member(auth.uid(), workspace_id) OR (is_visible = true AND is_workspace_member(auth.uid(), workspace_id)));

-- Fix: workspaces_public view - enable RLS
-- Note: workspaces_public is a VIEW, we need to check if RLS can be enabled
-- Views inherit RLS from underlying tables, so this should already be protected
-- But let's restrict direct access
ALTER VIEW public.workspaces_public SET (security_invoker = true);