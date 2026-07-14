import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wrench, PlusCircle, Settings, Package, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Mobile floating tab bar — Liquid Glass bubble.
 * Hidden on lg+ (DesktopSidebar takes over via AppLayout).
 */
export const BottomNav = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Wrench, label: t('equipment') },
    { path: '/rental-sale', icon: ShoppingCart, label: t('rentalSale') },
    { path: '/add', icon: PlusCircle, label: t('addMachine') },
    { path: '/repair-resources', icon: Package, label: t('resources') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]"
      aria-label="Navigation principale"
    >
      <div className="mx-3 mb-3">
        <div className="liquid-glass-bubble">
          <div className="relative flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300',
                    isActive
                      ? 'nav-item-active'
                      : 'text-foreground/50 hover:text-foreground/90 hover:bg-foreground/5 active:scale-95'
                  )}
                >
                  <Icon className={cn('w-5 h-5 transition-all', isActive && 'stroke-[2.5]')} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
