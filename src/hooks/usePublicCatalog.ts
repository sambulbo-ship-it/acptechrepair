import { useState, useEffect, useCallback } from 'react';
import type { CatalogMachine } from '@/components/catalog';

interface WorkspaceInfo {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  contact_email: string | null;
  phone: string | null;
}

interface UsePublicCatalogResult {
  machines: CatalogMachine[];
  workspace: WorkspaceInfo | null;
  resolvedWorkspaceId: string | null;
  loading: boolean;
  error: string | null;
  noCode: boolean;
  refresh: () => Promise<void>;
}

export const usePublicCatalog = (
  workspaceId: string | null,
  inviteCode: string | null
): UsePublicCatalogResult => {
  const [machines, setMachines] = useState<CatalogMachine[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noCode, setNoCode] = useState(false);

  const loadCatalog = useCallback(async () => {
    if (!workspaceId && !inviteCode) {
      setNoCode(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use edge function for public catalog access (no direct DB queries needed)
      const params = new URLSearchParams({ format: 'json' });
      if (workspaceId) params.set('workspace_id', workspaceId);
      if (inviteCode) params.set('invite_code', inviteCode);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-catalog?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du chargement du catalogue');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      // Map the response to CatalogMachine format
      const machinesList: CatalogMachine[] = (data.machines || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        brand: m.brand,
        model: m.model,
        category: m.category,
        photos: m.photos,
        workspace_id: '', // Don't expose internal IDs
        workspace_name: m.workspace_name,
        workspace_logo: m.workspace_logo,
        workspace_contact_email: m.workspace_contact_email,
        workspace_phone: m.workspace_phone,
        available_for_rental: m.available_for_rental,
        available_for_sale: m.available_for_sale,
        daily_rental_price: m.daily_rental_price,
        weekly_rental_price: m.weekly_rental_price,
        monthly_rental_price: m.monthly_rental_price,
        sale_price: m.sale_price,
        currency: m.currency,
        in_stock: m.in_stock,
        condition: (m.sale_notes?.toLowerCase().includes('neuf') || m.sale_notes?.toLowerCase().includes('new'))
          ? 'new' as const
          : (m.sale_notes?.toLowerCase().includes('occasion') || m.sale_notes?.toLowerCase().includes('used'))
            ? 'used' as const
            : 'unspecified' as const,
        rental_notes: m.rental_notes,
        sale_notes: m.sale_notes,
      }));

      setMachines(machinesList);

      if (data.workspace) {
        setWorkspace({
          name: data.workspace.name,
          logo_url: data.workspace.logo_url,
          primary_color: data.workspace.primary_color,
          contact_email: data.workspace.contact_email,
          phone: data.workspace.phone,
        });
      }
    } catch (err) {
      console.error('Error loading catalog:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, inviteCode]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  return {
    machines,
    workspace,
    loading,
    error,
    noCode,
    refresh: loadCatalog,
  };
};
