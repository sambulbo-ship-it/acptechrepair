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