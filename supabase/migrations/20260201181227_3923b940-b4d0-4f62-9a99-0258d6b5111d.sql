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