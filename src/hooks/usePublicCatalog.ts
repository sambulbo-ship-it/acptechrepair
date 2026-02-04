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
      
      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.set('format', 'json'); // Explicitly request JSON
      
      if (workspaceId) {
        queryParams.set('workspace_id', workspaceId);
      } else if (inviteCode) {
        queryParams.set('invite_code', inviteCode);
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-catalog?${queryParams.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load catalog');
      }

      const data = await response.json();
      setMachines(data.machines || []);
      
      if (data.workspace) {
        setWorkspace(data.workspace);
      }
    } catch (err) {
      console.error('Error loading catalog:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
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
