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