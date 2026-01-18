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