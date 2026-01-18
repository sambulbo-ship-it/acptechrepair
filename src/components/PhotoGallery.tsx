import { useState } from 'react';
import { EntryPhoto } from '@/types/machine';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoGalleryProps {
  photos: EntryPhoto[];
  size?: 'sm' | 'md';
}

export const PhotoGallery = ({ photos, size = 'sm' }: PhotoGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (photos.length === 0) return null;

  const showNav = photos.length > 1;

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev + 1) % photos.length);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const thumbnailSize = size === 'sm' ? 'w-12 h-12' : 'w-16 h-16';

  return (
    <div className="flex gap-2 mt-2">
      {photos.slice(0, 4).map((photo, index) => (
        <Dialog key={photo.id}>
          <DialogTrigger asChild>
            <button
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative rounded-lg overflow-hidden flex-shrink-0',
                thumbnailSize
              )}
            >
              <img
                src={photo.dataUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === 3 && photos.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    +{photos.length - 4}
                  </span>
                </div>
              )}
            </button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
            <div className="relative">
              <img
                src={photos[selectedIndex].dataUrl}
                alt={`Photo ${selectedIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              
              {showNav && (
                <>
                  <button
                    onClick={goPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={goNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}
              
              {/* Photo counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full">
                <span className="text-white text-sm">
                  {selectedIndex + 1} / {photos.length}
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};
