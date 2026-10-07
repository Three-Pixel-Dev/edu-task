import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { colors, type ColorToken } from '@/theme';

/** Feather is the outline set Lucide is based on — matches the design. */
export type IconName = ComponentProps<typeof Feather>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorToken;
  /** Raw colour override for rare cases (e.g. icons on a coloured fill). */
  tint?: string;
}

export function Icon({ name, size = 20, color = 'icon', tint }: IconProps) {
  return <Feather name={name} size={size} color={tint ?? colors[color]} accessibilityElementsHidden importantForAccessibility="no" />;
}
