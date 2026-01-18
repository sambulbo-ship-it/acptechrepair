import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceBranding } from '@/hooks/useWorkspaceBranding';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Palette, 
  Image as ImageIcon, 
  Save,
  RefreshCw,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

const colorPresets = [
  { name: 'Orange', primary: '#f97316', secondary: '#1a1a2e' },
  { name: 'Bleu', primary: '#3b82f6', secondary: '#0f172a' },
  { name: 'Vert', primary: '#22c55e', secondary: '#0a1f0a' },
  { name: 'Rouge', primary: '#ef4444', secondary: '#1f0a0a' },
  { name: 'Violet', primary: '#a855f7', secondary: '#1a0f2e' },
  { name: 'Cyan', primary: '#06b6d4', secondary: '#0a1a1f' },
];

const WorkspaceBranding = () => {
  const navigate = useNavigate();
  const { currentWorkspace, isWorkspaceAdmin } = useAuth();
  const { branding, loading, updateBranding, refetch } = useWorkspaceBranding();
  
  const [logoUrl, setLogoUrl] = useState(branding.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(branding.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(branding.secondary_color);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Update local state when branding loads
  useState(() => {
    setLogoUrl(branding.logo_url || '');
    setPrimaryColor(branding.primary_color);
    setSecondaryColor(branding.secondary_color);
  });

  const handleSave = async () => {
    setSaving(true);
    const success = await updateBranding({
      logo_url: logoUrl || null,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    });
    setSaving(false);
    
    if (success) {
      await refetch();
    }
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
  };

  const resetToDefault = () => {
    setLogoUrl('');
    setPrimaryColor('#f97316');
    setSecondaryColor('#1a1a2e');
  };

  if (!currentWorkspace) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header title="Personnalisation" showBack />
        <div className="p-4 text-center text-muted-foreground">
          Sélectionnez un espace de travail
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!isWorkspaceAdmin) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header title="Personnalisation" showBack />
        <div className="p-4 text-center">
          <Palette className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Accès restreint
          </h2>
          <p className="text-muted-foreground">
            Seuls les administrateurs peuvent personnaliser le branding.
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Personnalisation" showBack />

      {/* Preview splash */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity"
          style={{ backgroundColor: secondaryColor }}
          onClick={() => setShowPreview(false)}
        >
          <div className="mb-8">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-32 w-32 object-contain rounded-2xl"
              />
            ) : (
              <div
                className="h-32 w-32 rounded-2xl flex items-center justify-center text-4xl font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {currentWorkspace.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            {currentWorkspace.name}
          </h1>
          <p className="text-white/70 text-sm">Touchez pour fermer</p>
        </div>
      )}

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Logo */}
            <div className="ios-card overflow-hidden">
              <h3 className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Logo
              </h3>
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-20 w-20 object-contain rounded-xl border border-border"
                    />
                  ) : (
                    <div
                      className="h-20 w-20 rounded-xl flex items-center justify-center text-2xl font-bold text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {currentWorkspace.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <Label htmlFor="logoUrl">URL du logo</Label>
                    <Input
                      id="logoUrl"
                      placeholder="https://example.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Utilisez une image carrée (PNG ou JPG) d'au moins 512x512 pixels.
                </p>
              </div>
            </div>

            {/* Colors */}
            <div className="ios-card overflow-hidden">
              <h3 className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Couleurs
              </h3>
              <div className="p-4 space-y-4">
                {/* Color presets */}
                <div>
                  <Label className="mb-2 block">Palettes prédéfinies</Label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span className="text-sm">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary color */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Couleur principale</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        id="primaryColor"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#f97316"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Couleur de fond</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        id="secondaryColor"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        placeholder="#1a1a2e"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Prévisualiser
              </Button>
              <Button
                variant="outline"
                onClick={resetToDefault}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default WorkspaceBranding;
