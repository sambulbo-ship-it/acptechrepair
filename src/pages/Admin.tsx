import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Crown, 
  Shield, 
  UserPlus, 
  Trash2,
  Search,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WorkspaceWithStats {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  primary_color: string | null;
  logo_url: string | null;
  member_count: number;
  machine_count: number;
}

interface UserWithWorkspaces {
  user_id: string;
  email: string;
  workspaces: {
    workspace_id: string;
    workspace_name: string;
    role: 'admin' | 'member';
  }[];
  is_app_admin: boolean;
  joined_at: string;
}

interface AppAdmin {
  id: string;
  user_id: string;
  created_at: string;
  email?: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { isAppAdmin, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceWithStats[]>([]);
  const [users, setUsers] = useState<UserWithWorkspaces[]>([]);
  const [appAdmins, setAppAdmins] = useState<AppAdmin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Redirect if not app admin
  useEffect(() => {
    if (!isAppAdmin) {
      navigate('/');
      toast.error('Accès non autorisé');
    }
  }, [isAppAdmin, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all workspaces with member and machine counts
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*');

      if (workspacesError) throw workspacesError;

      // Get member counts for each workspace
      const workspacesWithStats: WorkspaceWithStats[] = await Promise.all(
        (workspacesData || []).map(async (ws) => {
          const { count: memberCount } = await supabase
            .from('workspace_members')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', ws.id);

          const { count: machineCount } = await supabase
            .from('machines')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', ws.id);

          return {
            ...ws,
            member_count: memberCount || 0,
            machine_count: machineCount || 0,
          };
        })
      );

      setWorkspaces(workspacesWithStats);

      // Fetch all workspace members with their workspace info
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_members')
        .select(`
          user_id,
          role,
          joined_at,
          workspace_id,
          workspaces (
            id,
            name
          )
        `);

      if (membersError) throw membersError;

      // Fetch app admins
      const { data: adminsData, error: adminsError } = await supabase
        .from('app_admins')
        .select('*');

      if (adminsError) throw adminsError;

      setAppAdmins(adminsData || []);

      // Group users by user_id
      const usersMap = new Map<string, UserWithWorkspaces>();
      
      for (const member of membersData || []) {
        if (!member.workspaces) continue;
        
        const existing = usersMap.get(member.user_id);
        const workspaceInfo = {
          workspace_id: member.workspace_id,
          workspace_name: member.workspaces.name,
          role: member.role as 'admin' | 'member',
        };

        if (existing) {
          existing.workspaces.push(workspaceInfo);
        } else {
          usersMap.set(member.user_id, {
            user_id: member.user_id,
            email: member.user_id, // Will be replaced with actual email if available
            workspaces: [workspaceInfo],
            is_app_admin: adminsData?.some(a => a.user_id === member.user_id) || false,
            joined_at: member.joined_at,
          });
        }
      }

      setUsers(Array.from(usersMap.values()));

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAppAdmin) {
      fetchData();
    }
  }, [isAppAdmin]);

  const copyInviteCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copié !');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const addAppAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('Email requis');
      return;
    }

    setAddingAdmin(true);
    try {
      // First, find the user by checking if they exist in workspace_members
      // Since we can't query auth.users directly, we'll need to add by user_id
      // For now, we'll show an error since we need the user_id
      
      // Check if already an admin
      const existingAdmin = appAdmins.find(a => a.user_id === newAdminEmail.trim());
      if (existingAdmin) {
        toast.error('Cet utilisateur est déjà un Super Admin');
        return;
      }

      // Add as app admin (user needs to provide user_id)
      const { error } = await supabase
        .from('app_admins')
        .insert({ user_id: newAdminEmail.trim() });

      if (error) {
        if (error.code === '23503') {
          toast.error('Utilisateur non trouvé. Utilisez l\'ID utilisateur.');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Super Admin ajouté !');
      setNewAdminEmail('');
      fetchData();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setAddingAdmin(false);
    }
  };

  const removeAppAdmin = async (adminId: string, adminUserId: string) => {
    if (adminUserId === user?.id) {
      toast.error('Vous ne pouvez pas vous retirer vous-même');
      return;
    }

    try {
      const { error } = await supabase
        .from('app_admins')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      toast.success('Super Admin retiré');
      fetchData();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredWorkspaces = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ws.invite_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.workspaces.some(w => w.workspace_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isAppAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/workspaces')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-500" />
                <h1 className="text-xl font-bold">Administration Globale</h1>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Workspaces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-primary" />
                <span className="text-3xl font-bold">{workspaces.length}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-8 h-8 text-blue-500" />
                <span className="text-3xl font-bold">{users.length}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Super Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Crown className="w-8 h-8 text-amber-500" />
                <span className="text-3xl font-bold">{appAdmins.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher workspaces ou utilisateurs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="workspaces" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="workspaces" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Workspaces</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Super Admins</span>
            </TabsTrigger>
          </TabsList>

          {/* Workspaces Tab */}
          <TabsContent value="workspaces">
            <Card>
              <CardHeader>
                <CardTitle>Tous les Workspaces</CardTitle>
                <CardDescription>
                  Liste complète des espaces de travail de l'application
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Code d'invitation</TableHead>
                          <TableHead className="text-center">Membres</TableHead>
                          <TableHead className="text-center">Machines</TableHead>
                          <TableHead>Créé le</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWorkspaces.map((ws) => (
                          <TableRow key={ws.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {ws.logo_url ? (
                                  <img 
                                    src={ws.logo_url} 
                                    alt={ws.name}
                                    className="w-6 h-6 rounded object-cover"
                                  />
                                ) : (
                                  <div 
                                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                                    style={{ backgroundColor: ws.primary_color || '#f97316' }}
                                  >
                                    {ws.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                {ws.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="px-2 py-1 bg-muted rounded text-sm">
                                  {ws.invite_code}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyInviteCode(ws.invite_code)}
                                >
                                  {copiedCode === ws.invite_code ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{ws.member_count}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{ws.machine_count}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(ws.created_at), 'dd MMM yyyy', { locale: fr })}
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredWorkspaces.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Aucun workspace trouvé
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Tous les Utilisateurs</CardTitle>
                <CardDescription>
                  Liste des utilisateurs et leurs appartenances aux workspaces
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID Utilisateur</TableHead>
                          <TableHead>Workspaces</TableHead>
                          <TableHead>Rôle Global</TableHead>
                          <TableHead>Membre depuis</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.user_id}>
                            <TableCell className="font-mono text-xs">
                              {u.user_id.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {u.workspaces.map((w) => (
                                  <Badge 
                                    key={w.workspace_id} 
                                    variant={w.role === 'admin' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {w.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                                    {w.workspace_name}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {u.is_app_admin ? (
                                <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Super Admin
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">Utilisateur</span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(u.joined_at), 'dd MMM yyyy', { locale: fr })}
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Aucun utilisateur trouvé
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admins Tab */}
          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Super Admins</CardTitle>
                <CardDescription>
                  Gérez les administrateurs globaux de l'application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Admin Form */}
                <div className="flex gap-2">
                  <Input
                    placeholder="ID utilisateur (UUID)"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={addAppAdmin} 
                    disabled={addingAdmin || !newAdminEmail.trim()}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </div>

                {/* Admin List */}
                {loading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID Utilisateur</TableHead>
                          <TableHead>Ajouté le</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appAdmins.map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell className="font-mono text-xs">
                              <div className="flex items-center gap-2">
                                <Crown className="w-4 h-4 text-amber-500" />
                                {admin.user_id}
                                {admin.user_id === user?.id && (
                                  <Badge variant="outline" className="text-xs">Vous</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(admin.created_at), 'dd MMM yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    disabled={admin.user_id === user?.id}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Retirer le Super Admin ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cet utilisateur perdra tous ses privilèges d'administration globale.
                                      Cette action est réversible.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => removeAppAdmin(admin.id, admin.user_id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Retirer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                        {appAdmins.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              Aucun Super Admin configuré
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
