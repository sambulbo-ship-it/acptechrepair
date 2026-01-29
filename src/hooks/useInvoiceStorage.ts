import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useInvoiceStorage() {
  const { currentWorkspace } = useAuth();
  const [uploading, setUploading] = useState(false);

  const uploadInvoice = useCallback(async (
    file: File,
    transactionId: string,
    type: 'rental' | 'sale' | 'external-repair' = 'sale'
  ): Promise<string | null> => {
    if (!currentWorkspace) {
      toast.error('Espace de travail non sélectionné');
      return null;
    }

    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés');
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 10MB)');
      return null;
    }

    setUploading(true);

    try {
      // Create unique filename with workspace folder structure
      const timestamp = Date.now();
      const fileName = `${currentWorkspace.id}/${type}/${transactionId}_${timestamp}.pdf`;

      const { data, error } = await supabase.storage
        .from('repair-invoices')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Return the path (not public URL since bucket is private)
      return data.path;
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error('Erreur lors du téléchargement de la facture');
      return null;
    } finally {
      setUploading(false);
    }
  }, [currentWorkspace]);

  const getInvoiceUrl = useCallback(async (path: string): Promise<string | null> => {
    if (!path) return null;

    try {
      // Create a signed URL for private bucket access (valid for 1 hour)
      const { data, error } = await supabase.storage
        .from('repair-invoices')
        .createSignedUrl(path, 3600);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting invoice URL:', error);
      return null;
    }
  }, []);

  const deleteInvoice = useCallback(async (path: string): Promise<boolean> => {
    if (!path) return false;

    try {
      const { error } = await supabase.storage
        .from('repair-invoices')
        .remove([path]);

      if (error) throw error;
      toast.success('Facture supprimée');
      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }, []);

  const downloadInvoice = useCallback(async (path: string, fileName?: string): Promise<void> => {
    const url = await getInvoiceUrl(path);
    if (!url) {
      toast.error('Impossible de récupérer la facture');
      return;
    }

    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'facture.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [getInvoiceUrl]);

  return {
    uploading,
    uploadInvoice,
    getInvoiceUrl,
    deleteInvoice,
    downloadInvoice,
  };
}
