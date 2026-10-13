import { Pressable, StyleSheet, TextInput, View, type TextInputProps, type TextStyle } from 'react-native';
import { colors, fonts, radius, spacing, touch } from '@/theme';
import { daysFromNow, isSameDay } from '@/utils/date';
import { AppText, Icon } from '../ui';

interface DueDateFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

const shortcuts = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'Next week', days: 7 },
] as const;

const dateInputProps = { type: 'date' } as unknown as TextInputProps;
const timeInputProps = { type: 'time' } as unknown as TextInputProps;
const noBrowserOutline = { outlineStyle: 'none' } as unknown as TextStyle;

export function DueDateField({ value, onChange, error }: DueDateFieldProps) {
  const updateDate = (text: string) => {
    const [year, month, day] = text.split('-').map(Number);
    if (!year || !month || !day) return;
    const next = new Date(value);
    next.setFullYear(year, month - 1, day);
    onChange(next);
  };

  const updateTime = (text: string) => {
    const [hours, minutes] = text.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return;
    const next = new Date(value);
    next.setHours(hours!, minutes!, 0, 0);
    onChange(next);
  };

  const applyShortcut = (days: number) => {
    onChange(daysFromNow(days, value.getHours(), value.getMinutes()));
  };

  return (
    <View style={styles.wrapper}>
      <AppText variant="label" color="textBody">Due date</AppText>
      <View style={styles.row}>
        <View style={[styles.field, styles.dateField, error && styles.fieldError]}>
          <Icon name="calendar" size={17} />
          <TextInput
            {...dateInputProps}
            accessibilityLabel="Due date"
            value={toDateValue(value)}
            onChangeText={updateDate}
            style={[styles.input, noBrowserOutline]}
          />
        </View>
        <View style={[styles.field, styles.timeField, error && styles.fieldError]}>
          <Icon name="clock" size={17} />
          <TextInput
            {...timeInputProps}
            accessibilityLabel="Due time"
            value={toTimeValue(value)}
            onChangeText={updateTime}
            style={[styles.input, noBrowserOutline]}
          />
        </View>
      </View>
      <View style={styles.chips}>
        {shortcuts.map((shortcut) => {
          const active = isSameDay(daysFromNow(shortcut.days), value);
          return (
            <Pressable
              key={shortcut.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => applyShortcut(shortcut.days)}
              style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
            >
              <AppText variant="captionStrong" color={active ? 'primaryDark' : 'textSubtle'}>{shortcut.label}</AppText>
            </Pressable>
          );
        })}
      </View>
      {error ? <AppText variant="caption" color="errorText">{error}</AppText> : null}
    </View>
  );
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  field: {
    minHeight: touch.input,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  dateField: { flex: 1.55 },
  timeField: { flex: 1 },
  fieldError: { borderColor: colors.error, borderWidth: 1.5 },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.regular, fontSize: 14, color: colors.text, paddingVertical: spacing.sm },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: { minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'center' },
  chipActive: { borderColor: colors.primaryBorder, backgroundColor: colors.primarySurface },
  pressed: { opacity: 0.75 },
});
