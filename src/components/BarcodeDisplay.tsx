import Barcode from 'react-barcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Download, Printer } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRef } from 'react';

interface BarcodeDisplayProps {
  serialNumber: string;
  machineName: string;
}

export const BarcodeDisplay = ({ serialNumber, machineName }: BarcodeDisplayProps) => {
  const { language } = useLanguage();
  const barcodeRef = useRef<HTMLDivElement>(null);

  if (!serialNumber) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && barcodeRef.current) {
      const svgElement = barcodeRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${machineName} - Barcode</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                font-family: system-ui, -apple-system, sans-serif;
              }
              .label {
                text-align: center;
                margin-bottom: 10px;
              }
              .machine-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .serial {
                font-size: 14px;
                color: #666;
              }
              @media print {
                body { padding: 10mm; }
              }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="machine-name">${machineName}</div>
              <div class="serial">${serialNumber}</div>
            </div>
            ${svgData}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    if (barcodeRef.current) {
      const svgElement = barcodeRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          const a = document.createElement('a');
          a.download = `${serialNumber}-barcode.png`;
          a.href = canvas.toDataURL('image/png');
          a.click();
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="w-4 h-4" />
          {language === 'fr' ? 'Code-barres' : 'Barcode'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'fr' ? 'Code-barres équipement' : 'Equipment Barcode'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-6 space-y-4">
          <div className="text-center mb-2">
            <p className="font-semibold text-lg">{machineName}</p>
            <p className="text-sm text-muted-foreground">{serialNumber}</p>
          </div>
          
          <div ref={barcodeRef} className="bg-white p-4 rounded-lg">
            <Barcode 
              value={serialNumber}
              format="CODE128"
              width={2}
              height={80}
              displayValue={true}
              fontSize={14}
              margin={10}
              background="#ffffff"
              lineColor="#000000"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              {language === 'fr' ? 'Imprimer' : 'Print'}
            </Button>
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              {language === 'fr' ? 'Télécharger' : 'Download'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
