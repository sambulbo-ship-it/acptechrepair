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
  Check,
  Wrench,
  ScanLine,
  TrendingUp,
  Activity,
  Calendar,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface WorkspaceWithStats {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  primary_color: string | null;
  logo_url: string | null;
  member_count: number;
  machine_count: number;
  scan_count: number;
  entry_count: number;
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

interface AnalyticsData {
  totalMachines: number;
  totalScans: number;
  totalEntries: number;
  machinesByStatus: { name: string; value: number; color: string }[];
  activityByDay: { date: string; scans: number; entries: number }[];
  topWorkspaces: { name: string; machines: number; scans: number }[];
}

const CHART_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

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
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalMachines: 0,
    totalScans: 0,
    totalEntries: 0,
    machinesByStatus: [],
    activityByDay: [],
    topWorkspaces: [],
  });

  // Redirect if not app admin
  useEffect(() => {
    if (!isAppAdmin) {
      navigate('/');
      toast.error('Accès non autorisé');
    }
  }, [isAppAdmin, navigate]);

  const fetchAnalytics = async () => {
    try {
      // Fetch all machines with status
      const { data: machinesData } = await supabase
        .from('machines')
        .select('id, status, workspace_id');

      // Fetch all scans from last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data: scansData } = await supabase
        .from('scan_history')
        .select('id, scanned_at, workspace_id')
        .gte('scanned_at', thirtyDaysAgo);

      // Fetch all diagnostic entries from last 30 days
      const { data: entriesData } = await supabase
        .from('diagnostic_entries')
        .select('id, created_at, machine_id');

      // Calculate machines by status
      const statusCounts = (machinesData || []).reduce((acc, m) => {
        acc[m.status] = (acc[m.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusLabels: Record<string, string> = {
        operational: 'Opérationnel',
        maintenance: 'Maintenance',
        repair: 'En réparation',
        broken: 'Hors service',
      };

      const statusColors: Record<string, string> = {
        operational: '#22c55e',
        maintenance: '#eab308',
        repair: '#f97316',
        broken: '#ef4444',
      };

      const machinesByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        color: statusColors[status] || '#8b5cf6',
      }));

      // Calculate activity by day (last 14 days)
      const last14Days = eachDayOfInterval({
        start: subDays(new Date(), 13),
        end: new Date(),
      });

      const activityByDay = last14Days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const scansCount = (scansData || []).filter(s => {
          const scanDate = new Date(s.scanned_at);
          return scanDate >= dayStart && scanDate < dayEnd;
        }).length;

        const entriesCount = (entriesData || []).filter(e => {
          const entryDate = new Date(e.created_at);
          return entryDate >= dayStart && entryDate < dayEnd;
        }).length;

        return {
          date: format(day, 'dd/MM', { locale: fr }),
          scans: scansCount,
          entries: entriesCount,
        };
      });

      setAnalytics({
        totalMachines: machinesData?.length || 0,
        totalScans: scansData?.length || 0,
        totalEntries: entriesData?.length || 0,
        machinesByStatus,
        activityByDay,
        topWorkspaces: [],
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all workspaces
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*');

      if (workspacesError) throw workspacesError;

      // Get stats for each workspace
      const workspacesWithStats: WorkspaceWithStats[] = await Promise.all(
        (workspacesData || []).map(async (ws) => {
          const [memberResult, machineResult, scanResult, entryResult] = await Promise.all([
            supabase.from('workspace_members').select('*', { count: 'exact', head: true }).eq('workspace_id', ws.id),
            supabase.from('machines').select('*', { count: 'exact', head: true }).eq('workspace_id', ws.id),
            supabase.from('scan_history').select('*', { count: 'exact', head: true }).eq('workspace_id', ws.id),
            supabase.from('machines').select('id').eq('workspace_id', ws.id).then(async ({ data }) => {
              if (!data?.length) return { count: 0 };
              const machineIds = data.map(m => m.id);
              const { count } = await supabase
                .from('diagnostic_entries')
                .select('*', { count: 'exact', head: true })
                .in('machine_id', machineIds);
              return { count };
            }),
          ]);

          return {
            ...ws,
            member_count: memberResult.count || 0,
            machine_count: machineResult.count || 0,
            scan_count: scanResult.count || 0,
            entry_count: entryResult.count || 0,
          };
        })
      );

      // Sort by activity (machines + scans)
      workspacesWithStats.sort((a, b) => (b.machine_count + b.scan_count) - (a.machine_count + a.scan_count));
      setWorkspaces(workspacesWithStats);

      // Fetch all workspace members
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_members')
        .select(`
          user_id,
          role,
          joined_at,
          workspace_id,
          workspaces (id, name)
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
            email: member.user_id,
            workspaces: [workspaceInfo],
            is_app_admin: adminsData?.some(a => a.user_id === member.user_id) || false,
            joined_at: member.joined_at,
          });
        }
      }

      setUsers(Array.from(usersMap.values()));

      // Fetch analytics data
      await fetchAnalytics();

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
      const existingAdmin = appAdmins.find(a => a.user_id === newAdminEmail.trim());
      if (existingAdmin) {
        toast.error('Cet utilisateur est déjà un Super Admin');
        return;
      }

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
        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Workspaces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                <span className="text-2xl font-bold">{workspaces.length}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-500" />
                <span className="text-2xl font-bold">{users.length}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Machines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wrench className="w-6 h-6 text-green-500" />
                <span className="text-2xl font-bold">{analytics.totalMachines}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Scans (30j)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ScanLine className="w-6 h-6 text-purple-500" />
                <span className="text-2xl font-bold">{analytics.totalScans}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-orange-500" />
                <span className="text-2xl font-bold">{analytics.totalEntries}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Super Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-500" />
                <span className="text-2xl font-bold">{appAdmins.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Activité (14 derniers jours)</CardTitle>
              </div>
              <CardDescription>Scans et diagnostics par jour</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics.activityByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="scans" 
                      name="Scans"
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="entries" 
                      name="Diagnostics"
                      stroke="#f97316" 
                      strokeWidth={2}
                      dot={{ fill: '#f97316' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">État des Machines</CardTitle>
              </div>
              <CardDescription>Répartition par statut</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : analytics.machinesByStatus.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={analytics.machinesByStatus}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                      >
                        {analytics.machinesByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {analytics.machinesByStatus.map((status, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: status.color }}
                          />
                          <span className="text-sm">{status.name}</span>
                        </div>
                        <span className="font-medium">{status.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Workspaces Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Workspaces les plus actifs</CardTitle>
            </div>
            <CardDescription>Classement par nombre de machines et scans</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={workspaces.slice(0, 10).map(ws => ({
                    name: ws.name.length > 15 ? ws.name.substring(0, 15) + '...' : ws.name,
                    machines: ws.machine_count,
                    scans: ws.scan_count,
                    entries: ws.entry_count,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    width={120}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="machines" name="Machines" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="scans" name="Scans" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="entries" name="Diagnostics" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

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
                  Liste complète des espaces de travail ({workspaces.length} au total)
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
                          <TableHead>Code</TableHead>
                          <TableHead className="text-center">Membres</TableHead>
                          <TableHead className="text-center">Machines</TableHead>
                          <TableHead className="text-center">Scans</TableHead>
                          <TableHead className="text-center">Diagnostics</TableHead>
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
                              <div className="flex items-center gap-1">
                                <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                  {ws.invite_code}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
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
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                                {ws.machine_count}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">
                                {ws.scan_count}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                                {ws.entry_count}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {format(new Date(ws.created_at), 'dd MMM yyyy', { locale: fr })}
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredWorkspaces.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                  Liste des utilisateurs et leurs appartenances ({users.length} au total)
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
