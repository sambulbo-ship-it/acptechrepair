import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIProductScanner } from '@/hooks/useAIProductScanner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, Upload, Loader2, Sparkles, Check, AlertTriangle, X, RotateCcw, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AIProductScannerProps {
  onProductDetected?: (data: {
    brand?: string;
    model?: string;
    serial_number?: string;
    category?: string;
  }) => void;
  onExistingProductFound?: (machineId: string) => void;
  /** If true, shows a "Create new product" button when product is detected */
  showCreateButton?: boolean;
}

export const AIProductScanner = ({ onProductDetected, onExistingProductFound, showCreateButton = true }: AIProductScannerProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { scanProduct, scanning, result, error, reset } = useAIProductScanner();
  
  const [isOpen, setIsOpen] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      toast.error(language === 'fr' ? 'Impossible d\'accéder à la caméra' : 'Unable to access camera');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImages(prev => [...prev, dataUrl]);
      
      if (capturedImages.length >= 1) {
        // After 2nd photo, stop camera
        stopCamera();
      }
    }
  }, [capturedImages.length]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setCapturedImages(prev => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleScan = async () => {
    if (capturedImages.length === 0) {
      toast.error(language === 'fr' ? 'Prenez au moins une photo' : 'Take at least one photo');
      return;
    }

    const scanResult = await scanProduct(capturedImages);
    
    if (scanResult?.existing_machine) {
      toast.success(
        language === 'fr' 
          ? `Produit trouvé : ${scanResult.existing_machine.name}`
          : `Product found: ${scanResult.existing_machine.name}`
      );
    } else if (scanResult?.detected) {
      toast.success(
        language === 'fr'
          ? `Produit détecté : ${scanResult.brand} ${scanResult.model}`
          : `Product detected: ${scanResult.brand} ${scanResult.model}`
      );
    }
  };

  const handleApplyResult = () => {
    if (!result) return;

    if (result.existing_machine && onExistingProductFound) {
      onExistingProductFound(result.existing_machine.id);
      handleClose();
    } else if (result.detected && onProductDetected) {
      onProductDetected({
        brand: result.brand,
        model: result.model,
        serial_number: result.serial_number,
        category: result.category,
      });
      handleClose();
    }
  };

  const handleCreateNewProduct = () => {
    if (!result?.detected) return;
    
    // Build query params with detected data
    const params = new URLSearchParams();
    if (result.brand) params.set('brand', result.brand);
    if (result.model) params.set('model', result.model);
    if (result.serial_number) params.set('serial', result.serial_number);
    if (result.category) params.set('category', result.category);
    
    handleClose();
    navigate(`/add?${params.toString()}`);
  };

  const handleViewExisting = () => {
    if (result?.existing_machine) {
      handleClose();
      navigate(`/machine/${result.existing_machine.id}`);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImages([]);
    reset();
    setIsOpen(false);
  };

  const handleReset = () => {
    setCapturedImages([]);
    reset();
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="glass-button shrink-0"
        onClick={() => setIsOpen(true)}
        aria-label={language === 'fr' ? 'Scanner IA' : 'AI Scanner'}
      >
        <Sparkles className="w-5 h-5 text-primary" />
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="glass-dialog max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {language === 'fr' ? 'Scanner IA' : 'AI Scanner'}
            </DialogTitle>
            <DialogDescription>
              {language === 'fr' 
                ? 'Prenez une photo recto/verso du produit pour l\'identifier automatiquement'
                : 'Take front/back photos of the product for automatic identification'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Camera/Preview Area */}
            {cameraActive ? (
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                  <Button 
                    onClick={capturePhoto}
                    className="rounded-full w-16 h-16 bg-white hover:bg-white/90"
                  >
                    <div className="w-12 h-12 rounded-full border-4 border-primary" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-white"
                  onClick={stopCamera}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            ) : capturedImages.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {capturedImages.map((img, index) => (
                    <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-secondary">
                      <img src={img} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 w-8 h-8"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {capturedImages.length < 4 && (
                    <button
                      onClick={startCamera}
                      className="aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-secondary/50 transition-colors"
                    >
                      <Camera className="w-8 h-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {language === 'fr' ? 'Ajouter' : 'Add'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={startCamera}
                  className="aspect-video rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-3 hover:bg-primary/10 transition-colors"
                >
                  <Camera className="w-12 h-12 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {language === 'fr' ? 'Prendre une photo' : 'Take a photo'}
                  </span>
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{language === 'fr' ? 'ou' : 'or'}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <Button
                  variant="outline"
                  className="glass-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {language === 'fr' ? 'Importer des images' : 'Upload images'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div className={cn(
                "p-4 rounded-xl border",
                result.existing_machine 
                  ? "bg-warning/10 border-warning/30"
                  : result.detected 
                    ? "bg-success/10 border-success/30" 
                    : "bg-destructive/10 border-destructive/30"
              )}>
                {result.existing_machine ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      <span className="font-semibold text-warning">
                        {language === 'fr' ? 'Produit déjà enregistré !' : 'Product already registered!'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><strong>{language === 'fr' ? 'Nom' : 'Name'}:</strong> {result.existing_machine.name}</p>
                      <p><strong>{language === 'fr' ? 'Marque' : 'Brand'}:</strong> {result.existing_machine.brand}</p>
                      <p><strong>{language === 'fr' ? 'Modèle' : 'Model'}:</strong> {result.existing_machine.model}</p>
                      <p><strong>{language === 'fr' ? 'N° série' : 'Serial'}:</strong> {result.existing_machine.serial_number}</p>
                    </div>
                    <Button className="w-full" onClick={handleViewExisting}>
                      {language === 'fr' ? 'Voir la fiche produit' : 'View product page'}
                    </Button>
                  </div>
                ) : result.detected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-success" />
                      <span className="font-semibold text-success">
                        {language === 'fr' ? 'Produit détecté' : 'Product detected'}
                        <span className="text-xs ml-2 opacity-70">({Math.round(result.confidence * 100)}%)</span>
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      {result.brand && <p><strong>{language === 'fr' ? 'Marque' : 'Brand'}:</strong> {result.brand}</p>}
                      {result.model && <p><strong>{language === 'fr' ? 'Modèle' : 'Model'}:</strong> {result.model}</p>}
                      {result.serial_number && <p><strong>{language === 'fr' ? 'N° série' : 'Serial'}:</strong> {result.serial_number}</p>}
                      {result.category && <p><strong>{language === 'fr' ? 'Catégorie' : 'Category'}:</strong> {result.category}</p>}
                    </div>
                    <div className="flex gap-2">
                      {onProductDetected && (
                        <Button className="flex-1" onClick={handleApplyResult}>
                          <Check className="w-4 h-4 mr-2" />
                          {language === 'fr' ? 'Utiliser' : 'Use'}
                        </Button>
                      )}
                      {showCreateButton && (
                        <Button 
                          variant="outline" 
                          className="flex-1 glass-button"
                          onClick={handleCreateNewProduct}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {language === 'fr' ? 'Créer fiche' : 'Create'}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <X className="w-5 h-5 text-destructive" />
                    <span className="text-destructive">
                      {language === 'fr' ? 'Produit non reconnu' : 'Product not recognized'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {capturedImages.length > 0 && !scanning && !result && (
                <>
                  <Button variant="outline" className="flex-1" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {language === 'fr' ? 'Recommencer' : 'Reset'}
                  </Button>
                  <Button className="flex-1" onClick={handleScan}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {language === 'fr' ? 'Analyser' : 'Analyze'}
                  </Button>
                </>
              )}
              
              {scanning && (
                <div className="flex-1 flex items-center justify-center gap-2 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {language === 'fr' ? 'Analyse en cours...' : 'Analyzing...'}
                  </span>
                </div>
              )}

              {result && !result.existing_machine && (
                <Button variant="outline" className="flex-1" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {language === 'fr' ? 'Scanner à nouveau' : 'Scan again'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
