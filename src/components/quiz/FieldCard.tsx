import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import type { SubjectField } from '@/types';
import { pluralise } from '@/utils/format';
import { AppText, Card, Icon } from '../ui';

interface FieldCardProps {
  field: SubjectField;
  subjectCount: number;
  onPress: () => void;
}

export function FieldCard({ field, subjectCount, onPress }: FieldCardProps) {
  const count = pluralise(subjectCount, 'subject');
  return (
    <Card onPress={onPress} accessibilityLabel={`${field.name}, ${count}`} accessibilityHint="Shows the subjects in this field" style={styles.card}>
      <View style={styles.icon}>
        <Icon name={field.icon} size={22} color="primary" />
      </View>
      <View style={styles.text}>
        <AppText variant="bodyStrong">{field.name}</AppText>
        <AppText variant="caption" color="textSecondary">
          {count}
        </AppText>
      </View>
      <Icon name="chevron-right" size={20} color="textDisabled" />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md + 2, minHeight: 72, paddingVertical: spacing.md },
  icon: { width: 46, height: 46, borderRadius: radius.lg, backgroundColor: colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
