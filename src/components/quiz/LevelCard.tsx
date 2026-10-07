import { Pressable, StyleSheet, View } from 'react-native';
import { QUIZ } from '@/constants/app';
import { colors, fonts, radius, shadows, spacing, type ColorToken } from '@/theme';
import type { LevelProgress } from '@/types';
import { padLevel } from '@/utils/quiz';
import { AppText, Icon } from '../ui';

interface LevelCardProps {
  progress: LevelProgress;
  selected: boolean;
  width: number;
  onPress: () => void;
}

export function LevelCard({ progress, selected, width, onPress }: LevelCardProps) {
  const { level, status, bestScore, currentQuestion } = progress;

  let bg: string = colors.card;
  let border: string = colors.border;
  let borderWidth = 1;
  let fg: ColorToken = 'text';
  let sub: ColorToken = 'textSecondary';
  let note = `${QUIZ.questionsPerQuiz} Qs`;

  if (status === 'completed') {
    bg = colors.successSurface;
    border = colors.successBorder;
    sub = 'successText';
    note = `${bestScore ?? 0}/${QUIZ.questionsPerQuiz}`;
  }
  if (status === 'current') {
    border = colors.primary;
    borderWidth = 2;
    sub = 'primaryDark';
    note = `Q${currentQuestion ?? 1} of ${QUIZ.questionsPerQuiz}`;
  }
  if (selected) {
    bg = colors.primary;
    border = colors.primaryDark;
    borderWidth = 2;
    fg = 'onPrimary';
    sub = 'onPrimaryMuted';
  }

  const statusText = status === 'completed' ? `completed, best score ${bestScore} of ${QUIZ.questionsPerQuiz}` : status === 'current' ? 'in progress' : 'available';

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={`Level ${level}, ${statusText}`}
      onPress={onPress}
      style={[styles.card, { width, backgroundColor: bg, borderColor: border, borderWidth }, selected && shadows.raised]}
    >
      <AppText style={styles.number} color={fg}>
        {padLevel(level)}
      </AppText>
      <AppText variant="tiny" color={sub} numberOfLines={1}>
        {note}
      </AppText>
      {status === 'completed' ? (
        <View style={[styles.tick, { backgroundColor: selected ? colors.card : colors.success }]}>
          <Icon name="check" size={11} color={selected ? 'primary' : 'onPrimary'} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { height: 72, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.xxs },
  number: { fontFamily: fonts.monoBold, fontSize: 22, lineHeight: 26 },
  tick: { position: 'absolute', top: 7, right: 7, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
