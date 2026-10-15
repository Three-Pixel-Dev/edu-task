import { StyleSheet, View } from 'react-native';
import { QUIZ, QUIZ_TYPES } from '@/constants/app';
import { colors, spacing } from '@/theme';
import type { QuizSession } from '@/types';
import { AppText, Badge, Button, Card, CodeChip, Icon, ProgressBar } from '../ui';

interface ContinueQuizCardProps {
  session: QuizSession;
  onContinue: () => void;
  /** "brand" = solid blue hero (Home); "card" = white card (Quiz tab). */
  variant?: 'brand' | 'card';
}

export function ContinueQuizCard({ session, onContinue, variant = 'brand' }: ContinueQuizCardProps) {
  const brand = variant === 'brand';
  const questionNumber = session.currentIndex + 1;
  const total = session.questionIds.length || QUIZ.questionsPerQuiz;
  const progress = questionNumber / total;
  const typeLabel = QUIZ_TYPES[session.quizType].label;

  return (
    <Card tone={brand ? 'brand' : 'primary'} style={styles.card}>
      <View style={styles.top}>
        {brand ? null : (
          <View style={styles.icon}>
            <Icon name={QUIZ_TYPES[session.quizType].icon} size={20} color="primary" />
          </View>
        )}
        <AppText variant="overline" color={brand ? 'onPrimaryMuted' : 'primaryDark'} style={styles.flex}>
          {`Continue · ${typeLabel}`}
        </AppText>
        <Badge label={`Level ${session.level}`} tone={brand ? 'onBrand' : 'primary'} />
      </View>

      <View style={styles.titleBlock}>
        <AppText variant="heading" color={brand ? 'onPrimary' : 'text'}>
          {session.subjectName}
        </AppText>
        {session.subjectCode ? <CodeChip code={session.subjectCode} onBrand={brand} /> : null}
      </View>

      <View style={styles.progress}>
        <View style={styles.progressLabels}>
          <AppText variant="caption" color={brand ? 'onPrimaryMuted' : 'textSecondary'}>
            {`Question ${questionNumber} / ${total}`}
          </AppText>
          <AppText variant="caption" color={brand ? 'onPrimaryMuted' : 'textSecondary'}>
            {`${Math.round(progress * 100)}%`}
          </AppText>
        </View>
        <ProgressBar
          value={progress}
          height={7}
          color={brand ? colors.onPrimary : colors.primary}
          trackColor={brand ? colors.onPrimaryTrack : colors.border}
          accessibilityLabel="Quiz progress"
        />
      </View>

      <Button
        title="Continue"
        rightIcon="arrow-right"
        variant={brand ? 'inverse' : 'primary'}
        size="md"
        onPress={onContinue}
        accessibilityLabel={`Continue ${typeLabel}, ${session.subjectName}, level ${session.level}, question ${questionNumber}`}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg + 2, gap: spacing.lg },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { gap: spacing.xs },
  progress: { gap: spacing.sm },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
});
