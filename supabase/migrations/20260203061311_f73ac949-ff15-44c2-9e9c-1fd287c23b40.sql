-- Fix security issue: quote_requests should only allow INSERT via service role (edge functions)
-- This prevents direct database attacks while keeping the edge function flow working

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can create quote requests" ON public.quote_requests;

-- Create a new policy that only allows INSERT via service role
-- Regular authenticated users should use the edge function submit-quote-request instead
-- Note: Service role bypasses RLS, so this effectively blocks direct INSERT while allowing edge functions
CREATE POLICY "Only service role can insert quote requests"
ON public.quote_requests
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Also add a policy for anon that blocks direct access
CREATE POLICY "Block anonymous direct insert"
ON public.quote_requests
FOR INSERT
TO anon
WITH CHECK (false);

-- Fix security issue: repair_requests should only allow INSERT via service role (edge functions)

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can create repair requests with valid data" ON public.repair_requests;

-- Create blocking policies for direct database access
-- The edge function submit-repair-request uses service role which bypasses RLS
CREATE POLICY "Only service role can insert repair requests"
ON public.repair_requests
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Block anonymous direct repair insert"
ON public.repair_requests
FOR INSERT
TO anon
WITH CHECK (false);