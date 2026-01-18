import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Settings = () => {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title={t('settings')} />
      
      <div className="p-4 space-y-4">
        <div className="ios-card overflow-hidden">
          <h3 className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
            {t('language')}
          </h3>
          
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              'w-full flex items-center justify-between px-4 py-4 touch-target border-b border-border',
              language === 'en' && 'bg-primary/5'
            )}
          >
            <span className="text-foreground">{t('english')}</span>
            {language === 'en' && <Check className="w-5 h-5 text-primary" />}
          </button>
          
          <button
            onClick={() => setLanguage('fr')}
            className={cn(
              'w-full flex items-center justify-between px-4 py-4 touch-target',
              language === 'fr' && 'bg-primary/5'
            )}
          >
            <span className="text-foreground">{t('french')}</span>
            {language === 'fr' && <Check className="w-5 h-5 text-primary" />}
          </button>
        </div>

        <div className="ios-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Machine Diagnostic App
          </h3>
          <p className="text-xs text-muted-foreground">
            Version 1.0.0
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
