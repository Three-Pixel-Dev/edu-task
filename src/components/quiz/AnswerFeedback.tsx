import { StyleSheet, View } from 'react-native';
import { colors, fonts, radius, spacing } from '@/theme';
import { AppText, Icon } from '../ui';

interface AnswerFeedbackProps {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
}

/** Compact, educational feedback shown after "Check answer". */
export function AnswerFeedback({ correct, correctAnswer, explanation }: AnswerFeedbackProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.box,
        correct
          ? { backgroundColor: colors.successSurface, borderColor: colors.successBorder }
          : { backgroundColor: colors.errorSurface, borderColor: colors.errorBorder },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: correct ? colors.success : colors.error }]}>
        <Icon name={correct ? 'check' : 'x'} size={15} color="onPrimary" />
      </View>
      <View style={styles.text}>
        <AppText variant="bodyStrong" color={correct ? 'successText' : 'errorText'}>
          {correct ? 'Correct answer' : 'Incorrect answer'}
        </AppText>
        <AppText variant="label" color="textBody">
          {correct ? 'Well done! ' : (
            <>
              {'Correct answer: '}
              <AppText variant="label" style={styles.strong}>
                {correctAnswer}
              </AppText>
              {'. '}
            </>
          )}
          {explanation}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: spacing.md, padding: spacing.md + 2, borderRadius: radius.xl, borderWidth: 1 },
  icon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  text: { flex: 1, gap: 2 },
  strong: { fontFamily: fonts.semibold },
});
