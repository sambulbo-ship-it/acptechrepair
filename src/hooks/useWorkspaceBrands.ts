import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { equipmentCategories, EquipmentCategory } from '@/data/equipmentData';
import { toast } from 'sonner';

interface WorkspaceBrand {
  id: string;
  workspace_id: string;
  category: string;
  brand_name: string;
  created_by: string | null;
  created_at: string;
}

export const useWorkspaceBrands = () => {
  const { currentWorkspace, user } = useAuth();
  const [customBrands, setCustomBrands] = useState<WorkspaceBrand[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCustomBrands = useCallback(async () => {
    if (!currentWorkspace) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_brands')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('brand_name');

      if (error) throw error;
      setCustomBrands(data || []);
    } catch (error) {
      console.error('Error loading custom brands:', error);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    loadCustomBrands();
  }, [loadCustomBrands]);

  const addCustomBrand = async (category: EquipmentCategory, brandName: string) => {
    if (!currentWorkspace || !user) return false;

    const trimmedName = brandName.trim();
    if (!trimmedName) return false;

    // Check if brand already exists (default or custom)
    const defaultBrands = getBrandsForCategory(category);
    if (defaultBrands.some(b => b.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error('Cette marque existe déjà');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('workspace_brands')
        .insert({
          workspace_id: currentWorkspace.id,
          category,
          brand_name: trimmedName,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Cette marque existe déjà pour cette catégorie');
        } else {
          throw error;
        }
        return false;
      }

      setCustomBrands(prev => [...prev, data]);
      toast.success('Marque ajoutée');
      return true;
    } catch (error) {
      console.error('Error adding custom brand:', error);
      toast.error("Erreur lors de l'ajout de la marque");
      return false;
    }
  };

  const removeCustomBrand = async (brandId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_brands')
        .delete()
        .eq('id', brandId);

      if (error) throw error;

      setCustomBrands(prev => prev.filter(b => b.id !== brandId));
      toast.success('Marque supprimée');
      return true;
    } catch (error) {
      console.error('Error removing custom brand:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  };

  const getBrandsForCategory = (category: EquipmentCategory): string[] => {
    const categoryInfo = equipmentCategories.find(c => c.id === category);
    const defaultBrands = categoryInfo?.brands || ['Other'];
    
    // Get custom brands for this category
    const categoryCustomBrands = customBrands
      .filter(b => b.category === category)
      .map(b => b.brand_name);

    // Merge and sort, keeping "Other" at the end
    const allBrands = [
      ...defaultBrands.filter(b => b !== 'Other'),
      ...categoryCustomBrands,
    ].sort((a, b) => a.localeCompare(b));

    // Add "Other" at the end if it exists in defaults
    if (defaultBrands.includes('Other')) {
      allBrands.push('Other');
    }

    return [...new Set(allBrands)]; // Remove duplicates
  };

  const getCustomBrandsForCategory = (category: EquipmentCategory): WorkspaceBrand[] => {
    return customBrands.filter(b => b.category === category);
  };

  return {
    customBrands,
    loading,
    addCustomBrand,
    removeCustomBrand,
    getBrandsForCategory,
    getCustomBrandsForCategory,
    refresh: loadCustomBrands,
  };
};
