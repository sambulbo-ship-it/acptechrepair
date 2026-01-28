import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wrench, PlusCircle, Users, Settings, Package, ShoppingCart, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Wrench, label: t('equipment') },
    { path: '/rental-sale', icon: ShoppingCart, label: t('rentalSale') },
    { path: '/analytics', icon: BarChart3, label: 'Stats' },
    { path: '/add', icon: PlusCircle, label: t('addMachine') },
    { path: '/repair-resources', icon: Package, label: t('resources') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      {/* Liquid Glass Bubble Container */}
      <div className="mx-3 mb-3">
        <div className="liquid-glass-bubble">
          {/* Refraction layer - top highlight */}
          <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
          
          {/* Inner glow gradient */}
          <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse 80% 50% at 50% 0%, hsla(0 0% 100% / 0.15) 0%, transparent 50%),
                  radial-gradient(ellipse 60% 40% at 50% 100%, hsla(25 95% 53% / 0.1) 0%, transparent 50%)
                `
              }}
            />
          </div>
          
          {/* Navigation items */}
          <div className="relative flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300',
                    isActive 
                      ? 'nav-item-active' 
                      : 'text-white/60 hover:text-white/90 hover:bg-white/5 active:scale-95'
                  )}
                >
                  <Icon className={cn('w-5 h-5 transition-all', isActive && 'stroke-[2.5]')} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* Bottom subtle shadow line */}
          <div className="absolute bottom-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-black/20 to-transparent pointer-events-none" />
        </div>
      </div>
    </nav>
  );
};
