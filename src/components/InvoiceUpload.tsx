import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplePlatform } from '@/hooks/useApplePlatform';
import { useInvoiceStorage } from '@/hooks/useInvoiceStorage';
import { Button } from '@/components/ui/button';
import { FileText, Upload, X, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceUploadProps {
  transactionId: string;
  type: 'rental' | 'sale' | 'external-repair';
  existingInvoiceUrl?: string | null;
  onUploadComplete: (path: string) => void;
  onDelete?: () => void;
  className?: string;
}

export const InvoiceUpload = ({
  transactionId,
  type,
  existingInvoiceUrl,
  onUploadComplete,
  onDelete,
  className,
}: InvoiceUploadProps) => {
  const { language } = useLanguage();
  const { supportsLiquidGlass } = useApplePlatform();
  const { uploading, uploadInvoice, downloadInvoice, deleteInvoice } = useInvoiceStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const t = language === 'fr' ? {
    upload: 'Joindre facture PDF',
    download: 'Télécharger',
    delete: 'Supprimer',
    invoiceAttached: 'Facture jointe',
    uploading: 'Téléchargement...',
  } : {
    upload: 'Attach PDF Invoice',
    download: 'Download',
    delete: 'Delete',
    invoiceAttached: 'Invoice attached',
    uploading: 'Uploading...',
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const path = await uploadInvoice(file, transactionId, type);
    if (path) {
      onUploadComplete(path);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async () => {
    if (!existingInvoiceUrl) return;
    setDownloading(true);
    await downloadInvoice(existingInvoiceUrl, `facture_${transactionId}.pdf`);
    setDownloading(false);
  };

  const handleDelete = async () => {
    if (!existingInvoiceUrl) return;
    setDeleting(true);
    const success = await deleteInvoice(existingInvoiceUrl);
    setDeleting(false);
    if (success && onDelete) {
      onDelete();
    }
  };

  if (existingInvoiceUrl) {
    return (
      <div className={cn(
        'flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/30',
        className
      )}>
        <FileText className="w-5 h-5 text-success" />
        <span className="flex-1 text-sm font-medium text-success">{t.invoiceAttached}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="h-8"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="h-8 text-destructive hover:text-destructive"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        className={cn('w-full h-12', supportsLiquidGlass && 'glass-button')}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t.uploading}
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {t.upload}
          </>
        )}
      </Button>
    </div>
  );
};
