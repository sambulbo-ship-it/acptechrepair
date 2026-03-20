-- Migration: 20260118165654_a502581f-1a9a-4b09-9a87-406ca22feb19.sql
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
-- Migration: 20260118172358_b8c72e9e-a00e-40f6-ba54-1ff6cbf0433b.sql
-- Enable realtime for all workspace tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.machines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostic_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
-- Migration: 20260118174122_1f4507d2-b3f9-441c-8677-42d851b1eb65.sql
-- Table pour l'historique des scans
CREATE TABLE public.scan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
    scanned_code TEXT NOT NULL,
    scan_type TEXT NOT NULL DEFAULT 'barcode', -- 'barcode' or 'qrcode'
    scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    found BOOLEAN NOT NULL DEFAULT false,
    device_info TEXT
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_scan_history_workspace ON public.scan_history(workspace_id);
CREATE INDEX idx_scan_history_scanned_at ON public.scan_history(scanned_at DESC);

-- Enable RLS
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Isolation totale entre workspaces
CREATE POLICY "Members can view scan history in their workspace"
ON public.scan_history FOR SELECT
USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create scan history in their workspace"
ON public.scan_history FOR INSERT
WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete scan history in their workspace"
ON public.scan_history FOR DELETE
USING (is_workspace_admin(auth.uid(), workspace_id));

-- Table pour les paramètres de workspace (permissions configurables par admin)
CREATE TABLE public.workspace_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
    enable_barcode_scan BOOLEAN NOT NULL DEFAULT true,
    enable_qrcode_scan BOOLEAN NOT NULL DEFAULT true,
    enable_barcode_print BOOLEAN NOT NULL DEFAULT true,
    enable_qrcode_print BOOLEAN NOT NULL DEFAULT true,
    require_scan_notes BOOLEAN NOT NULL DEFAULT false,
    scan_history_retention_days INTEGER NOT NULL DEFAULT 365,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view settings in their workspace"
ON public.workspace_settings FOR SELECT
USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can update settings in their workspace"
ON public.workspace_settings FOR UPDATE
USING (is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert settings for their workspace"
ON public.workspace_settings FOR INSERT
WITH CHECK (is_workspace_admin(auth.uid(), workspace_id));

-- Trigger pour updated_at
CREATE TRIGGER update_workspace_settings_updated_at
BEFORE UPDATE ON public.workspace_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for scan_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_history;
-- Migration: 20260118181915_a2553912-2b8d-454c-8616-c5b12e03e97d.sql
-- Add workspace branding columns
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#f97316',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#1a1a2e';

-- Create notification preferences table for workspace admins
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Notification types
  notify_machine_in_repair BOOLEAN NOT NULL DEFAULT true,
  notify_machine_ready BOOLEAN NOT NULL DEFAULT true,
  notify_stock_out BOOLEAN NOT NULL DEFAULT true,
  notify_stock_in BOOLEAN NOT NULL DEFAULT true,
  notify_status_critical BOOLEAN NOT NULL DEFAULT true,
  notify_new_team_member BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(workspace_id, user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification preferences
CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own notification preferences
CREATE POLICY "Users can create their own notification preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (user_id = auth.uid() AND is_workspace_member(auth.uid(), workspace_id));

-- Users can update their own notification preferences
CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own notification preferences
CREATE POLICY "Users can delete their own notification preferences"
ON public.notification_preferences FOR DELETE
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create pending sync table for offline changes
CREATE TABLE public.pending_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  synced_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for pending_sync
ALTER TABLE public.pending_sync ENABLE ROW LEVEL SECURITY;

-- Users can manage their own pending sync records
CREATE POLICY "Users can view their pending sync"
ON public.pending_sync FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create pending sync"
ON public.pending_sync FOR INSERT
WITH CHECK (user_id = auth.uid() AND is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can update their pending sync"
ON public.pending_sync FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their pending sync"
ON public.pending_sync FOR DELETE
USING (user_id = auth.uid());
-- Migration: 20260118184850_c35ec148-4553-477a-bd4a-f1a2be6f4260.sql
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
-- Migration: 20260118191857_4186a222-041c-4d93-9502-c5d769e277ce.sql
-- Create maintenance_schedules table for preventive maintenance reminders
CREATE TABLE public.maintenance_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  interval_days INTEGER NOT NULL DEFAULT 30,
  last_maintenance_date DATE,
  next_maintenance_date DATE NOT NULL,
  reminder_days_before INTEGER NOT NULL DEFAULT 7,
  enabled BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(machine_id)
);

-- Enable RLS
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view maintenance schedules in their workspace"
ON public.maintenance_schedules FOR SELECT
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create maintenance schedules in their workspace"
ON public.maintenance_schedules FOR INSERT
WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update maintenance schedules in their workspace"
ON public.maintenance_schedules FOR UPDATE
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete maintenance schedules in their workspace"
ON public.maintenance_schedules FOR DELETE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- App admins can do everything
CREATE POLICY "App admins can manage all maintenance schedules"
ON public.maintenance_schedules FOR ALL
USING (public.is_app_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_maintenance_schedules_updated_at
BEFORE UPDATE ON public.maintenance_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add maintenance reminder preference to notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS notify_maintenance_reminder BOOLEAN NOT NULL DEFAULT true;

-- Enable realtime for maintenance_schedules
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_schedules;
-- Migration: 20260118203147_fc65b858-33a2-4a4a-bc10-ae6c8e6924a6.sql
-- Fix 1: Create a function for admins to get workspace invite codes
CREATE OR REPLACE FUNCTION public.get_workspace_invite_code(_workspace_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT invite_code 
  FROM public.workspaces 
  WHERE id = _workspace_id 
    AND (is_workspace_admin(auth.uid(), _workspace_id) OR is_app_admin(auth.uid()));
$$;

-- Fix 2: Create a public view that excludes invite_code for non-admins
CREATE OR REPLACE VIEW public.workspaces_public
WITH (security_invoker = on)
AS
SELECT 
  id,
  name,
  created_at,
  created_by,
  logo_url,
  primary_color,
  secondary_color,
  CASE 
    WHEN is_workspace_admin(auth.uid(), id) OR is_app_admin(auth.uid()) 
    THEN invite_code 
    ELSE NULL 
  END as invite_code
FROM public.workspaces;

-- Fix 3: Update pending_sync INSERT policy to validate workspace_id in data field
DROP POLICY IF EXISTS "Users can create pending sync" ON public.pending_sync;

CREATE POLICY "Users can create pending sync with validated workspace"
ON public.pending_sync
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND is_workspace_member(auth.uid(), workspace_id)
  AND (
    data->>'workspace_id' IS NULL 
    OR (data->>'workspace_id')::uuid = workspace_id
  )
);
-- Migration: 20260119100255_31931d7b-e11c-4941-be2e-00cd974af7f3.sql
-- Table for external repair locations/vendors
CREATE TABLE public.repair_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  specialties TEXT[], -- Types of machines they can repair
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.repair_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can view repair locations in their workspace"
  ON public.repair_locations FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create repair locations in their workspace"
  ON public.repair_locations FOR INSERT
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update repair locations in their workspace"
  ON public.repair_locations FOR UPDATE
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete repair locations in their workspace"
  ON public.repair_locations FOR DELETE
  USING (is_workspace_admin(auth.uid(), workspace_id));

-- Trigger for updated_at
CREATE TRIGGER update_repair_locations_updated_at
  BEFORE UPDATE ON public.repair_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table for external repair history
CREATE TABLE public.external_repairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  repair_location_id UUID REFERENCES public.repair_locations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'in_progress', 'completed', 'returned')),
  sent_date DATE NOT NULL,
  expected_return_date DATE,
  actual_return_date DATE,
  issue_description TEXT NOT NULL,
  repair_description TEXT,
  cost DECIMAL(10, 2),
  currency TEXT DEFAULT 'EUR',
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.external_repairs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can view external repairs in their workspace"
  ON public.external_repairs FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create external repairs in their workspace"
  ON public.external_repairs FOR INSERT
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update external repairs in their workspace"
  ON public.external_repairs FOR UPDATE
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete external repairs in their workspace"
  ON public.external_repairs FOR DELETE
  USING (is_workspace_admin(auth.uid(), workspace_id));

-- Trigger for updated_at
CREATE TRIGGER update_external_repairs_updated_at
  BEFORE UPDATE ON public.external_repairs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table for spare parts inventory
CREATE TABLE public.spare_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  part_number TEXT,
  category TEXT, -- Machine category this part is for
  compatible_models TEXT[], -- List of compatible machine models
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 0, -- Alert threshold
  unit_price DECIMAL(10, 2),
  currency TEXT DEFAULT 'EUR',
  supplier TEXT,
  supplier_part_number TEXT,
  location TEXT, -- Storage location
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can view spare parts in their workspace"
  ON public.spare_parts FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create spare parts in their workspace"
  ON public.spare_parts FOR INSERT
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update spare parts in their workspace"
  ON public.spare_parts FOR UPDATE
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete spare parts in their workspace"
  ON public.spare_parts FOR DELETE
  USING (is_workspace_admin(auth.uid(), workspace_id));

-- Trigger for updated_at
CREATE TRIGGER update_spare_parts_updated_at
  BEFORE UPDATE ON public.spare_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_external_repairs_machine_id ON public.external_repairs(machine_id);
CREATE INDEX idx_external_repairs_workspace_id ON public.external_repairs(workspace_id);
CREATE INDEX idx_spare_parts_workspace_id ON public.spare_parts(workspace_id);
CREATE INDEX idx_repair_locations_workspace_id ON public.repair_locations(workspace_id);
-- Migration: 20260121061652_a9305782-8218-4912-b6dc-42108671ce95.sql
-- Table for AI conversation history per user
CREATE TABLE public.ai_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    workspace_id UUID NOT NULL,
    machine_id UUID,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for AI messages within conversations
CREATE TABLE public.ai_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    web_search_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for repair service providers (companies that offer repair services)
CREATE TABLE public.repair_service_providers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT false,
    company_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    website TEXT,
    description TEXT,
    supported_brands TEXT[] DEFAULT '{}',
    supported_categories TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- Table for repair requests from external clients
CREATE TABLE public.repair_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.repair_service_providers(id) ON DELETE CASCADE,
    client_email TEXT NOT NULL,
    client_name TEXT,
    client_phone TEXT,
    brand TEXT NOT NULL,
    model TEXT,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'in_progress', 'completed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;

-- RLS for ai_conversations - users can only access their own
CREATE POLICY "Users can view their own conversations"
ON public.ai_conversations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversations"
ON public.ai_conversations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations"
ON public.ai_conversations FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations"
ON public.ai_conversations FOR DELETE
USING (user_id = auth.uid());

-- RLS for ai_messages - via conversation ownership
CREATE POLICY "Users can view messages in their conversations"
ON public.ai_messages FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
    AND ai_conversations.user_id = auth.uid()
));

CREATE POLICY "Users can create messages in their conversations"
ON public.ai_messages FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
    AND ai_conversations.user_id = auth.uid()
));

CREATE POLICY "Users can delete messages in their conversations"
ON public.ai_messages FOR DELETE
USING (EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
    AND ai_conversations.user_id = auth.uid()
));

-- RLS for repair_service_providers
-- Anyone can view visible providers (for the public "where to repair" feature)
CREATE POLICY "Anyone can view visible providers"
ON public.repair_service_providers FOR SELECT
USING (is_visible = true);

-- Workspace admins can manage their own provider profile
CREATE POLICY "Workspace admins can manage their provider"
ON public.repair_service_providers FOR ALL
USING (is_workspace_admin(auth.uid(), workspace_id));

-- RLS for repair_requests
-- Providers can view requests sent to them
CREATE POLICY "Providers can view their requests"
ON public.repair_requests FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.repair_service_providers
    WHERE repair_service_providers.id = repair_requests.provider_id
    AND is_workspace_member(auth.uid(), repair_service_providers.workspace_id)
));

-- Anyone can create a repair request (public facing feature)
CREATE POLICY "Anyone can create repair requests"
ON public.repair_requests FOR INSERT
WITH CHECK (true);

-- Providers can update requests sent to them
CREATE POLICY "Providers can update their requests"
ON public.repair_requests FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.repair_service_providers
    WHERE repair_service_providers.id = repair_requests.provider_id
    AND is_workspace_member(auth.uid(), repair_service_providers.workspace_id)
));

-- Triggers for updated_at
CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repair_service_providers_updated_at
BEFORE UPDATE ON public.repair_service_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repair_requests_updated_at
BEFORE UPDATE ON public.repair_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260122062419_2718e085-a60a-454c-b652-74689082e0d9.sql
-- Create RPC function to find workspace by invite code without requiring membership
-- This solves the catch-22 where users can't query workspace to join because they're not members yet
CREATE OR REPLACE FUNCTION public.find_workspace_by_invite_code(_invite_code TEXT)
RETURNS TABLE (id UUID, name TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.id, w.name, w.created_at
  FROM public.workspaces w
  WHERE LOWER(w.invite_code) = LOWER(_invite_code)
  LIMIT 1;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.find_workspace_by_invite_code(TEXT) TO authenticated;
-- Migration: 20260124083203_243a80ee-becd-41a4-b1c9-7f17c432a6af.sql
-- Create table for custom workspace brands
CREATE TABLE public.workspace_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, category, brand_name)
);

-- Enable RLS
ALTER TABLE public.workspace_brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view brands in their workspace"
ON public.workspace_brands
FOR SELECT
USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create brands in their workspace"
ON public.workspace_brands
FOR INSERT
WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete their own brands"
ON public.workspace_brands
FOR DELETE
USING (created_by = auth.uid() OR is_workspace_admin(auth.uid(), workspace_id));

-- Add index for faster queries
CREATE INDEX idx_workspace_brands_workspace_category ON public.workspace_brands(workspace_id, category);
-- Migration: 20260125081912_96d8e3ec-d552-42ff-9a6f-fe2a1a5752de.sql
-- Add new machine statuses for rental/sale
-- Update the machines table to support rental/sale configurations

-- Create rental_sale_config table for machine pricing
CREATE TABLE public.rental_sale_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Availability flags
  available_for_rental BOOLEAN NOT NULL DEFAULT true,
  available_for_sale BOOLEAN NOT NULL DEFAULT false,
  
  -- Pricing
  daily_rental_price NUMERIC(10, 2),
  weekly_rental_price NUMERIC(10, 2),
  monthly_rental_price NUMERIC(10, 2),
  sale_price NUMERIC(10, 2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Notes
  rental_notes TEXT,
  sale_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  
  -- One config per machine
  UNIQUE(machine_id)
);

-- Create rental_transactions table to track active rentals and sales
CREATE TABLE public.rental_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Transaction type
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('rental', 'sale')),
  
  -- Client info
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_company TEXT,
  
  -- Dates
  start_date DATE NOT NULL,
  expected_end_date DATE,
  actual_end_date DATE,
  
  -- Financial
  agreed_price NUMERIC(10, 2) NOT NULL,
  deposit_amount NUMERIC(10, 2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Status: active, returned, completed, cancelled
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'completed', 'cancelled')),
  
  -- For sales - warranty tracking
  warranty_end_date DATE,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.rental_sale_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rental_sale_config
CREATE POLICY "Members can view rental config in their workspace"
  ON public.rental_sale_config FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create rental config in their workspace"
  ON public.rental_sale_config FOR INSERT
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update rental config in their workspace"
  ON public.rental_sale_config FOR UPDATE
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete rental config in their workspace"
  ON public.rental_sale_config FOR DELETE
  USING (is_workspace_admin(auth.uid(), workspace_id));

-- RLS Policies for rental_transactions
CREATE POLICY "Members can view transactions in their workspace"
  ON public.rental_transactions FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create transactions in their workspace"
  ON public.rental_transactions FOR INSERT
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update transactions in their workspace"
  ON public.rental_transactions FOR UPDATE
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete transactions in their workspace"
  ON public.rental_transactions FOR DELETE
  USING (is_workspace_admin(auth.uid(), workspace_id));

-- Create indexes for performance
CREATE INDEX idx_rental_config_workspace ON public.rental_sale_config(workspace_id);
CREATE INDEX idx_rental_config_machine ON public.rental_sale_config(machine_id);
CREATE INDEX idx_transactions_workspace ON public.rental_transactions(workspace_id);
CREATE INDEX idx_transactions_machine ON public.rental_transactions(machine_id);
CREATE INDEX idx_transactions_status ON public.rental_transactions(status);

-- Triggers for updated_at
CREATE TRIGGER update_rental_config_updated_at
  BEFORE UPDATE ON public.rental_sale_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_transactions_updated_at
  BEFORE UPDATE ON public.rental_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fix security: Update app_admins SELECT policy to require authentication
DROP POLICY IF EXISTS "App admins can view admin list" ON public.app_admins;
CREATE POLICY "Authenticated users can view admin list"
  ON public.app_admins FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Fix security: Ensure repair_requests cannot be read by anonymous users
-- The existing policy 'Providers can view their requests' should already restrict this
-- But we need to ensure there's no public read access
-- Add explicit denial for anonymous access by checking auth.uid() IS NOT NULL
DROP POLICY IF EXISTS "Providers can view their requests" ON public.repair_requests;
CREATE POLICY "Providers can view their requests"
  ON public.repair_requests FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM repair_service_providers
      WHERE repair_service_providers.id = repair_requests.provider_id
        AND is_workspace_member(auth.uid(), repair_service_providers.workspace_id)
    )
  );
-- Migration: 20260129055950_e733f580-5866-4347-92c9-cf7d00cc8ad4.sql
-- 1. Bucket pour les factures de réparation et vente
INSERT INTO storage.buckets (id, name, public) 
VALUES ('repair-invoices', 'repair-invoices', false);

-- 2. Politiques RLS pour le bucket - SELECT (voir les factures)
CREATE POLICY "Members can view invoices in their workspace" 
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'repair-invoices' AND
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND workspace_id::text = (storage.foldername(name))[1]
  )
);

-- 3. Politiques RLS pour le bucket - INSERT (uploader des factures)
CREATE POLICY "Members can upload invoices to their workspace" 
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'repair-invoices' AND
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND workspace_id::text = (storage.foldername(name))[1]
  )
);

-- 4. Politiques RLS pour le bucket - UPDATE (modifier des factures)
CREATE POLICY "Members can update invoices in their workspace" 
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'repair-invoices' AND
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND workspace_id::text = (storage.foldername(name))[1]
  )
);

-- 5. Politiques RLS pour le bucket - DELETE (admins seulement)
CREATE POLICY "Admins can delete invoices in their workspace" 
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'repair-invoices' AND
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND workspace_id::text = (storage.foldername(name))[1]
    AND role = 'admin'
  )
);

-- 6. Table knowledge_entries pour l'expertise partagée
CREATE TABLE public.knowledge_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  category text NOT NULL,
  brand text,
  model text,
  problem_description text NOT NULL,
  solution_description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Index pour recherche efficace
CREATE INDEX idx_knowledge_entries_workspace ON public.knowledge_entries(workspace_id);
CREATE INDEX idx_knowledge_entries_category ON public.knowledge_entries(category);
CREATE INDEX idx_knowledge_entries_brand ON public.knowledge_entries(brand);

-- 8. Enable RLS on knowledge_entries
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;

-- 9. RLS policies for knowledge_entries
CREATE POLICY "Members can view knowledge entries in their workspace" 
ON public.knowledge_entries FOR SELECT
USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create knowledge entries in their workspace" 
ON public.knowledge_entries FOR INSERT
WITH CHECK (is_workspace_member(auth.uid(), workspace_id) AND user_id = auth.uid());

CREATE POLICY "Members can update their own knowledge entries" 
ON public.knowledge_entries FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins can delete knowledge entries in their workspace" 
ON public.knowledge_entries FOR DELETE
USING (is_workspace_admin(auth.uid(), workspace_id) OR user_id = auth.uid());

-- 10. Trigger pour updated_at
CREATE TRIGGER update_knowledge_entries_updated_at
BEFORE UPDATE ON public.knowledge_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Colonne invoice_url sur rental_transactions
ALTER TABLE public.rental_transactions 
ADD COLUMN IF NOT EXISTS invoice_url text;

-- 12. Colonne invoice_url sur external_repairs pour les réparations externes
ALTER TABLE public.external_repairs 
ADD COLUMN IF NOT EXISTS invoice_url text;
-- Migration: 20260131080151_6797e73f-4e1c-4e04-b452-ba005ce32d26.sql
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
-- Migration: 20260131080316_b1eb40c1-d019-4ce1-8ced-e8ccb64428af.sql
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
-- Migration: 20260201181227_3923b940-b4d0-4f62-9a99-0258d6b5111d.sql
-- Create quote_requests table for storing client quote requests
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
  machine_name TEXT NOT NULL,
  machine_brand TEXT,
  machine_model TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  client_company TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN ('rental', 'sale', 'repair')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'accepted', 'rejected', 'cancelled')),
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can create quote requests (public form)
CREATE POLICY "Anyone can create quote requests"
ON public.quote_requests
FOR INSERT
WITH CHECK (true);

-- Workspace members can view quote requests for their workspace
CREATE POLICY "Members can view quote requests in their workspace"
ON public.quote_requests
FOR SELECT
USING (is_workspace_member(auth.uid(), workspace_id));

-- Workspace members can update quote requests in their workspace
CREATE POLICY "Members can update quote requests in their workspace"
ON public.quote_requests
FOR UPDATE
USING (is_workspace_member(auth.uid(), workspace_id));

-- Workspace admins can delete quote requests
CREATE POLICY "Admins can delete quote requests in their workspace"
ON public.quote_requests
FOR DELETE
USING (is_workspace_admin(auth.uid(), workspace_id));

-- Trigger for updated_at
CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_quote_requests_workspace_id ON public.quote_requests(workspace_id);
CREATE INDEX idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX idx_quote_requests_created_at ON public.quote_requests(created_at DESC);
-- Migration: 20260203061311_f73ac949-ff15-44c2-9e9c-1fd287c23b40.sql
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
-- Migration: 20260204214710_06f27e04-7a70-479e-b6fd-5890b2859069.sql
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
-- Migration: 20260218134649_21f6b2a8-f561-49cd-a54a-d9df198beb4f.sql

-- Allow anonymous read access to rental_sale_config for public catalog
CREATE POLICY "Public can view available rental/sale items"
ON public.rental_sale_config
FOR SELECT
TO anon
USING (
  available_for_rental = true OR available_for_sale = true
);

-- Allow anonymous read access to machines for public catalog (only operational, only safe fields via view)
CREATE POLICY "Public can view operational machines"
ON public.machines
FOR SELECT
TO anon
USING (status = 'operational');

-- Allow anonymous read access to workspaces basic info
CREATE POLICY "Public can view workspace info"
ON public.workspaces
FOR SELECT
TO anon
USING (true);

-- Allow anonymous read access to repair_service_providers for contact info
CREATE POLICY "Public can view visible repair providers"
ON public.repair_service_providers
FOR SELECT
TO anon
USING (is_visible = true);

-- Migration: 20260306131805_cc555428-3238-494c-ac7c-5c3c5144634a.sql

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

-- Migration: 20260306131859_c83007ab-dca0-45bc-84f6-72d291cd1625.sql

-- Restrict all remaining policies to authenticated role to eliminate anonymous access warnings

-- ai_conversations
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can create their own conversations" ON public.ai_conversations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can delete their own conversations" ON public.ai_conversations FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can update their own conversations" ON public.ai_conversations FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can view their own conversations" ON public.ai_conversations FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ai_messages
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.ai_messages;
CREATE POLICY "Users can create messages in their conversations" ON public.ai_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON public.ai_messages;
CREATE POLICY "Users can delete messages in their conversations" ON public.ai_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.ai_messages;
CREATE POLICY "Users can view messages in their conversations" ON public.ai_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid()));

-- app_admins
DROP POLICY IF EXISTS "Only app admins can manage admins" ON public.app_admins;
CREATE POLICY "Only app admins can manage admins" ON public.app_admins FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM app_admins a WHERE a.user_id = auth.uid()));

DROP POLICY IF EXISTS "Only app admins can view admin list" ON public.app_admins;
CREATE POLICY "Only app admins can view admin list" ON public.app_admins FOR SELECT TO authenticated USING (is_app_admin(auth.uid()));

-- diagnostic_entries
DROP POLICY IF EXISTS "Members can create entries for machines in their workspace" ON public.diagnostic_entries;
CREATE POLICY "Members can create entries for machines in their workspace" ON public.diagnostic_entries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM machines m WHERE m.id = diagnostic_entries.machine_id AND is_workspace_member(auth.uid(), m.workspace_id)));

DROP POLICY IF EXISTS "Members can delete entries they created or admins" ON public.diagnostic_entries;
CREATE POLICY "Members can delete entries they created or admins" ON public.diagnostic_entries FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM machines m WHERE m.id = diagnostic_entries.machine_id AND is_workspace_admin(auth.uid(), m.workspace_id)));

DROP POLICY IF EXISTS "Members can update entries they created" ON public.diagnostic_entries;
CREATE POLICY "Members can update entries they created" ON public.diagnostic_entries FOR UPDATE TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Members can view entries for machines in their workspace" ON public.diagnostic_entries;
CREATE POLICY "Members can view entries for machines in their workspace" ON public.diagnostic_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM machines m WHERE m.id = diagnostic_entries.machine_id AND is_workspace_member(auth.uid(), m.workspace_id)));

-- external_repairs
DROP POLICY IF EXISTS "Admins can delete external repairs in their workspace" ON public.external_repairs;
CREATE POLICY "Admins can delete external repairs in their workspace" ON public.external_repairs FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can create external repairs in their workspace" ON public.external_repairs;
CREATE POLICY "Members can create external repairs in their workspace" ON public.external_repairs FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can update external repairs in their workspace" ON public.external_repairs;
CREATE POLICY "Members can update external repairs in their workspace" ON public.external_repairs FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view external repairs in their workspace" ON public.external_repairs;
CREATE POLICY "Members can view external repairs in their workspace" ON public.external_repairs FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- knowledge_entries
DROP POLICY IF EXISTS "Admins can delete knowledge entries in their workspace" ON public.knowledge_entries;
CREATE POLICY "Admins can delete knowledge entries in their workspace" ON public.knowledge_entries FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Members can create knowledge entries in their workspace" ON public.knowledge_entries;
CREATE POLICY "Members can create knowledge entries in their workspace" ON public.knowledge_entries FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id) AND user_id = auth.uid());

DROP POLICY IF EXISTS "Members can update their own knowledge entries" ON public.knowledge_entries;
CREATE POLICY "Members can update their own knowledge entries" ON public.knowledge_entries FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Members can view knowledge entries in their workspace" ON public.knowledge_entries;
CREATE POLICY "Members can view knowledge entries in their workspace" ON public.knowledge_entries FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- maintenance_schedules
DROP POLICY IF EXISTS "Admins can delete maintenance schedules in their workspace" ON public.maintenance_schedules;
CREATE POLICY "Admins can delete maintenance schedules in their workspace" ON public.maintenance_schedules FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "App admins can manage all maintenance schedules" ON public.maintenance_schedules;
CREATE POLICY "App admins can manage all maintenance schedules" ON public.maintenance_schedules FOR ALL TO authenticated USING (is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Members can create maintenance schedules in their workspace" ON public.maintenance_schedules;
CREATE POLICY "Members can create maintenance schedules in their workspace" ON public.maintenance_schedules FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can update maintenance schedules in their workspace" ON public.maintenance_schedules;
CREATE POLICY "Members can update maintenance schedules in their workspace" ON public.maintenance_schedules FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view maintenance schedules in their workspace" ON public.maintenance_schedules;
CREATE POLICY "Members can view maintenance schedules in their workspace" ON public.maintenance_schedules FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- notification_preferences
DROP POLICY IF EXISTS "Users can create their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can create their own notification preferences" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Users can delete their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can delete their own notification preferences" ON public.notification_preferences FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());

-- pending_sync
DROP POLICY IF EXISTS "Users can create pending sync with validated workspace" ON public.pending_sync;
CREATE POLICY "Users can create pending sync with validated workspace" ON public.pending_sync FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_workspace_member(auth.uid(), workspace_id) AND ((data->>'workspace_id') IS NULL OR ((data->>'workspace_id')::uuid = workspace_id)));

DROP POLICY IF EXISTS "Users can delete their pending sync" ON public.pending_sync;
CREATE POLICY "Users can delete their pending sync" ON public.pending_sync FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their pending sync" ON public.pending_sync;
CREATE POLICY "Users can update their pending sync" ON public.pending_sync FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their pending sync" ON public.pending_sync;
CREATE POLICY "Users can view their pending sync" ON public.pending_sync FOR SELECT TO authenticated USING (user_id = auth.uid());

-- quote_requests
DROP POLICY IF EXISTS "Admins can delete quote requests in their workspace" ON public.quote_requests;
CREATE POLICY "Admins can delete quote requests in their workspace" ON public.quote_requests FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Admins can update quote requests in their workspace" ON public.quote_requests;
CREATE POLICY "Admins can update quote requests in their workspace" ON public.quote_requests FOR UPDATE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Admins can view quote requests in their workspace" ON public.quote_requests;
CREATE POLICY "Admins can view quote requests in their workspace" ON public.quote_requests FOR SELECT TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

-- scan_history
DROP POLICY IF EXISTS "Admins can delete scan history in their workspace" ON public.scan_history;
CREATE POLICY "Admins can delete scan history in their workspace" ON public.scan_history FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can create scan history in their workspace" ON public.scan_history;
CREATE POLICY "Members can create scan history in their workspace" ON public.scan_history FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view scan history in their workspace" ON public.scan_history;
CREATE POLICY "Members can view scan history in their workspace" ON public.scan_history FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- spare_parts
DROP POLICY IF EXISTS "Admins can delete spare parts in their workspace" ON public.spare_parts;
CREATE POLICY "Admins can delete spare parts in their workspace" ON public.spare_parts FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can create spare parts in their workspace" ON public.spare_parts;
CREATE POLICY "Members can create spare parts in their workspace" ON public.spare_parts FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can update spare parts in their workspace" ON public.spare_parts;
CREATE POLICY "Members can update spare parts in their workspace" ON public.spare_parts FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view spare parts in their workspace" ON public.spare_parts;
CREATE POLICY "Members can view spare parts in their workspace" ON public.spare_parts FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- team_members
DROP POLICY IF EXISTS "Admins can delete team members in their workspace" ON public.team_members;
CREATE POLICY "Admins can delete team members in their workspace" ON public.team_members FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can add team members to their workspace" ON public.team_members;
CREATE POLICY "Members can add team members to their workspace" ON public.team_members FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can update team members in their workspace" ON public.team_members;
CREATE POLICY "Members can update team members in their workspace" ON public.team_members FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view team in their workspace" ON public.team_members;
CREATE POLICY "Members can view team in their workspace" ON public.team_members FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- workspace_brands
DROP POLICY IF EXISTS "Members can create brands in their workspace" ON public.workspace_brands;
CREATE POLICY "Members can create brands in their workspace" ON public.workspace_brands FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can delete their own brands" ON public.workspace_brands;
CREATE POLICY "Members can delete their own brands" ON public.workspace_brands FOR DELETE TO authenticated USING (created_by = auth.uid() OR is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view brands in their workspace" ON public.workspace_brands;
CREATE POLICY "Members can view brands in their workspace" ON public.workspace_brands FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- workspace_members
DROP POLICY IF EXISTS "Admins can remove members from their workspace" ON public.workspace_members;
CREATE POLICY "Admins can remove members from their workspace" ON public.workspace_members FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update members in their workspace" ON public.workspace_members;
CREATE POLICY "Admins can update members in their workspace" ON public.workspace_members FOR UPDATE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view other members in their workspace" ON public.workspace_members;
CREATE POLICY "Members can view other members in their workspace" ON public.workspace_members FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Users can join workspace with invite code" ON public.workspace_members;
CREATE POLICY "Users can join workspace with invite code" ON public.workspace_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- workspace_settings
DROP POLICY IF EXISTS "Admins can insert settings for their workspace" ON public.workspace_settings;
CREATE POLICY "Admins can insert settings for their workspace" ON public.workspace_settings FOR INSERT TO authenticated WITH CHECK (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Admins can update settings in their workspace" ON public.workspace_settings;
CREATE POLICY "Admins can update settings in their workspace" ON public.workspace_settings FOR UPDATE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view settings in their workspace" ON public.workspace_settings;
CREATE POLICY "Members can view settings in their workspace" ON public.workspace_settings FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- repair_requests
DROP POLICY IF EXISTS "Only workspace members can view repair requests" ON public.repair_requests;
CREATE POLICY "Only workspace members can view repair requests" ON public.repair_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM repair_service_providers rsp WHERE rsp.id = repair_requests.provider_id AND is_workspace_member(auth.uid(), rsp.workspace_id)));

DROP POLICY IF EXISTS "Providers can update their requests" ON public.repair_requests;
CREATE POLICY "Providers can update their requests" ON public.repair_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM repair_service_providers WHERE repair_service_providers.id = repair_requests.provider_id AND is_workspace_member(auth.uid(), repair_service_providers.workspace_id)));

DROP POLICY IF EXISTS "Providers can view their requests" ON public.repair_requests;
CREATE POLICY "Providers can view their requests" ON public.repair_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM repair_service_providers WHERE repair_service_providers.id = repair_requests.provider_id AND is_workspace_member(auth.uid(), repair_service_providers.workspace_id)));

DROP POLICY IF EXISTS "Workspace admins can delete repair requests" ON public.repair_requests;
CREATE POLICY "Workspace admins can delete repair requests" ON public.repair_requests FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM repair_service_providers rsp WHERE rsp.id = repair_requests.provider_id AND is_workspace_admin(auth.uid(), rsp.workspace_id)));

-- repair_locations
DROP POLICY IF EXISTS "Admins can delete repair locations in their workspace" ON public.repair_locations;
CREATE POLICY "Admins can delete repair locations in their workspace" ON public.repair_locations FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can create repair locations in their workspace" ON public.repair_locations;
CREATE POLICY "Members can create repair locations in their workspace" ON public.repair_locations FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can update repair locations in their workspace" ON public.repair_locations;
CREATE POLICY "Members can update repair locations in their workspace" ON public.repair_locations FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view repair locations in their workspace" ON public.repair_locations;
CREATE POLICY "Members can view repair locations in their workspace" ON public.repair_locations FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- rental_transactions
DROP POLICY IF EXISTS "Admins can delete transactions in their workspace" ON public.rental_transactions;
CREATE POLICY "Admins can delete transactions in their workspace" ON public.rental_transactions FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can create transactions in their workspace" ON public.rental_transactions;
CREATE POLICY "Members can create transactions in their workspace" ON public.rental_transactions FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can update transactions in their workspace" ON public.rental_transactions;
CREATE POLICY "Members can update transactions in their workspace" ON public.rental_transactions FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view transactions in their workspace" ON public.rental_transactions;
CREATE POLICY "Members can view transactions in their workspace" ON public.rental_transactions FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- Migration: 20260306132727_da84356f-7334-4f3f-a35b-a5e1193dc0e5.sql

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

-- Migration: 20260306132841_5dd5d511-a336-492d-bf10-d86949dc46e2.sql

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

-- Migration: 20260306142728_15ba4d8f-a689-4321-8c48-ada5064f8464.sql

ALTER TABLE public.workspace_settings
  ADD COLUMN IF NOT EXISTS guest_link_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_show_catalog boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS guest_show_repair_request boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_show_maintenance_request boolean NOT NULL DEFAULT false;

-- Migration: 20260306154631_57b011ae-bfcf-4c33-99d5-24ba243a2912.sql
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
-- Migration: 20260306154809_0d9e4f26-a5fa-4d01-a411-5b4385cb4e26.sql
-- Fix: Restrict repair_service_providers to workspace members only
-- Public access now goes through the public-providers edge function
DROP POLICY IF EXISTS "Authenticated users can view visible providers" ON public.repair_service_providers;

CREATE POLICY "Workspace members can view visible providers"
ON public.repair_service_providers
FOR SELECT
TO authenticated
USING (is_workspace_member(auth.uid(), workspace_id) OR (is_visible = true AND is_workspace_member(auth.uid(), workspace_id)));

-- Fix: workspaces_public view - enable RLS
-- Note: workspaces_public is a VIEW, we need to check if RLS can be enabled
-- Views inherit RLS from underlying tables, so this should already be protected
-- But let's restrict direct access
ALTER VIEW public.workspaces_public SET (security_invoker = true);
-- Migration: 20260306154819_54970096-cb03-492e-aa0e-12c757a80224.sql
-- Simplify: the OR condition was redundant, just use workspace membership
DROP POLICY IF EXISTS "Workspace members can view visible providers" ON public.repair_service_providers;

CREATE POLICY "Workspace members can view providers in their workspace"
ON public.repair_service_providers
FOR SELECT
TO authenticated
USING (is_workspace_member(auth.uid(), workspace_id));
