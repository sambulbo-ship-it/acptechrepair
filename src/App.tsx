import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import AddMachine from "./pages/AddMachine";
import MachineDetail from "./pages/MachineDetail";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Workspaces from "./pages/Workspaces";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, currentWorkspace } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If logged in but no workspace selected, redirect to workspaces
  if (!currentWorkspace) {
    return <Navigate to="/workspaces" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirect if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
    
    {/* Semi-protected (need auth but not workspace) */}
    <Route path="/workspaces" element={<Workspaces />} />
    
    {/* Protected routes */}
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/add" element={<ProtectedRoute><AddMachine /></ProtectedRoute>} />
    <Route path="/machine/:id" element={<ProtectedRoute><MachineDetail /></ProtectedRoute>} />
    <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    
    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter>
            <div className="dark">
              <AppRoutes />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
