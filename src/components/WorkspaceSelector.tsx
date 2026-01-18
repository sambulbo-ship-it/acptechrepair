import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const WorkspaceSelector = () => {
  const navigate = useNavigate();
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useAuth();

  if (!currentWorkspace) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
          {currentWorkspace.name}
        </span>
        {currentWorkspace.role === 'admin' && (
          <Shield className="w-3 h-3 text-primary" />
        )}
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => setCurrentWorkspace(workspace)}
            className={cn(
              "flex items-center gap-2",
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
        <DropdownMenuItem onClick={() => navigate('/workspaces')}>
          Gérer les espaces
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
