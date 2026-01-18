import { useLanguage } from '@/contexts/LanguageContext';
import { MachineStatus } from '@/types/machine';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: MachineStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const { t } = useLanguage();

  const statusConfig = {
    'operational': {
      label: t('operational'),
      className: 'status-operational',
    },
    'needs-attention': {
      label: t('needsAttention'),
      className: 'status-needs-attention',
    },
    'out-of-service': {
      label: t('outOfService'),
      className: 'status-out-of-service',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};
