import { 
  SlidersHorizontal, 
  Volume2, 
  Speaker, 
  Lightbulb, 
  Gamepad2, 
  Monitor, 
  Video, 
  Mic,
  Box,
  LucideIcon
} from 'lucide-react';
import { EquipmentCategory } from '@/data/equipmentData';

const iconMap: Record<string, LucideIcon> = {
  SlidersHorizontal,
  Volume2,
  Speaker,
  Lightbulb,
  Gamepad2,
  Monitor,
  Video,
  Mic,
  Box,
};

interface CategoryIconProps {
  iconName: string;
  className?: string;
  size?: number;
}

export const CategoryIcon = ({ iconName, className, size = 20 }: CategoryIconProps) => {
  const Icon = iconMap[iconName] || Box;
  return <Icon className={className} size={size} />;
};

export const getCategoryIconComponent = (category: EquipmentCategory): LucideIcon => {
  const categoryIcons: Record<EquipmentCategory, LucideIcon> = {
    'mixing-console': SlidersHorizontal,
    'amplifier': Volume2,
    'speaker': Speaker,
    'lighting': Lightbulb,
    'controller': Gamepad2,
    'computer': Monitor,
    'video': Video,
    'microphone': Mic,
    'other': Box,
  };
  return categoryIcons[category] || Box;
};
