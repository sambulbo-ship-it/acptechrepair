-- Create app_admins table for global app administrators
CREATE TABLE public.app_admins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on app_admins
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;

-- Only app admins can view the admin list
CREATE POLICY "App admins can view admin list" 
ON public.app_admins 
FOR SELECT 
USING (true);

-- Only app admins can manage admins (via database function)
CREATE POLICY "Only app admins can manage admins"
ON public.app_admins
FOR ALL
USING (EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid()));

-- Create function to check if user is app admin
CREATE OR REPLACE FUNCTION public.is_app_admin(_user_id UUID)
RETURNS BOOLEAN
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

-- Insert sam.bulbo@animalcoat.com as the first app admin
INSERT INTO public.app_admins (user_id) 
VALUES ('8e13d9fb-8f64-4279-8982-e7de5df2a214');

-- Update workspace creation policy to allow app admins OR first workspace creation
DROP POLICY IF EXISTS "Admins can create workspaces" ON public.workspaces;

CREATE POLICY "Users can create workspaces" 
ON public.workspaces 
FOR INSERT 
WITH CHECK (
    is_app_admin(auth.uid()) OR
    (NOT EXISTS (SELECT 1 FROM workspace_members WHERE user_id = auth.uid()))
);

-- Also allow app admins to view ALL workspaces
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON public.workspaces;

CREATE POLICY "Users can view workspaces" 
ON public.workspaces 
FOR SELECT 
USING (
    is_workspace_member(auth.uid(), id) OR is_app_admin(auth.uid())
);

-- Allow app admins to update any workspace
DROP POLICY IF EXISTS "Workspace admins can update their workspace" ON public.workspaces;

CREATE POLICY "Admins can update workspaces"
ON public.workspaces
FOR UPDATE
USING (
    is_workspace_admin(auth.uid(), id) OR is_app_admin(auth.uid())
);

-- Allow app admins to delete any workspace
DROP POLICY IF EXISTS "Workspace admins can delete their workspace" ON public.workspaces;

CREATE POLICY "Admins can delete workspaces"
ON public.workspaces
FOR DELETE
USING (
    is_workspace_admin(auth.uid(), id) OR is_app_admin(auth.uid())
);