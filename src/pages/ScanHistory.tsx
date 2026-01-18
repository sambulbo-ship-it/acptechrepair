import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScanHistory } from '@/hooks/useScanHistory';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { 
  History, 
  ScanLine, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Trash2,
  Calendar,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ScanHistory = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { isWorkspaceAdmin } = useAuth();
  const { scans, loading, clearHistory } = useScanHistory();
  const [clearing, setClearing] = useState(false);

  const dateLocale = language === 'fr' ? fr : enUS;

  const handleClearHistory = async () => {
    setClearing(true);
    const success = await clearHistory();
    setClearing(false);
    
    if (success) {
      toast.success(language === 'fr' ? 'Historique effacé' : 'History cleared');
    } else {
      toast.error(language === 'fr' ? 'Erreur' : 'Error');
    }
  };

  const groupScansByDate = () => {
    const groups: { [key: string]: typeof scans } = {};
    
    scans.forEach(scan => {
      const dateKey = format(scan.scanned_at, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(scan);
    });
    
    return groups;
  };

  const groupedScans = groupScansByDate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        title={language === 'fr' ? 'Historique des scans' : 'Scan History'}
        showBack
        rightAction={
          isWorkspaceAdmin && scans.length > 0 ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {language === 'fr' ? 'Effacer l\'historique ?' : 'Clear history?'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {language === 'fr' 
                      ? 'Cette action est irréversible. Tous les enregistrements de scan seront supprimés.'
                      : 'This action cannot be undone. All scan records will be deleted.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {language === 'fr' ? 'Annuler' : 'Cancel'}
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearHistory}
                    disabled={clearing}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {clearing 
                      ? (language === 'fr' ? 'Suppression...' : 'Deleting...')
                      : (language === 'fr' ? 'Effacer' : 'Clear')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : undefined
        }
      />

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <History className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {language === 'fr' ? 'Aucun scan' : 'No scans'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {language === 'fr' 
                ? 'Les scans de codes-barres et QR codes apparaîtront ici'
                : 'Barcode and QR code scans will appear here'}
            </p>
          </div>
        ) : (
          Object.entries(groupedScans).map(([dateKey, dayScans]) => (
            <div key={dateKey} className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium py-2">
                <Calendar className="w-4 h-4" />
                {format(new Date(dateKey), 'EEEE d MMMM yyyy', { locale: dateLocale })}
              </div>
              
              <div className="space-y-2">
                {dayScans.map((scan) => (
                  <div 
                    key={scan.id}
                    className="ios-card p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => scan.machine_id && navigate(`/machine/${scan.machine_id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        scan.found ? 'bg-success/10' : 'bg-destructive/10'
                      }`}>
                        {scan.scan_type === 'qrcode' ? (
                          <QrCode className={`w-5 h-5 ${scan.found ? 'text-success' : 'text-destructive'}`} />
                        ) : (
                          <ScanLine className={`w-5 h-5 ${scan.found ? 'text-success' : 'text-destructive'}`} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium truncate">
                            {scan.scanned_code}
                          </span>
                          {scan.found ? (
                            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                          )}
                        </div>
                        
                        {scan.machine_name && (
                          <p className="text-sm text-primary mt-1">
                            {scan.machine_name}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(scan.scanned_at, 'HH:mm:ss')}
                          <span className="px-1.5 py-0.5 bg-secondary rounded text-xs">
                            {scan.scan_type === 'qrcode' ? 'QR' : 'Barcode'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ScanHistory;
