import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { EntryPhoto } from '@/types/machine';
import { Camera, ImagePlus, X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface PhotoCaptureProps {
  photos: EntryPhoto[];
  onPhotosChange: (photos: EntryPhoto[]) => void;
  maxPhotos?: number;
}

export const PhotoCapture = ({ photos, onPhotosChange, maxPhotos = 5 }: PhotoCaptureProps) => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: EntryPhoto[] = [];

    for (let i = 0; i < files.length && photos.length + newPhotos.length < maxPhotos; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const dataUrl = await readFileAsDataUrl(file);
        const compressed = await compressImage(dataUrl, 1200, 0.8);
        
        newPhotos.push({
          id: crypto.randomUUID(),
          dataUrl: compressed,
          createdAt: new Date(),
        });
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    onPhotosChange([...photos, ...newPhotos]);
    
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const compressImage = (dataUrl: string, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = dataUrl;
    });
  };

  const removePhoto = (photoId: string) => {
    onPhotosChange(photos.filter(p => p.id !== photoId));
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {language === 'fr' ? 'Photos' : 'Photos'} ({photos.length}/{maxPhotos})
        </span>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square group">
            <img
              src={photo.dataUrl}
              alt="Attached photo"
              className="w-full h-full object-cover rounded-xl"
            />
            
            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl p-0 overflow-hidden">
                  <img
                    src={photo.dataUrl}
                    alt="Full size"
                    className="w-full h-auto"
                  />
                </DialogContent>
              </Dialog>
              
              <button
                onClick={() => removePhoto(photo.id)}
                className="p-2 bg-destructive/80 rounded-full hover:bg-destructive transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ))}

        {/* Add Photo Buttons */}
        {canAddMore && (
          <>
            {/* Camera button */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors touch-target"
            >
              <Camera className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {language === 'fr' ? 'Caméra' : 'Camera'}
              </span>
            </button>

            {/* Gallery button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors touch-target"
            >
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {language === 'fr' ? 'Galerie' : 'Gallery'}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
