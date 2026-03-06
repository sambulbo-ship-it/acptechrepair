
-- Fix infinite recursion on app_admins table
-- The current policies use is_app_admin() which queries app_admins, causing recursion
-- We need to use direct subquery instead

DROP POLICY IF EXISTS "Only app admins can manage admins" ON public.app_admins;
DROP POLICY IF EXISTS "Only app admins can view admin list" ON public.app_admins;

-- Recreate with direct subquery (no function call to avoid recursion)
CREATE POLICY "Only app admins can view admin list"
ON public.app_admins FOR SELECT
TO authenticated
USING (
  auth.uid() IN (SELECT a.user_id FROM public.app_admins a)
);

CREATE POLICY "Only app admins can manage admins"
ON public.app_admins FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT a.user_id FROM public.app_admins a)
);
