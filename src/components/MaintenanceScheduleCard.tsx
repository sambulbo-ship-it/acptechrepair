import { useState } from 'react';
import { format, differenceInDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMaintenanceSchedule, MaintenanceSchedule } from '@/hooks/useMaintenanceSchedule';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { 
  CalendarClock, 
  CalendarCheck, 
  Bell, 
  Settings2, 
  Trash2, 
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface MaintenanceScheduleCardProps {
  machineId: string;
  machineName: string;
}

const INTERVAL_OPTIONS = [
  { value: 7, label: '7 jours' },
  { value: 14, label: '14 jours' },
  { value: 30, label: '30 jours' },
  { value: 60, label: '60 jours' },
  { value: 90, label: '90 jours' },
  { value: 180, label: '6 mois' },
  { value: 365, label: '1 an' },
];

const REMINDER_OPTIONS = [
  { value: 1, label: '1 jour avant' },
  { value: 3, label: '3 jours avant' },
  { value: 7, label: '7 jours avant' },
  { value: 14, label: '14 jours avant' },
];

export const MaintenanceScheduleCard = ({ machineId, machineName }: MaintenanceScheduleCardProps) => {
  const { 
    schedule, 
    loading, 
    createSchedule, 
    updateSchedule, 
    deleteSchedule, 
    markMaintenanceDone 
  } = useMaintenanceSchedule(machineId);

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [intervalDays, setIntervalDays] = useState(30);
  const [reminderDays, setReminderDays] = useState(7);
  const [nextDate, setNextDate] = useState<Date>(addDays(new Date(), 30));
  const [notes, setNotes] = useState('');

  const handleCreate = async () => {
    setSaving(true);
    const { error } = await createSchedule({
      interval_days: intervalDays,
      next_maintenance_date: format(nextDate, 'yyyy-MM-dd'),
      reminder_days_before: reminderDays,
      notes: notes || undefined,
    });
    setSaving(false);

    if (error) {
      toast.error('Erreur lors de la création du planning');
    } else {
      toast.success('Planning de maintenance créé !');
      setIsCreating(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    const { error } = await updateSchedule({
      interval_days: intervalDays,
      next_maintenance_date: format(nextDate, 'yyyy-MM-dd'),
      reminder_days_before: reminderDays,
      notes: notes || null,
    });
    setSaving(false);

    if (error) {
      toast.error('Erreur lors de la mise à jour');
    } else {
      toast.success('Planning mis à jour !');
      setIsEditing(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!schedule) return;
    const { error } = await updateSchedule({ enabled: !schedule.enabled });
    if (error) {
      toast.error('Erreur lors de la mise à jour');
    } else {
      toast.success(schedule.enabled ? 'Rappels désactivés' : 'Rappels activés');
    }
  };

  const handleDelete = async () => {
    const { error } = await deleteSchedule();
    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('Planning supprimé');
    }
  };

  const handleMarkDone = async () => {
    setSaving(true);
    const { error } = await markMaintenanceDone();
    setSaving(false);
    if (error) {
      toast.error('Erreur lors de la mise à jour');
    } else {
      toast.success('Maintenance marquée comme effectuée !');
    }
  };

  const resetForm = () => {
    setIntervalDays(30);
    setReminderDays(7);
    setNextDate(addDays(new Date(), 30));
    setNotes('');
  };

  const openEditDialog = () => {
    if (schedule) {
      setIntervalDays(schedule.interval_days);
      setReminderDays(schedule.reminder_days_before);
      setNextDate(new Date(schedule.next_maintenance_date));
      setNotes(schedule.notes || '');
      setIsEditing(true);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // No schedule - show create button
  if (!schedule) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Maintenance préventive</CardTitle>
          </div>
          <CardDescription>
            Planifiez des rappels de maintenance réguliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Planifier la maintenance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Planifier la maintenance</DialogTitle>
                <DialogDescription>
                  Définissez un planning de maintenance préventive pour {machineName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Fréquence de maintenance</Label>
                  <Select 
                    value={intervalDays.toString()} 
                    onValueChange={(v) => {
                      const days = parseInt(v);
                      setIntervalDays(days);
                      setNextDate(addDays(new Date(), days));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVAL_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prochaine maintenance</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !nextDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {nextDate ? format(nextDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={nextDate}
                        onSelect={(date) => date && setNextDate(date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Rappel</Label>
                  <Select 
                    value={reminderDays.toString()} 
                    onValueChange={(v) => setReminderDays(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    placeholder="Instructions ou notes pour la maintenance..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={saving}>
                  {saving ? 'Création...' : 'Créer le planning'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  // Has schedule - show status
  const daysUntil = differenceInDays(new Date(schedule.next_maintenance_date), new Date());
  const isOverdue = daysUntil < 0;
  const isDueSoon = daysUntil <= schedule.reminder_days_before && daysUntil >= 0;

  return (
    <Card className={cn(
      isOverdue && schedule.enabled && "border-destructive/50",
      isDueSoon && schedule.enabled && "border-warning/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className={cn(
              "w-5 h-5",
              isOverdue && schedule.enabled ? "text-destructive" :
              isDueSoon && schedule.enabled ? "text-warning" :
              "text-muted-foreground"
            )} />
            <CardTitle className="text-base">Maintenance préventive</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={schedule.enabled}
              onCheckedChange={handleToggleEnabled}
              aria-label="Activer les rappels"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div>
            {isOverdue && schedule.enabled ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                En retard de {Math.abs(daysUntil)} jour{Math.abs(daysUntil) > 1 ? 's' : ''}
              </Badge>
            ) : isDueSoon && schedule.enabled ? (
              <Badge variant="outline" className="gap-1 border-warning text-warning">
                <Clock className="w-3 h-3" />
                Dans {daysUntil} jour{daysUntil > 1 ? 's' : ''}
              </Badge>
            ) : schedule.enabled ? (
              <Badge variant="secondary" className="gap-1">
                <CalendarCheck className="w-3 h-3" />
                {format(new Date(schedule.next_maintenance_date), 'dd MMM yyyy', { locale: fr })}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Rappels désactivés
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Tous les {schedule.interval_days} jours
          </p>
        </div>

        {/* Last maintenance */}
        {schedule.last_maintenance_date && (
          <p className="text-xs text-muted-foreground">
            Dernière maintenance : {format(new Date(schedule.last_maintenance_date), 'dd MMM yyyy', { locale: fr })}
          </p>
        )}

        {/* Notes */}
        {schedule.notes && (
          <p className="text-sm text-muted-foreground border-l-2 border-muted pl-3">
            {schedule.notes}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={handleMarkDone}
            disabled={saving}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Maintenance effectuée
          </Button>

          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={openEditDialog}>
                <Settings2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier le planning</DialogTitle>
                <DialogDescription>
                  Modifiez les paramètres de maintenance pour {machineName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Fréquence de maintenance</Label>
                  <Select 
                    value={intervalDays.toString()} 
                    onValueChange={(v) => setIntervalDays(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVAL_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prochaine maintenance</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !nextDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {nextDate ? format(nextDate, "PPP", { locale: fr }) : "Sélectionner"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={nextDate}
                        onSelect={(date) => date && setNextDate(date)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Rappel</Label>
                  <Select 
                    value={reminderDays.toString()} 
                    onValueChange={(v) => setReminderDays(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Instructions ou notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer le planning ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action supprimera définitivement le planning de maintenance.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <div className="flex gap-2 flex-1 justify-end">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleUpdate} disabled={saving}>
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
