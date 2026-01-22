import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, Shield, Crown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const WorkspaceSelector = () => {
  const navigate = useNavigate();
  const { workspaces, currentWorkspace, setCurrentWorkspace, isAppAdmin } = useAuth();

  const handleWorkspaceSelect = (workspace: typeof workspaces[0]) => {
    setCurrentWorkspace(workspace);
    // Force a page reload to ensure all data is refreshed for the new workspace
    window.location.reload();
  };

  const handleManageWorkspaces = () => {
    navigate('/workspaces');
  };

  if (!currentWorkspace) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 px-3 py-2 h-auto rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
            {currentWorkspace.name}
          </span>
          {isAppAdmin && (
            <Crown className="w-3 h-3 text-amber-500" />
          )}
          {!isAppAdmin && currentWorkspace.role === 'admin' && (
            <Shield className="w-3 h-3 text-primary" />
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 z-50">
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => handleWorkspaceSelect(workspace)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              currentWorkspace.id === workspace.id && "bg-primary/10"
            )}
          >
            <Building2 className="w-4 h-4" />
            <span className="flex-1 truncate">{workspace.name}</span>
            {workspace.role === 'admin' && (
              <Shield className="w-3 h-3 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleManageWorkspaces} className="cursor-pointer">
          Gérer les espaces
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
