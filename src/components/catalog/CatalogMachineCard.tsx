import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCategoryIconComponent } from '@/components/CategoryIcon';
import { getCategoryLabel, EquipmentCategory } from '@/data/equipmentData';
import { cn } from '@/lib/utils';
import { 
  CalendarDays, 
  ShoppingCart, 
  Check, 
  X, 
  Sparkles, 
  FileText,
  ImageOff,
} from 'lucide-react';

export interface CatalogMachine {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  category: string;
  photos: string[] | null;
  workspace_id: string;
  workspace_name: string;
  workspace_logo: string | null;
  workspace_contact_email: string | null;
  workspace_phone: string | null;
  available_for_rental: boolean;
  available_for_sale: boolean;
  daily_rental_price: number | null;
  weekly_rental_price: number | null;
  monthly_rental_price: number | null;
  sale_price: number | null;
  currency: string;
  rental_notes: string | null;
  sale_notes: string | null;
  in_stock: boolean;
  condition: 'new' | 'used' | 'unspecified';
}

interface CatalogMachineCardProps {
  machine: CatalogMachine;
  language: 'en' | 'fr';
  onRequestQuote: (machine: CatalogMachine) => void;
}

const formatPrice = (price: number | null, currency: string, language: 'en' | 'fr') => {
  if (price === null) return null;
  return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(price);
};

export const CatalogMachineCard = ({ machine, language, onRequestQuote }: CatalogMachineCardProps) => {
  const CategoryIcon = getCategoryIconComponent(machine.category as EquipmentCategory);
  const hasPhoto = machine.photos && machine.photos.length > 0;

  // Best price display
  const rentalPrices = [
    { label: language === 'fr' ? '/jour' : '/day', value: machine.daily_rental_price },
    { label: language === 'fr' ? '/sem.' : '/week', value: machine.weekly_rental_price },
    { label: language === 'fr' ? '/mois' : '/month', value: machine.monthly_rental_price },
  ].filter(p => p.value !== null);

  const lowestRental = rentalPrices.length > 0
    ? rentalPrices.reduce((min, p) => (p.value! < min.value! ? p : min))
    : null;

  return (
    <div className="group bg-card border border-border/60 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-muted/30 overflow-hidden">
        {hasPhoto ? (
          <img 
            src={machine.photos![0]} 
            alt={machine.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <CategoryIcon className="w-16 h-16 text-muted-foreground/20" />
          </div>
        )}
        
        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div className="flex gap-1.5">
            {machine.available_for_rental && (
              <Badge className="bg-primary/90 text-primary-foreground border-0 text-[10px] px-2 py-0.5 font-semibold backdrop-blur-sm">
                <CalendarDays className="w-3 h-3 mr-1" />
                {language === 'fr' ? 'Location' : 'Rental'}
              </Badge>
            )}
            {machine.available_for_sale && (
              <Badge className="bg-success/90 text-white border-0 text-[10px] px-2 py-0.5 font-semibold backdrop-blur-sm">
                <ShoppingCart className="w-3 h-3 mr-1" />
                {language === 'fr' ? 'Vente' : 'Sale'}
              </Badge>
            )}
          </div>
          
          {machine.in_stock ? (
            <Badge className="bg-background/80 text-success border-0 text-[10px] px-2 py-0.5 backdrop-blur-sm">
              <Check className="w-3 h-3 mr-1" />
              {language === 'fr' ? 'Disponible' : 'Available'}
            </Badge>
          ) : (
            <Badge className="bg-background/80 text-destructive border-0 text-[10px] px-2 py-0.5 backdrop-blur-sm">
              <X className="w-3 h-3 mr-1" />
              {language === 'fr' ? 'Indisponible' : 'Unavailable'}
            </Badge>
          )}
        </div>

        {/* Condition badge */}
        {machine.available_for_sale && machine.condition !== 'unspecified' && (
          <div className="absolute bottom-3 left-3">
            <Badge className={cn(
              "border-0 text-[10px] px-2 py-0.5 backdrop-blur-sm",
              machine.condition === 'new' 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary text-secondary-foreground"
            )}>
              <Sparkles className="w-3 h-3 mr-1" />
              {machine.condition === 'new' 
                ? (language === 'fr' ? 'Neuf' : 'New')
                : (language === 'fr' ? 'Occasion' : 'Used')}
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-bold text-foreground leading-tight line-clamp-1 text-base">
            {machine.name}
          </h3>
          {(machine.brand || machine.model) && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
              {[machine.brand, machine.model].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Category chip */}
        <div className="flex items-center gap-1.5">
          <CategoryIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {getCategoryLabel(machine.category as EquipmentCategory, language)}
          </span>
        </div>

        {/* Pricing */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          {machine.available_for_rental && rentalPrices.length > 0 && (
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(lowestRental!.value, machine.currency, language)}
                </span>
                <span className="text-xs text-muted-foreground">{lowestRental!.label}</span>
              </div>
              {rentalPrices.length > 1 && (
                <span className="text-[10px] text-muted-foreground">
                  {rentalPrices.map(p => `${formatPrice(p.value, machine.currency, language)}${p.label}`).join(' · ')}
                </span>
              )}
            </div>
          )}
          
          {machine.available_for_sale && machine.sale_price && (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-success">
                {formatPrice(machine.sale_price, machine.currency, language)}
              </span>
              <span className="text-xs text-muted-foreground">
                {language === 'fr' ? 'à l\'achat' : 'to buy'}
              </span>
            </div>
          )}

          {!machine.available_for_rental && !machine.sale_price && (
            <p className="text-sm text-muted-foreground italic">
              {language === 'fr' ? 'Prix sur demande' : 'Price on request'}
            </p>
          )}
        </div>

        {/* CTA */}
        <Button
          onClick={() => onRequestQuote(machine)}
          className="w-full gap-2 rounded-xl h-11"
          size="sm"
        >
          <FileText className="w-4 h-4" />
          {language === 'fr' ? 'Demander un devis' : 'Request a quote'}
        </Button>
      </div>
    </div>
  );
};
