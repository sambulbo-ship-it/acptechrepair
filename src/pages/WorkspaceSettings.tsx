import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceSettings } from '@/hooks/useWorkspaceSettings';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  ScanLine, 
  QrCode, 
  Printer, 
  History,
  Shield,
  AlertTriangle,
  Link2,
  Eye,
  ShoppingCart,
  Wrench,
  CalendarCheck,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const WorkspaceSettings = () => {
  const { language } = useLanguage();
  const { currentWorkspace, isWorkspaceAdmin } = useAuth();
  const { settings, loading, updateSettings, isAdmin } = useWorkspaceSettings();
  const [copied, setCopied] = useState(false);

  const handleToggle = async (key: string, value: boolean) => {
    const success = await updateSettings({ [key]: value });
    if (success) {
      toast.success(language === 'fr' ? 'Paramètre mis à jour' : 'Setting updated');
    } else {
      toast.error(language === 'fr' ? 'Erreur' : 'Error');
    }
  };

  const handleRetentionChange = async (days: number) => {
    if (days < 1 || days > 3650) return;
    const success = await updateSettings({ scan_history_retention_days: days });
    if (success) {
      toast.success(language === 'fr' ? 'Paramètre mis à jour' : 'Setting updated');
    }
  };

  const getGuestLink = () => {
    if (!currentWorkspace) return '';
    return `${window.location.origin}/catalog?workspace=${currentWorkspace.id}`;
  };

  const copyGuestLink = async () => {
    try {
      await navigator.clipboard.writeText(getGuestLink());
      setCopied(true);
      toast.success(language === 'fr' ? 'Lien copié !' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(language === 'fr' ? 'Erreur de copie' : 'Copy failed');
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header 
          title={language === 'fr' ? 'Paramètres workspace' : 'Workspace Settings'}
          showBack
        />
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">
            {language === 'fr' ? 'Aucun workspace sélectionné' : 'No workspace selected'}
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        title={language === 'fr' ? 'Paramètres workspace' : 'Workspace Settings'}
        showBack
      />

      <div className="p-4 space-y-4">
        {!isAdmin && (
          <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-xl border border-warning/30">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
            <p className="text-sm text-warning">
              {language === 'fr' 
                ? 'Seuls les administrateurs peuvent modifier ces paramètres'
                : 'Only administrators can modify these settings'}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : settings ? (
          <>
            {/* Guest Link Settings */}
            <div className="ios-card p-4 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {language === 'fr' ? 'Lien invité' : 'Guest Link'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'fr' ? 'Accès en lecture seule pour visiteurs' : 'Read-only access for visitors'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor="guest-enabled">
                      {language === 'fr' ? 'Activer le lien invité' : 'Enable guest link'}
                    </Label>
                  </div>
                  <Switch
                    id="guest-enabled"
                    checked={settings.guest_link_enabled}
                    onCheckedChange={(checked) => handleToggle('guest_link_enabled', checked)}
                    disabled={!isAdmin}
                  />
                </div>

                {settings.guest_link_enabled && (
                  <>
                    <div className="p-3 bg-secondary rounded-xl space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        {language === 'fr' ? 'Lien de partage' : 'Share link'}
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-foreground bg-background/50 p-2 rounded-lg flex-1 truncate">
                          {getGuestLink()}
                        </code>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={copyGuestLink}
                          className="shrink-0"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {language === 'fr' 
                        ? 'Choisissez les sections visibles par les invités :'
                        : 'Choose which sections guests can see:'}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                        <Label htmlFor="guest-catalog">
                          {language === 'fr' ? 'Catalogue location / vente' : 'Rental / sale catalog'}
                        </Label>
                      </div>
                      <Switch
                        id="guest-catalog"
                        checked={settings.guest_show_catalog}
                        onCheckedChange={(checked) => handleToggle('guest_show_catalog', checked)}
                        disabled={!isAdmin}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5 text-muted-foreground" />
                        <Label htmlFor="guest-repair">
                          {language === 'fr' ? 'Demande de réparation' : 'Repair request'}
                        </Label>
                      </div>
                      <Switch
                        id="guest-repair"
                        checked={settings.guest_show_repair_request}
                        onCheckedChange={(checked) => handleToggle('guest_show_repair_request', checked)}
                        disabled={!isAdmin}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CalendarCheck className="w-5 h-5 text-muted-foreground" />
                        <Label htmlFor="guest-maintenance">
                          {language === 'fr' ? 'Demande d\'entretien' : 'Maintenance request'}
                        </Label>
                      </div>
                      <Switch
                        id="guest-maintenance"
                        checked={settings.guest_show_maintenance_request}
                        onCheckedChange={(checked) => handleToggle('guest_show_maintenance_request', checked)}
                        disabled={!isAdmin}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Scan Settings */}
            <div className="ios-card p-4 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ScanLine className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {language === 'fr' ? 'Scanner' : 'Scanner'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'fr' ? 'Permissions de scan' : 'Scan permissions'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ScanLine className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor="barcode-scan">
                      {language === 'fr' ? 'Scan code-barres' : 'Barcode scan'}
                    </Label>
                  </div>
                  <Switch
                    id="barcode-scan"
                    checked={settings.enable_barcode_scan}
                    onCheckedChange={(checked) => handleToggle('enable_barcode_scan', checked)}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor="qrcode-scan">
                      {language === 'fr' ? 'Scan QR code' : 'QR code scan'}
                    </Label>
                  </div>
                  <Switch
                    id="qrcode-scan"
                    checked={settings.enable_qrcode_scan}
                    onCheckedChange={(checked) => handleToggle('enable_qrcode_scan', checked)}
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            </div>

            {/* Print Settings */}
            <div className="ios-card p-4 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Printer className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {language === 'fr' ? 'Impression' : 'Printing'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'fr' ? 'Permissions d\'impression' : 'Print permissions'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ScanLine className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor="barcode-print">
                      {language === 'fr' ? 'Imprimer code-barres' : 'Print barcodes'}
                    </Label>
                  </div>
                  <Switch
                    id="barcode-print"
                    checked={settings.enable_barcode_print}
                    onCheckedChange={(checked) => handleToggle('enable_barcode_print', checked)}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor="qrcode-print">
                      {language === 'fr' ? 'Imprimer QR codes' : 'Print QR codes'}
                    </Label>
                  </div>
                  <Switch
                    id="qrcode-print"
                    checked={settings.enable_qrcode_print}
                    onCheckedChange={(checked) => handleToggle('enable_qrcode_print', checked)}
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            </div>

            {/* History Settings */}
            <div className="ios-card p-4 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <History className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {language === 'fr' ? 'Historique' : 'History'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'fr' ? 'Conservation des données' : 'Data retention'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor="require-notes">
                      {language === 'fr' ? 'Notes obligatoires' : 'Require notes'}
                    </Label>
                  </div>
                  <Switch
                    id="require-notes"
                    checked={settings.require_scan_notes}
                    onCheckedChange={(checked) => handleToggle('require_scan_notes', checked)}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retention">
                    {language === 'fr' ? 'Conservation (jours)' : 'Retention (days)'}
                  </Label>
                  <Input
                    id="retention"
                    type="number"
                    min={1}
                    max={3650}
                    value={settings.scan_history_retention_days}
                    onChange={(e) => handleRetentionChange(parseInt(e.target.value) || 365)}
                    className="h-12 bg-secondary border-0 rounded-xl"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'fr' 
                      ? 'Les scans plus anciens seront automatiquement supprimés'
                      : 'Older scans will be automatically deleted'}
                  </p>
                </div>
              </div>
            </div>

            {/* Workspace Info */}
            <div className="ios-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{currentWorkspace.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isAdmin 
                      ? (language === 'fr' ? 'Administrateur' : 'Administrator')
                      : (language === 'fr' ? 'Membre' : 'Member')}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
};

export default WorkspaceSettings;
