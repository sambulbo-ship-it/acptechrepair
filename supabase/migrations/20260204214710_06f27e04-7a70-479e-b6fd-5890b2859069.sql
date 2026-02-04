-- Fix: Restrict quote_requests SELECT access to workspace admins only
-- This prevents regular members from accessing sensitive customer contact information

-- Drop the current overly permissive SELECT policy
DROP POLICY IF EXISTS "Members can view quote requests in their workspace" ON public.quote_requests;

-- Create new restrictive policy: only workspace admins can view quote requests
CREATE POLICY "Admins can view quote requests in their workspace" 
ON public.quote_requests 
FOR SELECT 
USING (is_workspace_admin(auth.uid(), workspace_id));

-- Also update the UPDATE policy to be admin-only for consistency
DROP POLICY IF EXISTS "Members can update quote requests in their workspace" ON public.quote_requests;

CREATE POLICY "Admins can update quote requests in their workspace" 
ON public.quote_requests 
FOR UPDATE 
USING (is_workspace_admin(auth.uid(), workspace_id));