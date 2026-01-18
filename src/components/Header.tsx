import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export const Header = ({ title, showBack, rightAction }: HeaderProps) => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 touch-target flex items-center text-primary"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {rightAction}
          <button
            onClick={toggleLanguage}
            className="p-2 touch-target flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="w-5 h-5" />
            <span className="text-xs font-medium uppercase">{language}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
