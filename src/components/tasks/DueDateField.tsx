import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, touch } from '@/theme';
import { daysFromNow, formatLongDate, formatTime, isSameDay } from '@/utils/date';
import { AppText, Button, Icon, type IconName } from '../ui';

interface DueDateFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

type Mode = 'date' | 'time';

const shortcuts = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'Next week', days: 7 },
] as const;

/**
 * Native date & time pickers (bundled in Expo Go):
 * Android opens the system dialogs; iOS shows the picker in a bottom sheet.
 */
export function DueDateField({ value, onChange, error }: DueDateFieldProps) {
  const [iosMode, setIosMode] = useState<Mode | null>(null);
  const [draft, setDraft] = useState(value);
  const insets = useSafeAreaInsets();

  const open = (mode: Mode) => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        is24Hour: false,
        minimumDate: mode === 'date' ? daysFromNow(-365) : undefined,
        onChange: (event: DateTimePickerEvent, picked?: Date) => {
          if (event.type === 'set' && picked) onChange(merge(value, picked, mode));
        },
      });
      return;
    }
    setDraft(value);
    setIosMode(mode);
  };

  const applyShortcut = (days: number) => {
    const next = daysFromNow(days, value.getHours(), value.getMinutes());
    onChange(next);
  };

  return (
    <View style={styles.wrapper}>
      <AppText variant="label" color="textBody">
        Due date
      </AppText>
      <View style={styles.row}>
        <PickerButton icon="calendar" label={formatLongDate(value.toISOString())} a11y={`Due date, ${formatLongDate(value.toISOString())}`} onPress={() => open('date')} flex={1.6} error={Boolean(error)} />
        <PickerButton icon="clock" label={formatTime(value.toISOString())} a11y={`Due time, ${formatTime(value.toISOString())}`} onPress={() => open('time')} flex={1} error={Boolean(error)} />
      </View>
      <View style={styles.chips}>
        {shortcuts.map((s) => {
          const active = isSameDay(daysFromNow(s.days), value);
          return (
            <Pressable
              key={s.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => applyShortcut(s.days)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <AppText variant="captionStrong" color={active ? 'primaryDark' : 'textSubtle'}>
                {s.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <AppText variant="caption" color="errorText">
          {error}
        </AppText>
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={iosMode !== null} transparent animationType="fade" onRequestClose={() => setIosMode(null)}>
          <Pressable style={styles.scrim} onPress={() => setIosMode(null)} accessibilityLabel="Close picker" />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <AppText variant="subheading" align="center">
              {iosMode === 'time' ? 'Due time' : 'Due date'}
            </AppText>
            {iosMode ? (
              <DateTimePicker
                value={draft}
                mode={iosMode}
                display={iosMode === 'date' ? 'inline' : 'spinner'}
                accentColor={colors.primary}
                themeVariant="light"
                onChange={(_e, picked) => picked && setDraft(merge(draft, picked, iosMode))}
              />
            ) : null}
            <Button
              title="Done"
              onPress={() => {
                onChange(draft);
                setIosMode(null);
              }}
            />
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

function merge(base: Date, picked: Date, mode: Mode) {
  const next = new Date(base);
  if (mode === 'date') next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  else next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return next;
}

function PickerButton({ icon, label, a11y, onPress, flex, error }: { icon: IconName; label: string; a11y: string; onPress: () => void; flex: number; error: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityHint="Opens a picker"
      onPress={onPress}
      style={({ pressed }) => [styles.button, { flex }, error && styles.buttonError, pressed && styles.pressed]}
    >
      <Icon name={icon} size={18} />
      <AppText variant="body" numberOfLines={1} style={styles.buttonText}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  button: {
    minHeight: touch.input,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonError: { borderColor: colors.error },
  buttonText: { flexShrink: 1 },
  pressed: { backgroundColor: colors.background },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: { minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'center' },
  chipActive: { borderColor: colors.primaryBorder, backgroundColor: colors.primarySurface },
  scrim: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: spacing.xl, gap: spacing.md },
});
