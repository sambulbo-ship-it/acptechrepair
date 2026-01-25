import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wrench, PlusCircle, Users, Settings, Package, Building2, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Wrench, label: t('equipment') },
    { path: '/rental-sale', icon: ShoppingCart, label: t('rentalSale') },
    { path: '/add', icon: PlusCircle, label: t('addMachine') },
    { path: '/repair-resources', icon: Package, label: t('resources') },
    { path: '/team', icon: Users, label: t('team') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-nav pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 touch-target rounded-xl transition-all duration-200',
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
