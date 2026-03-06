
-- CRITICAL FIX 1: Remove overly permissive public policy on workspaces that exposes invite codes
DROP POLICY IF EXISTS "Public can view workspace info" ON public.workspaces;

-- CRITICAL FIX 2: Remove public policy on machines that exposes serial numbers, locations, user IDs
DROP POLICY IF EXISTS "Public can view operational machines" ON public.machines;

-- CRITICAL FIX 3: Remove public policy on rental_sale_config that exposes workspace/user IDs
DROP POLICY IF EXISTS "Public can view available rental/sale items" ON public.rental_sale_config;

-- CRITICAL FIX 4: Remove public policies on repair_service_providers (duplicate)
-- Keep "Anyone can view visible providers" but restrict to anon role for catalog only
-- Actually the edge function uses service role, so we can restrict both
DROP POLICY IF EXISTS "Public can view visible repair providers" ON public.repair_service_providers;

-- Now restrict remaining policies that should only be for authenticated users
-- Fix workspaces: ensure members-only SELECT uses authenticated role
DROP POLICY IF EXISTS "Users can view workspaces" ON public.workspaces;
CREATE POLICY "Users can view workspaces"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (is_workspace_member(auth.uid(), id) OR is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
CREATE POLICY "Users can create workspaces"
  ON public.workspaces FOR INSERT
  TO authenticated
  WITH CHECK (is_app_admin(auth.uid()) OR NOT EXISTS (
    SELECT 1 FROM workspace_members WHERE workspace_members.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can update workspaces" ON public.workspaces;
CREATE POLICY "Admins can update workspaces"
  ON public.workspaces FOR UPDATE
  TO authenticated
  USING (is_workspace_admin(auth.uid(), id) OR is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete workspaces" ON public.workspaces;
CREATE POLICY "Admins can delete workspaces"
  ON public.workspaces FOR DELETE
  TO authenticated
  USING (is_workspace_admin(auth.uid(), id) OR is_app_admin(auth.uid()));

-- Fix machines: restrict all to authenticated
DROP POLICY IF EXISTS "Members can view machines in their workspace" ON public.machines;
CREATE POLICY "Members can view machines in their workspace"
  ON public.machines FOR SELECT
  TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can create machines in their workspace" ON public.machines;
CREATE POLICY "Members can create machines in their workspace"
  ON public.machines FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can update machines in their workspace" ON public.machines;
CREATE POLICY "Members can update machines in their workspace"
  ON public.machines FOR UPDATE
  TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Admins can delete machines in their workspace" ON public.machines;
CREATE POLICY "Admins can delete machines in their workspace"
  ON public.machines FOR DELETE
  TO authenticated
  USING (is_workspace_admin(auth.uid(), workspace_id));

-- Fix rental_sale_config: restrict to authenticated
DROP POLICY IF EXISTS "Members can view rental config in their workspace" ON public.rental_sale_config;
CREATE POLICY "Members can view rental config in their workspace"
  ON public.rental_sale_config FOR SELECT
  TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can create rental config in their workspace" ON public.rental_sale_config;
CREATE POLICY "Members can create rental config in their workspace"
  ON public.rental_sale_config FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can update rental config in their workspace" ON public.rental_sale_config;
CREATE POLICY "Members can update rental config in their workspace"
  ON public.rental_sale_config FOR UPDATE
  TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Admins can delete rental config in their workspace" ON public.rental_sale_config;
CREATE POLICY "Admins can delete rental config in their workspace"
  ON public.rental_sale_config FOR DELETE
  TO authenticated
  USING (is_workspace_admin(auth.uid(), workspace_id));

-- Fix repair_service_providers: restrict admin policy to authenticated, keep anon view for catalog
DROP POLICY IF EXISTS "Workspace admins can manage their provider" ON public.repair_service_providers;
CREATE POLICY "Workspace admins can manage their provider"
  ON public.repair_service_providers FOR ALL
  TO authenticated
  USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Anyone can view visible providers" ON public.repair_service_providers;
CREATE POLICY "Anyone can view visible providers"
  ON public.repair_service_providers FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);
