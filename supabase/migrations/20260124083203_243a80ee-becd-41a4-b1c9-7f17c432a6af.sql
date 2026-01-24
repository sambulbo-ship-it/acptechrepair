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