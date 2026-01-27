import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ScanResult {
  detected: boolean;
  brand?: string;
  model?: string;
  serial_number?: string;
  category?: string;
  confidence: number;
  existing_machine?: {
    id: string;
    name: string;
    brand: string;
    model: string;
    serial_number: string;
  };
  raw_text?: string;
}

export const useAIProductScanner = () => {
  const { currentWorkspace } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanProduct = useCallback(async (images: string[]): Promise<ScanResult | null> => {
    if (!currentWorkspace) {
      setError('No workspace selected');
      return null;
    }

    if (images.length === 0) {
      setError('At least one image is required');
      return null;
    }

    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-product-scanner`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images,
            workspace_id: currentWorkspace.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scan failed');
      }

      const scanResult: ScanResult = await response.json();
      setResult(scanResult);
      return scanResult;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setScanning(false);
    }
  }, [currentWorkspace]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setScanning(false);
  }, []);

  return {
    scanProduct,
    scanning,
    result,
    error,
    reset,
  };
};
