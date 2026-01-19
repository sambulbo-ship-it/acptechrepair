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