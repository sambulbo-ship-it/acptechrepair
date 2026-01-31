-- Fix security issues identified in the security scan

-- 1. Restrict app_admins SELECT to only app admins (not all authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view admin list" ON public.app_admins;
CREATE POLICY "Only app admins can view admin list" 
ON public.app_admins 
FOR SELECT 
USING (is_app_admin(auth.uid()));

-- 2. The repair_requests public INSERT is intentional for public form - add rate limiting via edge function instead
-- The SELECT/UPDATE/DELETE policies we added in the last migration are correct

-- Note: The following are acceptable risks for this business model:
-- - rental_transactions: workspace member access is correct for team operations
-- - workspaces invite_code: protected by RLS, only visible to workspace members
-- - repair_service_providers public visibility: intentional for public directory
-- - external_repairs: workspace member access is correct for business operations