import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  Crown
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const Workspaces = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { 
    user, 
    workspaces, 
    currentWorkspace, 
    setCurrentWorkspace, 
    joinWorkspace, 
    createWorkspace,
    canCreateWorkspace,
    signOut,
    loading,
    isAppAdmin
  } = useAuth();

  const [inviteCode, setInviteCode] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
      toast.success(`Espace "${workspace.name}" créé !`);
      setNewWorkspaceName('');
      setCreateDialogOpen(false);
      setCurrentWorkspace(workspace);
      navigate('/');
    }
  };

  const handleSelectWorkspace = (workspace: typeof workspaces[0]) => {
    setCurrentWorkspace(workspace);
    navigate('/');
  };

  const copyInviteCode = async (code: string) => {
    await navigator.clipboard.writeText(code.toUpperCase());
    setCopiedCode(code);
    toast.success('Code copié !');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-effect border-b border-border/50 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-semibold text-foreground">Espaces de travail</h1>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* User Info */}
        <div className="ios-card p-4">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Connecté en tant que</p>
            {isAppAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded-full text-xs font-medium">
                <Crown className="w-3 h-3" />
                Super Admin
              </span>
            )}
          </div>
          <p className="font-medium text-foreground truncate">{user?.email}</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {/* Join Workspace */}
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <button className="ios-card p-4 flex flex-col items-center gap-2 hover:bg-secondary/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Rejoindre</span>
                <span className="text-xs text-muted-foreground">avec un code</span>
              </button>
            </DialogTrigger>
            <DialogContent className="mx-4">
              <DialogHeader>
                <DialogTitle>Rejoindre un espace</DialogTitle>
                <DialogDescription>
                  Entrez le code d'invitation fourni par l'administrateur
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">Code d'invitation</Label>
                  <Input
                    id="invite-code"
                    placeholder="ex: AB12CD34"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="h-12 bg-secondary border-0 text-center text-lg tracking-widest uppercase"
                    maxLength={8}
                    disabled={joinLoading}
                  />
                </div>
                <Button 
                  onClick={handleJoinWorkspace} 
                  className="w-full h-12"
                  disabled={joinLoading}
                >
                  {joinLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Rejoindre'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Workspace */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <button 
                className={cn(
                  "ios-card p-4 flex flex-col items-center gap-2 transition-colors",
                  canCreateWorkspace ? "hover:bg-secondary/50" : "opacity-50 cursor-not-allowed"
                )}
                disabled={!canCreateWorkspace}
              >
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-success" />
                </div>
                <span className="text-sm font-medium text-foreground">Créer</span>
                <span className="text-xs text-muted-foreground">nouvel espace</span>
              </button>
            </DialogTrigger>
            <DialogContent className="mx-4">
              <DialogHeader>
                <DialogTitle>Créer un espace</DialogTitle>
                <DialogDescription>
                  Un code d'invitation sera généré pour inviter votre équipe
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">Nom de l'espace</Label>
                  <Input
                    id="workspace-name"
                    placeholder="ex: Mon Entreprise"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="h-12 bg-secondary border-0"
                    disabled={createLoading}
                  />
                </div>
                <Button 
                  onClick={handleCreateWorkspace} 
                  className="w-full h-12"
                  disabled={createLoading}
                >
                  {createLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Créer l\'espace'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!canCreateWorkspace && (
          <p className="text-xs text-muted-foreground text-center">
            Seuls les administrateurs peuvent créer de nouveaux espaces
          </p>
        )}

        {/* Workspaces List */}
        {workspaces.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-1">Vos espaces</h2>
            <div className="space-y-2">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className={cn(
                    "ios-card p-4 flex items-center gap-3",
                    currentWorkspace?.id === workspace.id && "ring-2 ring-primary"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">{workspace.name}</h3>
                      {workspace.role === 'admin' && (
                        <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    
                    {workspace.role === 'admin' && (
                      <button
                        onClick={() => copyInviteCode(workspace.invite_code)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1"
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

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSelectWorkspace(workspace)}
                    className="flex-shrink-0"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {workspaces.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Aucun espace
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Créez un espace pour votre entreprise ou rejoignez-en un avec un code d'invitation
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workspaces;
