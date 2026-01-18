import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMachines } from '@/hooks/useMachines';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { User, UserPlus, Trash2, Check, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Team = () => {
  const { t, language } = useLanguage();
  const { team, currentUser, addTeamMember, removeTeamMember, setCurrentUser } = useMachines();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: '' });

  const handleAddMember = () => {
    if (!newMember.name.trim()) {
      toast.error(language === 'fr' ? 'Entrez un nom' : 'Enter a name');
      return;
    }

    const member = addTeamMember(newMember.name.trim(), newMember.role.trim() || undefined);
    setNewMember({ name: '', role: '' });
    setIsSheetOpen(false);
    toast.success(language === 'fr' ? 'Membre ajouté' : 'Member added');

    // If this is the first member, auto-select them
    if (team.length === 0) {
      setCurrentUser(member);
    }
  };

  const handleSelectUser = (memberId: string) => {
    const member = team.find(m => m.id === memberId);
    if (member) {
      setCurrentUser(member);
      toast.success(language === 'fr' ? `Connecté en tant que ${member.name}` : `Logged in as ${member.name}`);
    }
  };

  const handleDeleteMember = (memberId: string) => {
    if (confirm(language === 'fr' ? 'Supprimer ce membre?' : 'Delete this member?')) {
      removeTeamMember(memberId);
      if (currentUser?.id === memberId) {
        setCurrentUser(null);
      }
      toast.success(language === 'fr' ? 'Membre supprimé' : 'Member removed');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title={t('team')} />
      
      <div className="p-4 space-y-4">
        {/* Current User Section */}
        <div className="ios-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {t('selectYourself')}
          </h3>
          
          {currentUser ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{currentUser.name}</p>
                  {currentUser.role && (
                    <p className="text-sm text-muted-foreground">{currentUser.role}</p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentUser(null)}
                className="rounded-full"
              >
                {t('switchUser')}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {language === 'fr' 
                ? 'Sélectionnez votre profil ci-dessous'
                : 'Select your profile below'}
            </p>
          )}
        </div>

        {/* Team Members Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('teamMembers')}</h3>
          
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="rounded-full gap-1">
                <UserPlus className="w-4 h-4" />
                {t('addMember')}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-3xl">
              <SheetHeader className="mb-4">
                <SheetTitle>{t('addMember')}</SheetTitle>
              </SheetHeader>
              
              <div className="space-y-4 pb-8">
                <div className="space-y-2">
                  <Label>{t('memberName')} *</Label>
                  <Input
                    value={newMember.name}
                    onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={language === 'fr' ? 'Ex: Jean Dupont' : 'Ex: John Doe'}
                    className="h-12 bg-secondary border-0 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('memberRole')}</Label>
                  <Input
                    value={newMember.role}
                    onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                    placeholder={language === 'fr' ? 'Ex: Technicien son' : 'Ex: Audio Technician'}
                    className="h-12 bg-secondary border-0 rounded-xl"
                  />
                </div>

                <Button onClick={handleAddMember} className="w-full h-14 text-lg rounded-xl">
                  {t('save')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Team Members List */}
        {team.length === 0 ? (
          <div className="ios-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t('noTeamMembers')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {team.map((member) => {
              const isSelected = currentUser?.id === member.id;
              
              return (
                <div
                  key={member.id}
                  className={cn(
                    'ios-card p-4 flex items-center gap-3',
                    isSelected && 'ring-2 ring-primary'
                  )}
                >
                  <button
                    onClick={() => handleSelectUser(member.id)}
                    className="flex items-center gap-3 flex-1 text-left touch-target"
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      isSelected ? 'bg-primary' : 'bg-secondary'
                    )}>
                      <span className={cn(
                        'font-bold text-lg',
                        isSelected ? 'text-primary-foreground' : 'text-secondary-foreground'
                      )}>
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{member.name}</p>
                      {member.role && (
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      )}
                    </div>
                    
                    {isSelected && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg touch-target"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Team;
