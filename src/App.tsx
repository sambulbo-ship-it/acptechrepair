import { Suspense, lazy, useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingScreen } from "./components/LoadingScreen";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { WorkspaceSplashScreen } from "./components/WorkspaceSplashScreen";
import { InstallBanner } from "./components/InstallBanner";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const AddMachine = lazy(() => import("./pages/AddMachine"));
const MachineDetail = lazy(() => import("./pages/MachineDetail"));
const Team = lazy(() => import("./pages/Team"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const Workspaces = lazy(() => import("./pages/Workspaces"));
const ScanHistory = lazy(() => import("./pages/ScanHistory"));
const WorkspaceSettings = lazy(() => import("./pages/WorkspaceSettings"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const WorkspaceBranding = lazy(() => import("./pages/WorkspaceBranding"));
const Install = lazy(() => import("./pages/Install"));
const Admin = lazy(() => import("./pages/Admin"));
const RepairResources = lazy(() => import("./pages/RepairResources"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const FindRepairService = lazy(() => import("./pages/FindRepairService"));
const RepairServiceSettings = lazy(() => import("./pages/RepairServiceSettings"));
const RepairRequestsReceived = lazy(() => import("./pages/RepairRequestsReceived"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Query client with retry and error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Protected route wrapper with splash screen
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, currentWorkspace, workspacesLoading, workspacesLoaded, workspaces } = useAuth();
  const [showSplash, setShowSplash] = useState(false);
  const [splashShown, setSplashShown] = useState(false);

  useEffect(() => {
    // Show splash only once per session when workspace is selected
    if (currentWorkspace && !splashShown) {
      const lastShown = sessionStorage.getItem(`splash_shown_${currentWorkspace.id}`);
      if (!lastShown) {
        setShowSplash(true);
      }
    }
  }, [currentWorkspace, splashShown]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setSplashShown(true);
    if (currentWorkspace) {
      sessionStorage.setItem(`splash_shown_${currentWorkspace.id}`, 'true');
    }
  };

  // Still checking auth state
  if (loading) {
    return <LoadingScreen message="Vérification de la session..." />;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait until workspace list is actually loaded (prevents false "no workspace" state)
  if (workspacesLoading || !workspacesLoaded) {
    return <LoadingScreen message="Chargement des espaces..." />;
  }

  // If logged in but no workspaces at all, redirect to workspaces page to join/create
  if (workspaces.length === 0) {
    return <Navigate to="/workspaces" replace />;
  }

  // If logged in with workspaces but none selected, select the first one automatically
  if (!currentWorkspace && workspaces.length > 0) {
    // The AuthContext should handle selecting the first workspace,
    // but if for some reason it hasn't, redirect to workspaces
    return <Navigate to="/workspaces" replace />;
  }

  // Import notification listener dynamically to avoid SSR issues
  const NotificationListener = lazy(() => import('./components/NotificationListener').then(m => ({ default: m.NotificationListener })));

  return (
    <>
      {showSplash && <WorkspaceSplashScreen onComplete={handleSplashComplete} duration={1500} />}
      <OfflineIndicator />
      <Suspense fallback={null}>
        <NotificationListener />
      </Suspense>
      {children}
    </>
  );
};

// Public route wrapper (redirect if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Chargement..." />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Workspaces route - needs auth but not workspace
const WorkspacesRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Chargement..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/install" element={<Install />} />
      
      {/* Semi-protected (need auth but not workspace) */}
      <Route path="/workspaces" element={<WorkspacesRoute><Workspaces /></WorkspacesRoute>} />
      <Route path="/admin" element={<WorkspacesRoute><Admin /></WorkspacesRoute>} />
      
      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/add" element={<ProtectedRoute><AddMachine /></ProtectedRoute>} />
      <Route path="/machine/:id" element={<ProtectedRoute><MachineDetail /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/scan-history" element={<ProtectedRoute><ScanHistory /></ProtectedRoute>} />
      <Route path="/workspace-settings" element={<ProtectedRoute><WorkspaceSettings /></ProtectedRoute>} />
      <Route path="/notification-settings" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
      <Route path="/workspace-branding" element={<ProtectedRoute><WorkspaceBranding /></ProtectedRoute>} />
      <Route path="/repair-resources" element={<ProtectedRoute><RepairResources /></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path="/repair-service-settings" element={<ProtectedRoute><RepairServiceSettings /></ProtectedRoute>} />
      <Route path="/repair-requests-received" element={<ProtectedRoute><RepairRequestsReceived /></ProtectedRoute>} />
      
      {/* Public route for finding repair services */}
      <Route path="/find-repair" element={<FindRepairService />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-center" />
            <BrowserRouter>
              <div className="dark">
                <AppRoutes />
                <InstallBanner />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
