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
  Mail, 
  Phone 
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
  if (price === null) return '-';
  return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(price);
};

export const CatalogMachineCard = ({ machine, language, onRequestQuote }: CatalogMachineCardProps) => {
  const CategoryIcon = getCategoryIconComponent(machine.category as EquipmentCategory);

  return (
    <div className="glass-card overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      {/* Image */}
      <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
        {machine.photos && machine.photos.length > 0 ? (
          <img 
            src={machine.photos[0]} 
            alt={machine.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <CategoryIcon className="w-20 h-20 text-primary/30" />
        )}
        
        {/* Stock badge */}
        <div className="absolute top-3 right-3">
          {machine.in_stock ? (
            <Badge className="bg-success/90 text-white border-0">
              <Check className="w-3 h-3 mr-1" />
              {language === 'fr' ? 'En stock' : 'In stock'}
            </Badge>
          ) : (
            <Badge variant="destructive">
              <X className="w-3 h-3 mr-1" />
              {language === 'fr' ? 'Rupture' : 'Out of stock'}
            </Badge>
          )}
        </div>

        {/* Condition badge for sales */}
        {machine.available_for_sale && machine.condition !== 'unspecified' && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className={cn(
              "border-0",
              machine.condition === 'new' 
                ? "bg-primary/90 text-white" 
                : "bg-secondary/90 text-foreground"
            )}>
              <Sparkles className="w-3 h-3 mr-1" />
              {machine.condition === 'new' 
                ? (language === 'fr' ? 'Neuf' : 'New')
                : (language === 'fr' ? 'Occasion' : 'Used')}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Title & Brand */}
        <div>
          <h3 className="text-lg font-bold text-foreground truncate">
            {machine.name}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {machine.brand} {machine.model}
          </p>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          <CategoryIcon className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            {getCategoryLabel(machine.category as EquipmentCategory, language)}
          </span>
        </div>

        {/* Availability badges */}
        <div className="flex flex-wrap gap-2">
          {machine.available_for_rental && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <CalendarDays className="w-3 h-3 mr-1" />
              {language === 'fr' ? 'Location' : 'Rental'}
            </Badge>
          )}
          {machine.available_for_sale && (
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              <ShoppingCart className="w-3 h-3 mr-1" />
              {language === 'fr' ? 'Vente' : 'Sale'}
            </Badge>
          )}
        </div>

        {/* Prices */}
        <div className="space-y-3 pt-3 border-t border-border/50">
          {machine.available_for_rental && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {language === 'fr' ? 'Tarifs location' : 'Rental rates'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="glass-card p-2 text-center">
                  <p className="text-xs text-muted-foreground">{language === 'fr' ? 'Jour' : 'Day'}</p>
                  <p className="text-sm font-bold text-foreground">
                    {formatPrice(machine.daily_rental_price, machine.currency, language)}
                  </p>
                </div>
                <div className="glass-card p-2 text-center">
                  <p className="text-xs text-muted-foreground">{language === 'fr' ? 'Sem.' : 'Week'}</p>
                  <p className="text-sm font-bold text-foreground">
                    {formatPrice(machine.weekly_rental_price, machine.currency, language)}
                  </p>
                </div>
                <div className="glass-card p-2 text-center">
                  <p className="text-xs text-muted-foreground">{language === 'fr' ? 'Mois' : 'Month'}</p>
                  <p className="text-sm font-bold text-foreground">
                    {formatPrice(machine.monthly_rental_price, machine.currency, language)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {machine.available_for_sale && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {language === 'fr' ? 'Prix de vente' : 'Sale price'}
              </p>
              <p className="text-2xl font-bold text-success">
                {formatPrice(machine.sale_price, machine.currency, language)}
              </p>
            </div>
          )}
        </div>

        {/* Quote Request Button */}
        <div className="pt-3 border-t border-border/50">
          <Button
            onClick={() => onRequestQuote(machine)}
            className="w-full gap-2"
            size="sm"
          >
            <FileText className="w-4 h-4" />
            {language === 'fr' ? 'Demander un devis' : 'Request a quote'}
          </Button>
        </div>

        {/* Contact */}
        {(machine.workspace_contact_email || machine.workspace_phone) && (
          <div className="pt-3 border-t border-border/50 space-y-2">
            {machine.workspace_contact_email && (
              <Button
                variant="outline"
                size="sm"
                className="w-full glass-button"
                asChild
              >
                <a href={`mailto:${machine.workspace_contact_email}?subject=${encodeURIComponent(`${language === 'fr' ? 'Demande pour' : 'Inquiry for'} ${machine.name}`)}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  {language === 'fr' ? 'Contacter par email' : 'Contact by email'}
                </a>
              </Button>
            )}
            {machine.workspace_phone && (
              <Button
                variant="outline"
                size="sm"
                className="w-full glass-button"
                asChild
              >
                <a href={`tel:${machine.workspace_phone}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  {machine.workspace_phone}
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
