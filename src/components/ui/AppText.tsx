import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typography, type ColorToken, type TypographyVariant } from '@/theme';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  align?: TextStyle['textAlign'];
}

/**
 * The only text primitive screens should use. Large Dynamic Type sizes are
 * honoured but capped so layouts stay intact.
 */
export function AppText({ variant = 'body', color = 'text', align, style, maxFontSizeMultiplier = 1.4, ...rest }: AppTextProps) {
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[typography[variant], { color: colors[color] }, align ? { textAlign: align } : null, style]}
      {...rest}
    />
  );
}
