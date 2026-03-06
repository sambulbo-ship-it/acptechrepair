
ALTER TABLE public.workspace_settings
  ADD COLUMN IF NOT EXISTS guest_link_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_show_catalog boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS guest_show_repair_request boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_show_maintenance_request boolean NOT NULL DEFAULT false;
