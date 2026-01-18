import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScanLine, X, Camera, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
}

export const BarcodeScanner = ({ onScan }: BarcodeScannerProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'barcode-scanner-container';

  const startScanner = async () => {
    setError(null);
    
    try {
      // Check camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(track => track.stop());
      
      // Initialize scanner
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.5,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Success callback
          console.log('Scanned:', decodedText);
          onScan(decodedText);
          stopScanner();
          setIsOpen(false);
          toast.success(language === 'fr' ? `Code scanné: ${decodedText}` : `Scanned: ${decodedText}`);
        },
        (errorMessage) => {
          // Error callback - silently ignore scanning errors
          console.debug('Scan error:', errorMessage);
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Scanner initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      if (errorMessage.includes('Permission') || errorMessage.includes('NotAllowedError')) {
        setError(language === 'fr' 
          ? 'Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres.'
          : 'Camera access denied. Please allow access in settings.');
      } else if (errorMessage.includes('NotFoundError')) {
        setError(language === 'fr'
          ? 'Aucune caméra trouvée sur cet appareil.'
          : 'No camera found on this device.');
      } else {
        setError(language === 'fr'
          ? 'Erreur lors de l\'initialisation du scanner.'
          : 'Error initializing scanner.');
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
    scannerRef.current = null;
  };

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0" aria-label={language === 'fr' ? 'Scanner un code-barres' : 'Scan barcode'}>
          <ScanLine className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {language === 'fr' ? 'Scanner un code-barres' : 'Scan Barcode'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full aspect-[4/3] bg-black overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-destructive/10">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <p className="text-sm text-destructive">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => {
                  setError(null);
                  startScanner();
                }}
              >
                {language === 'fr' ? 'Réessayer' : 'Retry'}
              </Button>
            </div>
          ) : (
            <>
              <div id={scannerContainerId} className="w-full h-full" />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40 border-2 border-primary rounded-lg bg-transparent" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}>
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  
                  {/* Scanning line animation */}
                  <div className="absolute left-2 right-2 h-0.5 bg-primary animate-pulse" style={{ animation: 'scan 2s linear infinite' }} />
                </div>
              </div>
              
              {!isScanning && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {language === 'fr' 
              ? 'Placez le code-barres dans le cadre pour le scanner'
              : 'Position the barcode within the frame to scan'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
