import { useLanguage } from '@/contexts/LanguageContext';
import { MachineStatus } from '@/types/machine';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: MachineStatus;
  className?: string;
}

const STATUS_CONFIG: Record<MachineStatus, { labelKey: string; badgeClass: string; dotClass: string }> = {
  'operational': {
    labelKey: 'operational',
    badgeClass: 'status-operational',
    dotClass: 'status-dot-operational',
  },
  'needs-attention': {
    labelKey: 'needsAttention',
    badgeClass: 'status-needs-attention',
    dotClass: 'status-dot-needs-attention',
  },
  'out-of-service': {
    labelKey: 'outOfService',
    badgeClass: 'status-out-of-service',
    dotClass: 'status-dot-out-of-service',
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const { t } = useLanguage();
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['operational'];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap',
        config.badgeClass,
        className
      )}
    >
      <span className={cn('status-dot', config.dotClass)} aria-hidden="true" />
      {t(config.labelKey)}
    </span>
  );
};
