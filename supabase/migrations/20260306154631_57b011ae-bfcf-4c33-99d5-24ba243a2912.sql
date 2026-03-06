-- Fix: Restrict repair_service_providers SELECT to authenticated users only
-- The "Anyone can view visible providers" policy allows anon access, exposing contact info
DROP POLICY IF EXISTS "Anyone can view visible providers" ON public.repair_service_providers;

CREATE POLICY "Authenticated users can view visible providers"
ON public.repair_service_providers
FOR SELECT
TO authenticated
USING (is_visible = true);

-- Fix: Remove duplicate SELECT policy on repair_requests
DROP POLICY IF EXISTS "Providers can view their requests" ON public.repair_requests;

-- Fix: Restrict rental_transactions SELECT to workspace admins only (contains client PII)
DROP POLICY IF EXISTS "Members can view transactions in their workspace" ON public.rental_transactions;

CREATE POLICY "Admins can view transactions in their workspace"
ON public.rental_transactions
FOR SELECT
TO authenticated
USING (is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Members can view their own transactions"
ON public.rental_transactions
FOR SELECT
TO authenticated
USING (created_by = auth.uid());