-- Simplify: the OR condition was redundant, just use workspace membership
DROP POLICY IF EXISTS "Workspace members can view visible providers" ON public.repair_service_providers;

CREATE POLICY "Workspace members can view providers in their workspace"
ON public.repair_service_providers
FOR SELECT
TO authenticated
USING (is_workspace_member(auth.uid(), workspace_id));