
-- Create a dedicated security definer function for app_admins check
-- This avoids RLS recursion by bypassing RLS on the app_admins table
CREATE OR REPLACE FUNCTION public.check_is_app_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_admins
    WHERE user_id = _user_id
  )
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Only app admins can view admin list" ON public.app_admins;
DROP POLICY IF EXISTS "Only app admins can manage admins" ON public.app_admins;

-- Recreate using the security definer function
CREATE POLICY "Only app admins can view admin list"
ON public.app_admins FOR SELECT
TO authenticated
USING (public.check_is_app_admin(auth.uid()));

CREATE POLICY "Only app admins can manage admins"
ON public.app_admins FOR ALL
TO authenticated
USING (public.check_is_app_admin(auth.uid()));

-- Also update is_app_admin to use same pattern (ensure it's SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_app_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_admins
    WHERE user_id = _user_id
  )
$$;
