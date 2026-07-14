import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationToggle } from './NotificationToggle';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showNotifications?: boolean;
}

/**
 * Mobile top bar (hidden on lg+ where DesktopSidebar takes over).
 * Sticky Liquid Glass material with safe-area support.
 */
export const Header = ({ title, showBack, onBack, rightAction, showNotifications = true }: HeaderProps) => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="lg:hidden sticky top-0 z-50 glass-header pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 touch-target flex items-center text-primary hover:bg-primary/10 rounded-xl transition-colors"
              aria-label={t('back')}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-lg font-semibold truncate text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-1">
          {rightAction}
          {showNotifications && <NotificationToggle />}
          <button
            onClick={toggleLanguage}
            className="p-2 touch-target flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition-colors"
            aria-label={t('language')}
          >
            <Globe className="w-5 h-5" />
            <span className="text-xs font-medium uppercase">{language}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
