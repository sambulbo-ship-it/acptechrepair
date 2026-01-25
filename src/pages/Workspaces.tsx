import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplePlatform } from '@/hooks/useApplePlatform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Plus, 
  KeyRound, 
  ChevronRight, 
  Copy, 
  Check, 
  Shield,
  Users,
  Loader2,
  LogOut,
  Crown,
  Trash2,
  UserMinus,
  MoreVertical,
  AlertTriangle,
  Monitor,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const Workspaces = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isDesktop, isMobile, supportsLiquidGlass } = useApplePlatform();
  const { 
    user, 
    workspaces, 
    currentWorkspace, 
    setCurrentWorkspace, 
    joinWorkspace, 
    createWorkspace,
    leaveWorkspace,
    deleteWorkspace,
    canCreateWorkspace,
    signOut,
    loading,
    workspacesLoading,
    workspacesLoaded,
    isAppAdmin
  } = useAuth();

  const [inviteCode, setInviteCode] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState<string | null>(null);
  
  // Safety timeout for loading state
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    // If loading takes more than 5 seconds, show content anyway
    const timer = setTimeout(() => {
      if (loading || (workspacesLoading && !workspacesLoaded)) {
        setLoadingTimeout(true);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [loading, workspacesLoading, workspacesLoaded]);

  const handleJoinWorkspace = async () => {
    if (!inviteCode.trim()) {
      toast.error('Entrez un code d\'invitation');
      return;
    }

    setJoinLoading(true);
    const { error, workspace } = await joinWorkspace(inviteCode.trim());
    setJoinLoading(false);

    if (error) {
      toast.error(error.message);
    } else if (workspace) {
      toast.success(`Bienvenue dans "${workspace.name}" !`);
      setInviteCode('');
      setJoinDialogOpen(false);
      setCurrentWorkspace(workspace);
      navigate('/');
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Entrez un nom pour l\'espace');
      return;
    }

    setCreateLoading(true);
    const { error, workspace } = await createWorkspace(newWorkspaceName.trim());
    setCreateLoading(false);

    if (error) {
      toast.error(error.message);
    } else if (workspace) {
      toast.success(`Espace "${workspace.name}" créé`);
      setNewWorkspaceName('');
      setCreateDialogOpen(false);
      setCurrentWorkspace(workspace);
      navigate('/');
    }
  };

  const handleLeaveWorkspace = async (workspaceId: string) => {
    setActionLoading(workspaceId);
    const { error } = await leaveWorkspace(workspaceId);
    setActionLoading(null);
    setLeaveDialogOpen(null);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Vous avez quitté l\'espace');
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    setActionLoading(workspaceId);
    const { error } = await deleteWorkspace(workspaceId);
    setActionLoading(null);
    setDeleteDialogOpen(null);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Espace supprimé');
    }
  };

  const handleSelectWorkspace = (workspace: typeof workspaces[0]) => {
    setCurrentWorkspace(workspace);
    navigate('/');
  };

  const copyInviteCode = async (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(code.toUpperCase());
    setCopiedCode(code);
    toast.success('Code copié');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Show loading state, but with timeout escape hatch
  const isStillLoading = (loading || (workspacesLoading && !workspacesLoaded)) && !loadingTimeout;

  if (isStillLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Chargement des espaces...</p>
      </div>
    );
  }

  // Desktop layout - wider, side panel style
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside className={cn(
          "w-80 border-r border-border/30 flex flex-col",
          supportsLiquidGlass ? "glass" : "bg-card"
        )}>
          {/* Header */}
          <header className="p-6 border-b border-border/30">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-foreground">Espaces de travail</h1>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Mode Bureau</span>
              {isAppAdmin && (
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-medium">
                  <Crown className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
            
            {isAppAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/admin')}
                className="w-full mt-4"
              >
                <Shield className="w-4 h-4 mr-2" />
                Tableau de bord Admin
              </Button>
            )}
          </header>
          
          {/* Quick Actions */}
          <div className="p-4 space-y-2">
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <KeyRound className="w-4 h-4 mr-2" />
                  Rejoindre un espace
                </Button>
              </DialogTrigger>
              <DialogContent className={cn("sm:max-w-md", supportsLiquidGlass && "glass-dialog")}>
                <DialogHeader>
                  <DialogTitle>Rejoindre un espace</DialogTitle>
                  <DialogDescription>
                    Entrez le code fourni par l'administrateur
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-code-desktop">Code d'invitation</Label>
                    <Input
                      id="invite-code-desktop"
                      placeholder="AB12CD34"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className={cn("h-12 text-center text-lg tracking-[0.3em] uppercase font-mono", supportsLiquidGlass && "glass-input")}
                      maxLength={8}
                      disabled={joinLoading}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleJoinWorkspace} 
                    className="w-full"
                    disabled={joinLoading || !inviteCode.trim()}
                  >
                    {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rejoindre'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="default" 
                  className="w-full justify-start"
                  disabled={!canCreateWorkspace}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un espace
                </Button>
              </DialogTrigger>
              <DialogContent className={cn("sm:max-w-md", supportsLiquidGlass && "glass-dialog")}>
                <DialogHeader>
                  <DialogTitle>Créer un espace</DialogTitle>
                  <DialogDescription>
                    Un code sera généré pour inviter votre équipe
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name-desktop">Nom de l'espace</Label>
                    <Input
                      id="workspace-name-desktop"
                      placeholder="Mon Entreprise"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      className={cn("h-12", supportsLiquidGlass && "glass-input")}
                      disabled={createLoading}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleCreateWorkspace} 
                    className="w-full"
                    disabled={createLoading || !newWorkspaceName.trim()}
                  >
                    {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Workspaces List */}
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Vos espaces</h2>
            {workspaces.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucun espace</p>
              </div>
            ) : (
              <div className="space-y-2">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    onClick={() => handleSelectWorkspace(workspace)}
                    className={cn(
                      "group p-3 rounded-lg cursor-pointer transition-all border",
                      currentWorkspace?.id === workspace.id 
                        ? "bg-primary/10 border-primary/30" 
                        : "bg-secondary/30 border-transparent hover:bg-secondary/50 hover:border-border/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground truncate">{workspace.name}</span>
                          {workspace.role === 'admin' && <Shield className="w-3 h-3 text-primary flex-shrink-0" />}
                        </div>
                        {workspace.role === 'admin' && workspace.invite_code && (
                          <button
                            onClick={(e) => copyInviteCode(workspace.invite_code, e)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-0.5"
                          >
                            <span className="font-mono">{workspace.invite_code.toUpperCase()}</span>
                            {copiedCode === workspace.invite_code ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleSelectWorkspace(workspace)}>
                            <ChevronRight className="w-4 h-4 mr-2" />
                            Ouvrir
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLeaveDialogOpen(workspace.id); }}>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Quitter
                          </DropdownMenuItem>
                          {workspace.role === 'admin' && (
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(workspace.id); }}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* User info */}
          <div className="p-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </aside>
        
        {/* Main content area */}
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Sélectionnez un espace
            </h2>
            <p className="text-muted-foreground mb-6">
              Choisissez un espace de travail dans la liste à gauche ou créez-en un nouveau pour commencer.
            </p>
            {workspaces.length > 0 && (
              <Button onClick={() => handleSelectWorkspace(workspaces[0])} size="lg">
                Ouvrir {workspaces[0].name}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </main>
        
        {/* Dialogs */}
        <AlertDialog open={!!leaveDialogOpen} onOpenChange={() => setLeaveDialogOpen(null)}>
          <AlertDialogContent className={supportsLiquidGlass ? "glass-dialog" : ""}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Quitter l'espace ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Vous ne pourrez plus accéder aux données de cet espace.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => leaveDialogOpen && handleLeaveWorkspace(leaveDialogOpen)}
                disabled={!!actionLoading}
              >
                {actionLoading === leaveDialogOpen ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Quitter'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <AlertDialog open={!!deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(null)}>
          <AlertDialogContent className={supportsLiquidGlass ? "glass-dialog" : ""}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" />
                Supprimer l'espace ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Toutes les données seront perdues.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteDialogOpen && handleDeleteWorkspace(deleteDialogOpen)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={!!actionLoading}
              >
                {actionLoading === deleteDialogOpen ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Mobile layout - original design with improvements
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      {/* Minimal Header */}
      <header className={cn(
        "sticky top-0 z-10 border-b border-border/30 pt-[env(safe-area-inset-top)]",
        supportsLiquidGlass ? "glass-header" : "bg-background/80 backdrop-blur-xl"
      )}>
        <div className="flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <h1 className="text-base font-medium text-foreground tracking-tight">Espaces</h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground -mr-2"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 space-y-8 pb-[env(safe-area-inset-bottom)]">
        {/* User Section */}
        <section className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Compte</span>
            {isAppAdmin && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[10px] font-medium uppercase tracking-wide">
                <Crown className="w-2.5 h-2.5" />
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">{user?.email}</p>
            {isAppAdmin && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin')}
                className="text-xs text-muted-foreground hover:text-foreground h-7"
              >
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Dashboard
              </Button>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3">
          {/* Join Workspace */}
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <button className={cn(
                "group flex flex-col items-start gap-3 p-4 rounded-xl border transition-all duration-200",
                supportsLiquidGlass ? "glass-card" : "bg-secondary/50 hover:bg-secondary/80 border-border/30"
              )}>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Rejoindre</p>
                  <p className="text-xs text-muted-foreground">Avec un code</p>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className={cn("sm:max-w-md", supportsLiquidGlass && "glass-dialog")}>
              <DialogHeader>
                <DialogTitle className="text-lg font-medium">Rejoindre un espace</DialogTitle>
                <DialogDescription className="text-sm">
                  Entrez le code fourni par l'administrateur
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Code d'invitation</Label>
                  <Input
                    id="invite-code"
                    placeholder="AB12CD34"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className={cn("h-12 text-center text-lg tracking-[0.3em] uppercase font-mono", supportsLiquidGlass && "glass-input")}
                    maxLength={8}
                    disabled={joinLoading}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleJoinWorkspace} 
                  className="w-full h-11"
                  disabled={joinLoading || !inviteCode.trim()}
                >
                  {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rejoindre'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Workspace */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <button 
                className={cn(
                  "group flex flex-col items-start gap-3 p-4 rounded-xl border transition-all duration-200",
                  supportsLiquidGlass ? "glass-card" : "bg-secondary/50 hover:bg-secondary/80 border-border/30",
                  !canCreateWorkspace && "opacity-40 cursor-not-allowed"
                )}
                disabled={!canCreateWorkspace}
              >
                <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-success" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Créer</p>
                  <p className="text-xs text-muted-foreground">Nouvel espace</p>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className={cn("sm:max-w-md", supportsLiquidGlass && "glass-dialog")}>
              <DialogHeader>
                <DialogTitle className="text-lg font-medium">Créer un espace</DialogTitle>
                <DialogDescription className="text-sm">
                  Un code sera généré pour inviter votre équipe
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nom de l'espace</Label>
                  <Input
                    id="workspace-name"
                    placeholder="Mon Entreprise"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className={cn("h-12", supportsLiquidGlass && "glass-input")}
                    disabled={createLoading}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreateWorkspace} 
                  className="w-full h-11"
                  disabled={createLoading || !newWorkspaceName.trim()}
                >
                  {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        {/* Loading State for Workspaces */}
        {workspacesLoading && !workspacesLoaded && !loadingTimeout && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        )}

        {/* Workspaces List */}
        {(workspacesLoaded || loadingTimeout) && workspaces.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vos espaces</h2>
            <div className="space-y-2">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                    supportsLiquidGlass ? "glass-card" : "bg-card border-border/30 hover:border-border/50",
                    currentWorkspace?.id === workspace.id && "border-primary/30 bg-primary/5"
                  )}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0" onClick={() => handleSelectWorkspace(workspace)}>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground truncate">{workspace.name}</h3>
                      {workspace.role === 'admin' && (
                        <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    
                    {workspace.role === 'admin' && workspace.invite_code && (
                      <button
                        onClick={(e) => copyInviteCode(workspace.invite_code, e)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-0.5 transition-colors"
                      >
                        <span className="font-mono tracking-wider">{workspace.invite_code.toUpperCase()}</span>
                        {copiedCode === workspace.invite_code ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleSelectWorkspace(workspace)}>
                        <ChevronRight className="w-4 h-4 mr-2" />
                        Ouvrir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          setLeaveDialogOpen(workspace.id);
                        }}
                        className="text-warning focus:text-warning"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Quitter
                      </DropdownMenuItem>
                      {workspace.role === 'admin' && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialogOpen(workspace.id);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {(workspacesLoaded || loadingTimeout) && workspaces.length === 0 && (
          <section className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">Aucun espace</h3>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              Créez ou rejoignez un espace pour commencer
            </p>
          </section>
        )}
      </main>

      {/* Leave Workspace Dialog */}
      <AlertDialog open={!!leaveDialogOpen} onOpenChange={() => setLeaveDialogOpen(null)}>
        <AlertDialogContent className={supportsLiquidGlass ? "glass-dialog" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Quitter l'espace ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous ne pourrez plus accéder aux données de cet espace. Vous pourrez le rejoindre à nouveau avec un code d'invitation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leaveDialogOpen && handleLeaveWorkspace(leaveDialogOpen)}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
              disabled={!!actionLoading}
            >
              {actionLoading === leaveDialogOpen ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Quitter'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Workspace Dialog */}
      <AlertDialog open={!!deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(null)}>
        <AlertDialogContent className={supportsLiquidGlass ? "glass-dialog" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Supprimer définitivement ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données de l'espace seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialogOpen && handleDeleteWorkspace(deleteDialogOpen)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!actionLoading}
            >
              {actionLoading === deleteDialogOpen ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Workspaces;
