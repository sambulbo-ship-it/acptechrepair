import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WorkspaceBranding {
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
}

const defaultBranding: WorkspaceBranding = {
  logo_url: null,
  primary_color: '#f97316',
  secondary_color: '#1a1a2e',
};

export const useWorkspaceBranding = () => {
  const { currentWorkspace, isWorkspaceAdmin } = useAuth();
  const [branding, setBranding] = useState<WorkspaceBranding>(defaultBranding);
  const [loading, setLoading] = useState(true);

  const fetchBranding = useCallback(async () => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('logo_url, primary_color, secondary_color')
        .eq('id', currentWorkspace.id)
        .single();

      if (error) throw error;

      if (data) {
        setBranding({
          logo_url: data.logo_url || null,
          primary_color: data.primary_color || defaultBranding.primary_color,
          secondary_color: data.secondary_color || defaultBranding.secondary_color,
        });
      }
    } catch (err) {
      console.error('Error fetching workspace branding:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  // Apply branding to CSS variables
  useEffect(() => {
    if (branding.primary_color) {
      const hsl = hexToHSL(branding.primary_color);
      if (hsl) {
        document.documentElement.style.setProperty('--primary', hsl);
        document.documentElement.style.setProperty('--accent', hsl);
        document.documentElement.style.setProperty('--ring', hsl);
      }
    }
  }, [branding.primary_color]);

  const updateBranding = useCallback(async (updates: Partial<WorkspaceBranding>): Promise<boolean> => {
    if (!currentWorkspace || !isWorkspaceAdmin) {
      toast.error('Seuls les administrateurs peuvent modifier le branding');
      return false;
    }

    try {
      const { error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', currentWorkspace.id);

      if (error) throw error;

      setBranding(prev => ({ ...prev, ...updates }));
      toast.success('Branding mis à jour');
      return true;
    } catch (err) {
      console.error('Error updating branding:', err);
      toast.error('Erreur lors de la mise à jour du branding');
      return false;
    }
  }, [currentWorkspace, isWorkspaceAdmin]);

  return {
    branding,
    loading,
    updateBranding,
    isAdmin: isWorkspaceAdmin,
    refetch: fetchBranding,
  };
};

// Helper function to convert hex to HSL string
function hexToHSL(hex: string): string | null {
  try {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch {
    return null;
  }
}
