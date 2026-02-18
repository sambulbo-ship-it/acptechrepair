import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

      // Resolve workspace ID from invite code if needed
      let resolvedWorkspaceId = workspaceId;

      if (!resolvedWorkspaceId && inviteCode) {
        const { data: wsData, error: wsError } = await supabase
          .rpc('find_workspace_by_invite_code', { _invite_code: inviteCode });

        if (wsError || !wsData?.length) {
          setError('Code d\'invitation invalide');
          setLoading(false);
          return;
        }
        resolvedWorkspaceId = wsData[0].id;
      }

      if (!resolvedWorkspaceId) {
        setError('Workspace non trouvé');
        setLoading(false);
        return;
      }

      // Fetch catalog items directly from DB (anon RLS allows this)
      const { data: catalogItems, error: dbError } = await supabase
        .from('rental_sale_config')
        .select(`
          id, available_for_rental, available_for_sale,
          daily_rental_price, weekly_rental_price, monthly_rental_price,
          sale_price, currency, rental_notes, sale_notes,
          machine_id, workspace_id,
          machines!inner ( id, name, brand, model, category, photos, status ),
          workspaces!inner ( id, name, logo_url, primary_color )
        `)
        .eq('workspace_id', resolvedWorkspaceId)
        .or('available_for_rental.eq.true,available_for_sale.eq.true')
        .eq('machines.status', 'operational');

      if (dbError) throw dbError;

      // Get contact info
      const { data: provider } = await supabase
        .from('repair_service_providers')
        .select('contact_email, phone')
        .eq('workspace_id', resolvedWorkspaceId)
        .eq('is_visible', true)
        .limit(1)
        .single();

      // Get workspace info
      const { data: wsInfo } = await supabase
        .from('workspaces')
        .select('name, logo_url, primary_color')
        .eq('id', resolvedWorkspaceId)
        .single();

      const machinesList: CatalogMachine[] = (catalogItems || []).map((item: any) => {
        const m = item.machines;
        const w = item.workspaces;
        return {
          id: m.id,
          name: m.name,
          brand: m.brand,
          model: m.model,
          category: m.category,
          photos: m.photos,
          workspace_id: w.id,
          workspace_name: w.name,
          workspace_logo: w.logo_url,
          workspace_primary_color: w.primary_color,
          workspace_contact_email: provider?.contact_email || null,
          workspace_phone: provider?.phone || null,
          available_for_rental: item.available_for_rental,
          available_for_sale: item.available_for_sale,
          daily_rental_price: item.daily_rental_price,
          weekly_rental_price: item.weekly_rental_price,
          monthly_rental_price: item.monthly_rental_price,
          sale_price: item.sale_price,
          currency: item.currency,
          in_stock: true,
          condition: (item.sale_notes?.toLowerCase().includes('neuf') || item.sale_notes?.toLowerCase().includes('new'))
            ? 'new' as const
            : (item.sale_notes?.toLowerCase().includes('occasion') || item.sale_notes?.toLowerCase().includes('used'))
              ? 'used' as const
              : 'unspecified' as const,
          rental_notes: item.available_for_rental ? item.rental_notes : null,
          sale_notes: item.available_for_sale ? item.sale_notes : null,
        };
      });

      setMachines(machinesList);

      if (wsInfo) {
        setWorkspace({
          name: wsInfo.name,
          logo_url: wsInfo.logo_url,
          primary_color: wsInfo.primary_color,
          contact_email: provider?.contact_email || null,
          phone: provider?.phone || null,
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
