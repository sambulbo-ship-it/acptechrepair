-- Enum pour les rôles dans un workspace
CREATE TYPE public.workspace_role AS ENUM ('admin', 'member');

-- Table des workspaces (espaces privés)
CREATE TABLE public.workspaces (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table des membres d'un workspace
CREATE TABLE public.workspace_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role workspace_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, user_id)
);

-- Table des équipements (machines) - liée au workspace
CREATE TABLE public.machines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'operational',
    notes TEXT,
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table des entrées de diagnostic - liée au workspace via machine
CREATE TABLE public.diagnostic_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    technician TEXT,
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table des membres d'équipe (par workspace)
CREATE TABLE public.team_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Function to check if user is member of a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

-- Function to check if user is admin of a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_admin(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id AND role = 'admin'
  )
$$;

-- Function to check if user is admin of ANY workspace (for creating new workspaces)
CREATE OR REPLACE FUNCTION public.is_any_workspace_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- RLS Policies for workspaces
CREATE POLICY "Users can view workspaces they belong to"
ON public.workspaces FOR SELECT
USING (public.is_workspace_member(auth.uid(), id));

CREATE POLICY "Admins can create workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (
    -- First user ever OR existing admin
    NOT EXISTS (SELECT 1 FROM public.workspace_members)
    OR public.is_any_workspace_admin(auth.uid())
);

CREATE POLICY "Workspace admins can update their workspace"
ON public.workspaces FOR UPDATE
USING (public.is_workspace_admin(auth.uid(), id));

CREATE POLICY "Workspace admins can delete their workspace"
ON public.workspaces FOR DELETE
USING (public.is_workspace_admin(auth.uid(), id));

-- RLS Policies for workspace_members
CREATE POLICY "Members can view other members in their workspace"
ON public.workspace_members FOR SELECT
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can join workspace with invite code"
ON public.workspace_members FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update members in their workspace"
ON public.workspace_members FOR UPDATE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can remove members from their workspace"
ON public.workspace_members FOR DELETE
USING (public.is_workspace_admin(auth.uid(), workspace_id) OR user_id = auth.uid());

-- RLS Policies for machines
CREATE POLICY "Members can view machines in their workspace"
ON public.machines FOR SELECT
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create machines in their workspace"
ON public.machines FOR INSERT
WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update machines in their workspace"
ON public.machines FOR UPDATE
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete machines in their workspace"
ON public.machines FOR DELETE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- RLS Policies for diagnostic_entries
CREATE POLICY "Members can view entries for machines in their workspace"
ON public.diagnostic_entries FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.machines m
        WHERE m.id = machine_id
        AND public.is_workspace_member(auth.uid(), m.workspace_id)
    )
);

CREATE POLICY "Members can create entries for machines in their workspace"
ON public.diagnostic_entries FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.machines m
        WHERE m.id = machine_id
        AND public.is_workspace_member(auth.uid(), m.workspace_id)
    )
);

CREATE POLICY "Members can update entries they created"
ON public.diagnostic_entries FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Members can delete entries they created or admins"
ON public.diagnostic_entries FOR DELETE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.machines m
        WHERE m.id = machine_id
        AND public.is_workspace_admin(auth.uid(), m.workspace_id)
    )
);

-- RLS Policies for team_members
CREATE POLICY "Members can view team in their workspace"
ON public.team_members FOR SELECT
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can add team members to their workspace"
ON public.team_members FOR INSERT
WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update team members in their workspace"
ON public.team_members FOR UPDATE
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete team members in their workspace"
ON public.team_members FOR DELETE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- Trigger for updated_at on machines
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_machines_updated_at
BEFORE UPDATE ON public.machines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();