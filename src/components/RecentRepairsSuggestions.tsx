import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Machine, DiagnosticEntry } from '@/types/machine';
import { getCategoryLabel, EquipmentCategory } from '@/data/equipmentData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wrench, Calendar, TrendingUp, ChevronRight, History, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface RecentRepairsSuggestionsProps {
  machines: Machine[];
  entries: DiagnosticEntry[];
}

interface MachineSuggestion {
  machine: Machine;
  lastEntry: DiagnosticEntry | null;
  commonDescriptions: { description: string; count: number }[];
  allEntries: DiagnosticEntry[];
  totalInterventions: number;
}

// Common interventions per category type (shown when no history exists)
const categoryCommonIssues: Record<EquipmentCategory, { fr: string; en: string }[]> = {
  'mixing-console': [
    { fr: 'Nettoyage des faders', en: 'Fader cleaning' },
    { fr: 'Remplacement des potentiomètres', en: 'Potentiometer replacement' },
    { fr: 'Mise à jour firmware', en: 'Firmware update' },
  ],
  'amplifier': [
    { fr: 'Remplacement ventilateurs', en: 'Fan replacement' },
    { fr: 'Nettoyage circuit', en: 'Circuit cleaning' },
    { fr: 'Vérification connecteurs', en: 'Connector check' },
  ],
  'lighting': [
    { fr: 'Remplacement lampe/LED', en: 'Lamp/LED replacement' },
    { fr: 'Nettoyage lentilles', en: 'Lens cleaning' },
    { fr: 'Lubrification moteurs', en: 'Motor lubrication' },
  ],
  'computer': [
    { fr: 'Réinstallation système', en: 'System reinstall' },
    { fr: 'Remplacement SSD/RAM', en: 'SSD/RAM replacement' },
    { fr: 'Nettoyage thermique', en: 'Thermal cleaning' },
  ],
  'speaker': [
    { fr: 'Remplacement haut-parleur', en: 'Speaker replacement' },
    { fr: 'Réparation connecteur', en: 'Connector repair' },
    { fr: 'Test impédance', en: 'Impedance test' },
  ],
  'microphone': [
    { fr: 'Remplacement capsule', en: 'Capsule replacement' },
    { fr: 'Nettoyage grille', en: 'Grille cleaning' },
    { fr: 'Synchronisation fréquences', en: 'Frequency sync' },
  ],
  'video': [
    { fr: 'Calibration couleurs', en: 'Color calibration' },
    { fr: 'Remplacement câbles', en: 'Cable replacement' },
    { fr: 'Mise à jour firmware', en: 'Firmware update' },
  ],
  'controller': [
    { fr: 'Remplacement encodeurs', en: 'Encoder replacement' },
    { fr: 'Nettoyage écran tactile', en: 'Touchscreen cleaning' },
    { fr: 'Sauvegarde/restauration shows', en: 'Show backup/restore' },
  ],
  'other': [
    { fr: 'Maintenance générale', en: 'General maintenance' },
    { fr: 'Inspection visuelle', en: 'Visual inspection' },
    { fr: 'Tests fonctionnels', en: 'Functional tests' },
  ],
};

// Helper to extract key terms from description for grouping similar repairs
const extractKeyTerms = (description: string): string => {
  // Normalize and get first meaningful part (up to 50 chars or first sentence)
  const normalized = description.toLowerCase().trim();
  const firstSentence = normalized.split(/[.!?]/)[0];
  return firstSentence.slice(0, 50).trim();
};

export const RecentRepairsSuggestions = ({ machines, entries }: RecentRepairsSuggestionsProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const dateLocale = language === 'fr' ? fr : enUS;
  
  const [historyMachine, setHistoryMachine] = useState<MachineSuggestion | null>(null);

  // Get machines with recent activity and analyze their repair patterns
  const suggestions = useMemo((): MachineSuggestion[] => {
    return machines
      .map(machine => {
        const machineEntries = entries.filter(e => e.machineId === machine.id);
        const sortedEntries = [...machineEntries].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        // Group by description patterns to find most common repairs
        const descriptionCounts: Record<string, { original: string; count: number }> = {};
        machineEntries.forEach(entry => {
          if (entry.description) {
            const key = extractKeyTerms(entry.description);
            if (key) {
              if (!descriptionCounts[key]) {
                descriptionCounts[key] = { original: entry.description, count: 0 };
              }
              descriptionCounts[key].count++;
            }
          }
        });
        
        // Sort by frequency
        const commonDescriptions = Object.values(descriptionCounts)
          .map(({ original, count }) => ({ description: original, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        return {
          machine,
          lastEntry: sortedEntries[0] || null,
          commonDescriptions,
          allEntries: sortedEntries,
          totalInterventions: machineEntries.length,
        };
      })
      .filter(s => s.totalInterventions > 0)
      .sort((a, b) => {
        if (!a.lastEntry) return 1;
        if (!b.lastEntry) return -1;
        return new Date(b.lastEntry.date).getTime() - new Date(a.lastEntry.date).getTime();
      })
      .slice(0, 10);
  }, [machines, entries]);

  // Group by category
  const categorizedSuggestions = useMemo(() => {
    const grouped: Record<string, MachineSuggestion[]> = {};
    suggestions.forEach(s => {
      const cat = s.machine.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });
    return grouped;
  }, [suggestions]);

  const getEntryTypeLabel = (type: string) => {
    const labels: Record<string, { fr: string; en: string }> = {
      diagnostic: { fr: 'Diagnostic', en: 'Diagnostic' },
      repair: { fr: 'Réparation', en: 'Repair' },
      replacement: { fr: 'Remplacement', en: 'Replacement' },
      change: { fr: 'Modification', en: 'Change' },
    };
    return labels[type]?.[language] || type;
  };

  if (suggestions.length === 0) {
    return null;
  }

  const categories = Object.keys(categorizedSuggestions) as EquipmentCategory[];

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            {language === 'fr' ? 'Suggestions de réparations' : 'Repair Suggestions'}
          </h2>
        </div>

        <Tabs defaultValue={categories[0]} className="w-full">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max gap-1 bg-secondary/50 p-1 mb-3">
              {categories.map(cat => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="px-3 py-1.5 text-sm whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {getCategoryLabel(cat, language)}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {categories.map(cat => (
            <TabsContent key={cat} value={cat} className="mt-0 space-y-3">
              {categorizedSuggestions[cat].map((suggestion) => {
                const { machine, lastEntry, commonDescriptions, totalInterventions } = suggestion;
                
                return (
                  <Card key={machine.id} className="overflow-hidden">
                    <CardHeader 
                      className="pb-2 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => navigate(`/machine/${machine.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            {machine.name}
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </CardTitle>
                          <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                            <span>
                              {language === 'fr' ? 'N° interne' : 'Internal #'}: <span className="font-mono text-foreground font-medium">#{machine.serialNumber?.slice(0, 3) || '---'}</span>
                            </span>
                            <span>
                              {language === 'fr' ? 'N° série officiel' : 'Official serial #'}: <span className="font-mono text-foreground">{machine.serialNumber || '---'}</span>
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {totalInterventions} {language === 'fr' ? 'interventions' : 'interventions'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 pt-0">
                      {/* Last intervention - prominently displayed */}
                      {lastEntry && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <Calendar className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-foreground">
                                {language === 'fr' ? 'Dernière intervention' : 'Last intervention'}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {format(new Date(lastEntry.date), 'dd MMM yyyy', { locale: dateLocale })}
                              </Badge>
                            </div>
                            <p className="text-sm text-primary font-medium mt-1">
                              {getEntryTypeLabel(lastEntry.type)}
                            </p>
                            {lastEntry.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {lastEntry.description.slice(0, 100)}{lastEntry.description.length > 100 ? '...' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Most common interventions for THIS specific machine */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <Wrench className="w-4 h-4 text-primary" />
                          {language === 'fr' ? 'Interventions les plus courantes' : 'Most common interventions'}
                        </div>
                        <div className="space-y-1.5">
                          {commonDescriptions.length > 0 ? (
                            commonDescriptions.map(({ description, count }, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-2 rounded-md bg-secondary/50 text-sm"
                              >
                                <span className="text-foreground truncate flex-1 mr-2">
                                  {description.slice(0, 60)}{description.length > 60 ? '...' : ''}
                                </span>
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                  {count}x
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground italic">
                              {language === 'fr' 
                                ? 'Suggestions basées sur le type de machine :' 
                                : 'Suggestions based on machine type:'}
                            </div>
                          )}
                          {commonDescriptions.length === 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {categoryCommonIssues[machine.category]?.slice(0, 3).map((issue, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {issue[language]}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* History button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHistoryMachine(suggestion);
                        }}
                      >
                        <History className="w-4 h-4 mr-2" />
                        {language === 'fr' ? 'Voir l\'historique complet' : 'View full history'}
                        <Badge variant="secondary" className="ml-2">
                          {totalInterventions}
                        </Badge>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Full History Dialog */}
      <Dialog open={!!historyMachine} onOpenChange={() => setHistoryMachine(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              {language === 'fr' ? 'Historique complet' : 'Full History'}
            </DialogTitle>
            {historyMachine && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{historyMachine.machine.name}</span>
                <span className="mx-2">•</span>
                <span className="font-mono">#{historyMachine.machine.serialNumber || '---'}</span>
              </div>
            )}
          </DialogHeader>
          
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3 pb-4">
              {historyMachine?.allEntries.map((entry, idx) => (
                <div 
                  key={entry.id} 
                  className="relative pl-6 pb-3 border-l-2 border-secondary last:pb-0"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={entry.type === 'repair' ? 'default' : 'secondary'} className="text-xs">
                        {getEntryTypeLabel(entry.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(entry.date), 'dd MMM yyyy', { locale: dateLocale })}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-foreground">{entry.description}</p>
                    )}
                    {entry.technicianName && (
                      <p className="text-xs text-muted-foreground">
                        {language === 'fr' ? 'Par' : 'By'}: {entry.technicianName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {historyMachine?.allEntries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {language === 'fr' ? 'Aucune intervention enregistrée' : 'No interventions recorded'}
                </p>
              )}
            </div>
          </ScrollArea>

          <div className="pt-4 border-t">
            <Button 
              className="w-full"
              onClick={() => {
                if (historyMachine) {
                  navigate(`/machine/${historyMachine.machine.id}`);
                  setHistoryMachine(null);
                }
              }}
            >
              {language === 'fr' ? 'Voir la fiche machine' : 'View machine details'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
