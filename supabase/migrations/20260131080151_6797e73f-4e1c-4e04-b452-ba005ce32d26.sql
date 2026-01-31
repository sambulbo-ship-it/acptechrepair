-- Fix security issues identified in the scan

-- 1. Add SELECT policy for repair_requests to prevent public data exposure
-- Only authenticated workspace members can view repair requests
CREATE POLICY "Only workspace members can view repair requests" 
ON public.repair_requests 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM repair_service_providers rsp
    WHERE rsp.id = repair_requests.provider_id
    AND is_workspace_member(auth.uid(), rsp.workspace_id)
  )
);

-- 2. Add DELETE policy for repair_requests for admins
CREATE POLICY "Workspace admins can delete repair requests" 
ON public.repair_requests 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM repair_service_providers rsp
    WHERE rsp.id = repair_requests.provider_id
    AND is_workspace_admin(auth.uid(), rsp.workspace_id)
  )
);

-- 3. Drop the overly permissive existing SELECT policy on repair_requests if it exists
DROP POLICY IF EXISTS "Anyone can create repair requests" ON public.repair_requests;

-- 4. Recreate the INSERT policy with proper checks
-- Keep insert open for public form submissions, but validate email format
CREATE POLICY "Anyone can create repair requests with valid data" 
ON public.repair_requests 
FOR INSERT 
WITH CHECK (
  -- Ensure provider_id references a visible provider
  EXISTS (
    SELECT 1 FROM repair_service_providers
    WHERE id = provider_id
    AND is_visible = true
  )
  -- Email validation would happen at app level
  AND client_email IS NOT NULL
  AND length(client_email) > 0
);