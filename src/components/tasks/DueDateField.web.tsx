import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing, touch } from '@/theme';
import { daysFromNow, formatLongDate, formatTime, isSameDay } from '@/utils/date';
import { AppText, Button, Icon, type IconName } from '../ui';

interface DueDateFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

type OpenPicker = 'date' | 'time' | null;
type Period = 'AM' | 'PM';

const shortcuts = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'Next week', days: 7 },
] as const;

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as const;
const monthTitle = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

type Anchor = { x: number; y: number; width: number; height: number };

/** Web date and time pickers. The fields show the chosen value and open a calendar or clock. */
export function DueDateField({ value, onChange, error }: DueDateFieldProps) {
  const [open, setOpen] = useState<OpenPicker>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(value));
  const dateRef = useRef<View>(null);
  const timeRef = useRef<View>(null);

  const toggle = (next: Exclude<OpenPicker, null>) => {
    if (open === next) {
      setOpen(null);
      return;
    }
    const node = next === 'date' ? dateRef.current : timeRef.current;
    const apply = (nextAnchor: Anchor | null) => {
      if (!nextAnchor) return;
      if (next === 'date') setVisibleMonth(startOfMonth(value));
      setAnchor(nextAnchor);
      setOpen(next);
    };
    const immediate = readAnchor(node);
    if (immediate) {
      apply(immediate);
      return;
    }
    node?.measureInWindow((x, y, width, height) => apply({ x, y, width, height }));
  };

  const pickDate = (day: Date) => {
    const next = new Date(value);
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    onChange(next);
    setOpen(null);
  };

  const applyShortcut = (days: number) => {
    onChange(daysFromNow(days, value.getHours(), value.getMinutes()));
    setOpen(null);
  };

  const clock = to12Hour(value);
  const minutes = (MINUTES as readonly number[]).includes(clock.minutes)
    ? MINUTES
    : [...MINUTES, clock.minutes].sort((a, b) => a - b);
  const setTime = (hour12: number, minutes: number, period: Period) => {
    onChange(from12Hour(value, hour12, minutes, period));
  };

  const panel = open && anchor ? (
    <PickerPortal anchor={anchor} width={open === 'date' ? 308 : 280} onClose={() => setOpen(null)}>
      {open === 'date' ? (
        <View style={styles.panel}>
          <View style={styles.monthRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setVisibleMonth((month) => addMonths(month, -1))} style={styles.monthButton}>
              <Icon name="chevron-left" size={18} />
            </Pressable>
            <AppText variant="label">{monthTitle.format(visibleMonth)}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setVisibleMonth((month) => addMonths(month, 1))} style={styles.monthButton}>
              <Icon name="chevron-right" size={18} />
            </Pressable>
          </View>
          <View style={styles.weekdays}>
            {WEEKDAYS.map((day) => (
              <AppText key={day} variant="tiny" color="textSecondary" align="center" style={styles.weekday}>{day}</AppText>
            ))}
          </View>
          <View style={styles.grid}>
            {calendarCells(visibleMonth).map((day, index) =>
              day ? (
                <Pressable
                  key={day.toISOString()}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSameDay(day, value) }}
                  accessibilityLabel={formatLongDate(day.toISOString())}
                  onPress={() => pickDate(day)}
                  style={[styles.day, isSameDay(day, value) && styles.daySelected, isSameDay(day, new Date()) && !isSameDay(day, value) && styles.dayToday]}
                >
                  <AppText variant="captionStrong" color={isSameDay(day, value) ? 'onPrimary' : 'text'}>{day.getDate()}</AppText>
                </Pressable>
              ) : (
                <View key={`empty-${index}`} style={styles.day} />
              ),
            )}
          </View>
        </View>
      ) : (
        <View style={styles.panel}>
          <View style={styles.periodRow}>
            {(['AM', 'PM'] as const).map((period) => (
              <Pressable
                key={period}
                accessibilityRole="button"
                accessibilityState={{ selected: clock.period === period }}
                onPress={() => setTime(clock.hour12, clock.minutes, period)}
                style={[styles.period, clock.period === period && styles.choiceSelected]}
              >
                <AppText variant="captionStrong" color={clock.period === period ? 'onPrimary' : 'text'}>{period}</AppText>
              </Pressable>
            ))}
          </View>
          <AppText variant="tiny" color="textSecondary">Hour</AppText>
          <View style={styles.choiceGrid}>
            {HOURS.map((hour) => (
              <Pressable
                key={hour}
                accessibilityRole="button"
                accessibilityState={{ selected: clock.hour12 === hour }}
                onPress={() => setTime(hour, clock.minutes, clock.period)}
                style={[styles.choice, clock.hour12 === hour && styles.choiceSelected]}
              >
                <AppText variant="captionStrong" color={clock.hour12 === hour ? 'onPrimary' : 'text'}>{hour}</AppText>
              </Pressable>
            ))}
          </View>
          <AppText variant="tiny" color="textSecondary">Minute</AppText>
          <View style={styles.choiceGrid}>
            {minutes.map((minute) => (
              <Pressable
                key={minute}
                accessibilityRole="button"
                accessibilityState={{ selected: clock.minutes === minute }}
                onPress={() => setTime(clock.hour12, minute, clock.period)}
                style={[styles.choice, clock.minutes === minute && styles.choiceSelected]}
              >
                <AppText variant="captionStrong" color={clock.minutes === minute ? 'onPrimary' : 'text'}>{String(minute).padStart(2, '0')}</AppText>
              </Pressable>
            ))}
          </View>
          <Button title="Done" size="md" onPress={() => setOpen(null)} />
        </View>
      )}
    </PickerPortal>
  ) : null;

  return (
    <View style={styles.wrapper}>
      <AppText variant="label" color="textBody">Due date</AppText>
      <View style={styles.row}>
        <View ref={dateRef} style={styles.dateSlot} collapsable={false}>
          <PickerButton
            icon="calendar"
            label={formatLongDate(value.toISOString())}
            a11y={`Due date, ${formatLongDate(value.toISOString())}. Opens a calendar.`}
            selected={open === 'date'}
            error={Boolean(error)}
            onPress={() => toggle('date')}
          />
        </View>
        <View ref={timeRef} style={styles.timeSlot} collapsable={false}>
          <PickerButton
            icon="clock"
            label={formatTime(value.toISOString())}
            a11y={`Due time, ${formatTime(value.toISOString())}. Opens a time picker.`}
            selected={open === 'time'}
            error={Boolean(error)}
            onPress={() => toggle('time')}
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
      {panel}
    </View>
  );
}

function readAnchor(node: View | null): Anchor | null {
  if (!node) return null;
  const host = node as View & { getBoundingClientRect?: () => { left: number; top: number; width: number; height: number } };
  if (typeof host.getBoundingClientRect !== 'function') return null;
  const rect = host.getBoundingClientRect();
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
}

function PickerPortal({ anchor, width, onClose, children }: { anchor: Anchor; width: number; onClose: () => void; children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  const gap = 8;
  const estimatedHeight = width > 290 ? 340 : 460;
  const below = anchor.y + anchor.height + gap;
  const top = window.innerHeight - below >= estimatedHeight ? below : Math.max(gap, anchor.y - estimatedHeight - gap);
  const left = Math.max(gap, Math.min(anchor.x, window.innerWidth - width - gap));
  return createPortal(
    <View style={styles.layer}>
      <Pressable accessibilityLabel="Close picker" onPress={onClose} style={styles.backdrop} />
      <View style={[styles.popover, { top, left, width }]}>{children}</View>
    </View>,
    document.body,
  );
}

function PickerButton({ icon, label, a11y, selected, error, onPress }: { icon: IconName; label: string; a11y: string; selected: boolean; error: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ expanded: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.button, selected && styles.buttonSelected, error && styles.buttonError, pressed && styles.pressed]}
    >
      <Icon name={icon} size={18} color={selected ? 'primaryDark' : 'textBody'} />
      <AppText variant="body" numberOfLines={1} style={styles.buttonText}>{label}</AppText>
    </Pressable>
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function calendarCells(month: Date): (Date | null)[] {
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: month.getDay() }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function to12Hour(date: Date): { hour12: number; minutes: number; period: Period } {
  const hours = date.getHours();
  return { hour12: hours % 12 || 12, minutes: date.getMinutes(), period: hours >= 12 ? 'PM' : 'AM' };
}

function from12Hour(base: Date, hour12: number, minutes: number, period: Period) {
  const next = new Date(base);
  let hours = hour12 % 12;
  if (period === 'PM') hours += 12;
  next.setHours(hours, minutes, 0, 0);
  return next;
}

const fixedFill = { position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 } as ViewStyle;

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  dateSlot: { flex: 1.4 },
  timeSlot: { flex: 1 },
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
  buttonSelected: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  buttonError: { borderColor: colors.error, borderWidth: 1.5 },
  buttonText: { flexShrink: 1 },
  pressed: { opacity: 0.75 },
  layer: { ...fixedFill, zIndex: 1000 },
  popover: {
    position: 'absolute',
    zIndex: 2,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.18)',
  } as ViewStyle,
  panel: { gap: spacing.sm },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  weekdays: { flexDirection: 'row' },
  weekday: { width: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: 40, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  daySelected: { backgroundColor: colors.primary },
  dayToday: { borderWidth: 1, borderColor: colors.primaryBorder },
  periodRow: { flexDirection: 'row', gap: spacing.sm },
  period: { flex: 1, minHeight: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  choice: { width: 52, minHeight: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  choiceSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: { minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'center' },
  chipActive: { borderColor: colors.primaryBorder, backgroundColor: colors.primarySurface },
  backdrop: fixedFill,
});
