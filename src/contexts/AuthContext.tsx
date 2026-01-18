import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Workspace {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  role: 'admin' | 'member';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  joinWorkspace: (inviteCode: string) => Promise<{ error: Error | null; workspace?: Workspace }>;
  createWorkspace: (name: string) => Promise<{ error: Error | null; workspace?: Workspace }>;
  refreshWorkspaces: () => Promise<void>;
  isWorkspaceAdmin: boolean;
  canCreateWorkspace: boolean;
  isAppAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_WORKSPACE_KEY = 'current_workspace_id';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [isAppAdmin, setIsAppAdmin] = useState(false);
  
  // Refs to prevent memory leaks and race conditions
  const isMountedRef = useRef(true);
  const fetchingWorkspacesRef = useRef(false);

  // Check if current user is admin of current workspace
  const isWorkspaceAdmin = currentWorkspace?.role === 'admin';

  // Check if user can create workspace (app admins can always create, or users without workspaces)
  const canCreateWorkspace = isAppAdmin || workspaces.some(w => w.role === 'admin') || workspaces.length === 0;

  const checkAppAdmin = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('app_admins')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!isMountedRef.current) return;
      
      if (error) {
        console.error('Error checking app admin:', error);
        setIsAppAdmin(false);
        return;
      }
      
      setIsAppAdmin(!!data);
    } catch (err) {
      console.error('checkAppAdmin error:', err);
      setIsAppAdmin(false);
    }
  };

  const refreshWorkspaces = async () => {
    if (!user || fetchingWorkspacesRef.current) {
      if (!user) setWorkspaces([]);
      return;
    }

    fetchingWorkspacesRef.current = true;

    try {
      // Check if user is app admin
      await checkAppAdmin(user.id);

      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id,
          role,
          workspaces (
            id,
            name,
            invite_code,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (!isMountedRef.current) return;

      if (error) {
        console.error('Error fetching workspaces:', error);
        return;
      }

      const fetchedWorkspaces: Workspace[] = (data || [])
        .filter(item => item.workspaces)
        .map(item => ({
          id: item.workspaces.id,
          name: item.workspaces.name,
          invite_code: item.workspaces.invite_code,
          created_at: item.workspaces.created_at,
          role: item.role as 'admin' | 'member',
        }));

      setWorkspaces(fetchedWorkspaces);

      // Restore current workspace from localStorage or pick first
      const savedWorkspaceId = localStorage.getItem(CURRENT_WORKSPACE_KEY);
      if (savedWorkspaceId) {
        const saved = fetchedWorkspaces.find(w => w.id === savedWorkspaceId);
        if (saved) {
          setCurrentWorkspaceState(saved);
        } else if (fetchedWorkspaces.length > 0) {
          setCurrentWorkspaceState(fetchedWorkspaces[0]);
          localStorage.setItem(CURRENT_WORKSPACE_KEY, fetchedWorkspaces[0].id);
        } else {
          setCurrentWorkspaceState(null);
        }
      } else if (fetchedWorkspaces.length > 0) {
        setCurrentWorkspaceState(fetchedWorkspaces[0]);
        localStorage.setItem(CURRENT_WORKSPACE_KEY, fetchedWorkspaces[0].id);
      } else {
        setCurrentWorkspaceState(null);
      }
    } catch (err) {
      console.error('refreshWorkspaces error:', err);
    } finally {
      fetchingWorkspacesRef.current = false;
    }
  };

  const setCurrentWorkspace = (workspace: Workspace | null) => {
    setCurrentWorkspaceState(workspace);
    if (workspace) {
      localStorage.setItem(CURRENT_WORKSPACE_KEY, workspace.id);
    } else {
      localStorage.removeItem(CURRENT_WORKSPACE_KEY);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMountedRef.current) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Defer workspace fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            if (isMountedRef.current) {
              refreshWorkspaces();
            }
          }, 0);
        } else {
          setWorkspaces([]);
          setCurrentWorkspaceState(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMountedRef.current) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setTimeout(() => {
          if (isMountedRef.current) {
            refreshWorkspaces();
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('signOut error:', err);
    } finally {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      localStorage.removeItem(CURRENT_WORKSPACE_KEY);
    }
  };

  const joinWorkspace = async (inviteCode: string): Promise<{ error: Error | null; workspace?: Workspace }> => {
    if (!user) {
      return { error: new Error('Non connecté') };
    }

    if (!inviteCode?.trim()) {
      return { error: new Error('Code d\'invitation requis') };
    }

    try {
      // Find workspace by invite code (case insensitive)
      const { data: workspaceData, error: findError } = await supabase
        .from('workspaces')
        .select('id, name, invite_code, created_at')
        .ilike('invite_code', inviteCode.trim())
        .maybeSingle();

      if (findError) {
        console.error('Find workspace error:', findError);
        return { error: new Error('Erreur lors de la recherche') };
      }

      if (!workspaceData) {
        return { error: new Error('Code d\'invitation invalide') };
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceData.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        return { error: new Error('Vous êtes déjà membre de cet espace') };
      }

      // Join workspace as member
      const { error: joinError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceData.id,
          user_id: user.id,
          role: 'member',
        });

      if (joinError) {
        console.error('Join error:', joinError);
        return { error: new Error('Erreur lors de la connexion à l\'espace') };
      }

      await refreshWorkspaces();

      const workspace: Workspace = {
        id: workspaceData.id,
        name: workspaceData.name,
        invite_code: workspaceData.invite_code,
        created_at: workspaceData.created_at,
        role: 'member',
      };

      return { error: null, workspace };
    } catch (err) {
      console.error('joinWorkspace error:', err);
      return { error: new Error('Erreur inattendue') };
    }
  };

  const createWorkspace = async (name: string): Promise<{ error: Error | null; workspace?: Workspace }> => {
    if (!user) {
      return { error: new Error('Non connecté') };
    }

    if (!name?.trim()) {
      return { error: new Error('Nom requis') };
    }

    try {
      // Create workspace
      const { data: workspaceData, error: createError } = await supabase
        .from('workspaces')
        .insert({
          name: name.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Create workspace error:', createError);
        return { error: new Error('Erreur lors de la création de l\'espace') };
      }

      if (!workspaceData) {
        return { error: new Error('Espace non créé') };
      }

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceData.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) {
        console.error('Add member error:', memberError);
        // Try to cleanup the workspace
        await supabase.from('workspaces').delete().eq('id', workspaceData.id);
        return { error: new Error('Erreur lors de l\'ajout comme admin') };
      }

      await refreshWorkspaces();

      const workspace: Workspace = {
        id: workspaceData.id,
        name: workspaceData.name,
        invite_code: workspaceData.invite_code,
        created_at: workspaceData.created_at,
        role: 'admin',
      };

      return { error: null, workspace };
    } catch (err) {
      console.error('createWorkspace error:', err);
      return { error: new Error('Erreur inattendue') };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      workspaces,
      currentWorkspace,
      setCurrentWorkspace,
      signIn,
      signUp,
      signOut,
      joinWorkspace,
      createWorkspace,
      refreshWorkspaces,
      isWorkspaceAdmin,
      canCreateWorkspace,
      isAppAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
