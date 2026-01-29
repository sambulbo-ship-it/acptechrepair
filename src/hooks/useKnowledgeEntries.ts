import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface KnowledgeEntry {
  id: string;
  workspace_id: string;
  user_id: string;
  category: string;
  brand: string | null;
  model: string | null;
  problem_description: string;
  solution_description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateKnowledgeEntry {
  category: string;
  brand?: string;
  model?: string;
  problem_description: string;
  solution_description: string;
}

export function useKnowledgeEntries() {
  const { user, currentWorkspace } = useAuth();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    if (!currentWorkspace) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      // Query knowledge_entries table - use fetch to avoid type issues with new table
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/knowledge_entries?workspace_id=eq.${currentWorkspace.id}&order=created_at.desc`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session?.session?.access_token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setEntries(data as KnowledgeEntry[]);
    } catch (error) {
      console.error('Error loading knowledge entries:', error);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const createEntry = useCallback(async (entry: CreateKnowledgeEntry): Promise<boolean> => {
    if (!user || !currentWorkspace) {
      toast.error('Vous devez être connecté');
      return false;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/knowledge_entries`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session?.session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            workspace_id: currentWorkspace.id,
            user_id: user.id,
            category: entry.category,
            brand: entry.brand || null,
            model: entry.model || null,
            problem_description: entry.problem_description,
            solution_description: entry.solution_description,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to create');

      toast.success('Expertise partagée avec succès');
      await loadEntries();
      return true;
    } catch (error) {
      console.error('Error creating knowledge entry:', error);
      toast.error('Erreur lors du partage');
      return false;
    }
  }, [user, currentWorkspace, loadEntries]);

  const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/knowledge_entries?id=eq.${id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session?.session?.access_token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Entrée supprimée');
      setEntries(prev => prev.filter(e => e.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting knowledge entry:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }, []);

  return {
    entries,
    loading,
    createEntry,
    deleteEntry,
    refresh: loadEntries,
  };
}
