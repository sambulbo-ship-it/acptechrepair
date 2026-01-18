import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudData } from '@/hooks/useCloudData';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { User, UserPlus, X, Shield, Users, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const Team = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { isWorkspaceAdmin } = useAuth();
  const { team, addTeamMember, removeTeamMember, loading, error } = useCloudData();
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      toast.error(language === 'fr' ? 'Entrez un nom' : 'Enter a name');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const member = await addTeamMember(newMemberName.trim(), newMemberRole.trim() || undefined);
      if (member) {
        setNewMemberName('');
        setNewMemberRole('');
        setIsSheetOpen(false);
        toast.success(language === 'fr' ? `${member.name} ajouté` : `${member.name} added`);
      } else {
        toast.error(language === 'fr' ? 'Erreur lors de l\'ajout' : 'Error adding member');
      }
    } catch (err) {
      toast.error(language === 'fr' ? 'Une erreur est survenue' : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (deletingId) return; // Prevent double-click
    
    setDeletingId(id);
    
    try {
      const success = await removeTeamMember(id);
      if (success) {
        toast.success(language === 'fr' ? `${name} retiré` : `${name} removed`);
      } else {
        toast.error(language === 'fr' ? 'Erreur lors de la suppression' : 'Error removing member');
      }
    } catch (err) {
      toast.error(language === 'fr' ? 'Une erreur est survenue' : 'An error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      // Reset form when closing
      setNewMemberName('');
      setNewMemberRole('');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        title={t('team')} 
        showBack 
        onBack={() => navigate('/')} 
      />

      <div className="p-4 space-y-6">
        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-xl border border-destructive/30">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Add Member Button */}
        <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
          <SheetTrigger asChild>
            <Button className="w-full h-12 gap-2">
              <UserPlus className="w-5 h-5" />
              {t('addMember')}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>{t('addMember')}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pt-6 pb-8">
              <div className="space-y-2">
                <Label htmlFor="member-name">{t('memberName')} *</Label>
                <Input
                  id="member-name"
                  placeholder={language === 'fr' ? 'Jean Dupont' : 'John Doe'}
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="h-12 bg-secondary border-0"
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-role">{t('memberRole')}</Label>
                <Input
                  id="member-role"
                  placeholder={language === 'fr' ? 'Technicien' : 'Technician'}
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="h-12 bg-secondary border-0"
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>
              <Button 
                onClick={handleAddMember} 
                className="w-full h-12"
                disabled={isSubmitting || !newMemberName.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('save')
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Team Members List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : team.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {t('noTeamMembers')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {language === 'fr' 
                ? 'Ajoutez des membres pour les assigner aux interventions'
                : 'Add members to assign them to interventions'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground px-1">
              {t('teamMembers')} ({team.length})
            </h2>
            {team.map((member) => (
              <div
                key={member.id}
                className="ios-card p-4 flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">
                    {member.name || 'Sans nom'}
                  </h3>
                  {member.role && (
                    <p className="text-sm text-muted-foreground truncate">{member.role}</p>
                  )}
                </div>

                {isWorkspaceAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    disabled={deletingId === member.id}
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Supprimer ${member.name}`}
                  >
                    {deletingId === member.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Admin Info */}
        {!isWorkspaceAdmin && team.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            <Shield className="w-3 h-3 inline mr-1" />
            {language === 'fr' 
              ? 'Seuls les admins peuvent supprimer des membres'
              : 'Only admins can delete members'}
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Team;
