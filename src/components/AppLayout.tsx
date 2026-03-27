import { DesktopSidebar } from './DesktopSidebar';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Responsive layout wrapper:
 * - Mobile: children full-width + BottomNav fixed at bottom
 * - Desktop (lg+): DesktopSidebar on left + children in scrollable main area
 */
export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
      {/* BottomNav only visible on mobile */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};
