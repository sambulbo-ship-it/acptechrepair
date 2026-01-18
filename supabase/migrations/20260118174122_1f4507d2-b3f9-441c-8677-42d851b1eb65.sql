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