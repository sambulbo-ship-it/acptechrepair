import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Machine, DiagnosticEntry } from '@/types/machine';
import { getCategoryLabel, EquipmentCategory } from '@/data/equipmentData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Wrench, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface RecentRepairsSuggestionsProps {
  machines: Machine[];
  entries: DiagnosticEntry[];
}

interface MachineSuggestion {
  machine: Machine;
  lastEntry: DiagnosticEntry | null;
  commonInterventions: { type: string; count: number }[];
  totalInterventions: number;
}

// Common interventions per category type (based on typical issues)
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

export const RecentRepairsSuggestions = ({ machines, entries }: RecentRepairsSuggestionsProps) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const dateLocale = language === 'fr' ? fr : enUS;

  // Get machines with recent activity (sorted by last intervention)
  const suggestions = useMemo((): MachineSuggestion[] => {
    return machines
      .map(machine => {
        const machineEntries = entries.filter(e => e.machineId === machine.id);
        const sortedEntries = [...machineEntries].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        // Count interventions by type
        const typeCounts: Record<string, number> = {};
        machineEntries.forEach(entry => {
          typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1;
        });
        
        const commonInterventions = Object.entries(typeCounts)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        return {
          machine,
          lastEntry: sortedEntries[0] || null,
          commonInterventions,
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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          {language === 'fr' ? 'Réparations récentes' : 'Recent Repairs'}
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
            {categorizedSuggestions[cat].map(({ machine, lastEntry, commonInterventions, totalInterventions }) => (
              <Card
                key={machine.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/machine/${machine.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        {machine.name}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </CardTitle>
                      <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                        <span>
                          {language === 'fr' ? 'N° interne' : 'Internal #'}: <span className="font-mono text-foreground">#{machine.serialNumber?.slice(0, 3) || '---'}</span>
                        </span>
                        <span>
                          {language === 'fr' ? 'N° série' : 'Serial #'}: <span className="font-mono text-foreground">{machine.serialNumber || '---'}</span>
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {totalInterventions} {language === 'fr' ? 'interventions' : 'interventions'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Last intervention */}
                  {lastEntry && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-secondary/50">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {language === 'fr' ? 'Dernière intervention' : 'Last intervention'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(lastEntry.date), 'dd MMM yyyy', { locale: dateLocale })} — {getEntryTypeLabel(lastEntry.type)}
                        </p>
                        {lastEntry.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {lastEntry.description.slice(0, 80)}{lastEntry.description.length > 80 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Common interventions for this machine or category defaults */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Wrench className="w-3.5 h-3.5" />
                      {language === 'fr' ? 'Interventions courantes' : 'Common interventions'}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {commonInterventions.length > 0 ? (
                        commonInterventions.map(({ type, count }) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {getEntryTypeLabel(type)} ({count})
                          </Badge>
                        ))
                      ) : (
                        categoryCommonIssues[machine.category]?.slice(0, 3).map((issue, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs text-muted-foreground">
                            {issue[language]}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
