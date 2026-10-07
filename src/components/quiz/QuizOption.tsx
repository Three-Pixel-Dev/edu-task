import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, type ColorToken } from '@/theme';
import { AppText, Icon } from '../ui';

export type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'dimmed';

interface QuizOptionProps {
  letter: string;
  text: string;
  state: OptionState;
  locked: boolean;
  onPress: () => void;
}

const look: Record<OptionState, { bg: string; border: string; width: number; badgeBg: string; badgeFg: ColorToken }> = {
  idle: { bg: colors.card, border: colors.border, width: 1, badgeBg: colors.surfaceMuted, badgeFg: 'textBody' },
  selected: { bg: colors.primarySurface, border: colors.primary, width: 2, badgeBg: colors.primary, badgeFg: 'onPrimary' },
  correct: { bg: colors.successSurface, border: colors.success, width: 2, badgeBg: colors.success, badgeFg: 'onPrimary' },
  incorrect: { bg: colors.errorSurface, border: colors.error, width: 2, badgeBg: colors.error, badgeFg: 'onPrimary' },
  dimmed: { bg: colors.card, border: colors.border, width: 1, badgeBg: colors.surfaceMuted, badgeFg: 'textSecondary' },
};

const stateLabel: Partial<Record<OptionState, string>> = {
  correct: 'correct answer',
  incorrect: 'your answer, incorrect',
};

/** Large, full-width answer card — easy to hit with a thumb. */
export function QuizOption({ letter, text, state, locked, onPress }: QuizOptionProps) {
  const l = look[state];
  const selected = state === 'selected' || state === 'incorrect' || (state === 'correct' && !locked);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: locked }}
      accessibilityLabel={`Option ${letter}: ${text}${stateLabel[state] ? `, ${stateLabel[state]}` : ''}`}
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: l.bg, borderColor: l.border, borderWidth: l.width, opacity: state === 'dimmed' ? 0.6 : 1 },
        pressed && state === 'idle' && styles.pressed,
      ]}
    >
      <View style={[styles.badge, { backgroundColor: l.badgeBg }]}>
        <AppText variant="captionStrong" color={l.badgeFg}>
          {letter}
        </AppText>
      </View>
      <AppText variant="bodyMedium" style={styles.text}>
        {text}
      </AppText>
      <Indicator state={state} />
    </Pressable>
  );
}

function Indicator({ state }: { state: OptionState }) {
  if (state === 'correct')
    return (
      <View style={[styles.mark, { backgroundColor: colors.success }]}>
        <Icon name="check" size={14} color="onPrimary" />
      </View>
    );
  if (state === 'incorrect')
    return (
      <View style={[styles.mark, { backgroundColor: colors.error }]}>
        <Icon name="x" size={14} color="onPrimary" />
      </View>
    );
  if (state === 'selected')
    return (
      <View style={[styles.radio, { borderColor: colors.primary }]}>
        <View style={styles.radioDot} />
      </View>
    );
  if (state === 'dimmed') return <View style={styles.radioPlaceholder} />;
  return <View style={styles.radio} />;
}

const styles = StyleSheet.create({
  option: {
    minHeight: 60,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 2,
  },
  pressed: { backgroundColor: colors.background, borderColor: colors.primaryMuted },
  badge: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  radioPlaceholder: { width: 22, height: 22 },
  mark: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
