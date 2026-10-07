import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { findSubject, subjectFields, subjects } from '@/data';
import { colors, fonts, radius, spacing, touch } from '@/theme';
import type { Subject } from '@/types';
import { AppText, CodeChip, Icon, IconButton } from '../ui';

interface SubjectPickerProps {
  value: string;
  onChange: (subjectId: string) => void;
  error?: string;
}

const fieldName = new Map(subjectFields.map((f) => [f.id, f.name]));

/** A field that opens a searchable full-screen subject list. */
export function SubjectPicker({ value, onChange, error }: SubjectPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();
  const selected = findSubject(value);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subjects.filter((s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [query]);

  const choose = (subject: Subject) => {
    onChange(subject.id);
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.wrapper}>
      <AppText variant="label" color="textBody">
        Subject
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Subject, ${selected ? selected.name : 'not chosen'}`}
        accessibilityHint="Opens the subject list"
        onPress={() => setOpen(true)}
        style={[styles.field, error ? styles.fieldError : null]}
      >
        <Icon name="book-open" size={19} />
        <AppText variant="body" color={selected ? 'text' : 'textDisabled'} style={styles.flex} numberOfLines={1}>
          {selected ? selected.name : 'Choose a subject'}
        </AppText>
        <Icon name="chevron-down" size={18} />
      </Pressable>
      {error ? (
        <AppText variant="caption" color="errorText">
          {error}
        </AppText>
      ) : null}

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={[styles.sheet, { paddingTop: spacing.lg }]}>
          <View style={styles.sheetHeader}>
            <AppText variant="heading" accessibilityRole="header">
              Choose a subject
            </AppText>
            <IconButton icon="x" accessibilityLabel="Close subject list" onPress={() => setOpen(false)} />
          </View>
          <View style={styles.search}>
            <Icon name="search" size={18} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or code"
              placeholderTextColor={colors.textDisabled}
              accessibilityLabel="Search subjects"
              autoCorrect={false}
              style={styles.searchInput}
            />
          </View>
          <FlatList
            data={results}
            keyExtractor={(s) => s.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
            ListEmptyComponent={
              <AppText variant="body" color="textSecondary" align="center" style={styles.empty}>
                No subjects match “{query}”.
              </AppText>
            }
            renderItem={({ item }) => {
              const active = item.id === value;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={`${item.name}, ${item.code}`}
                  onPress={() => choose(item)}
                  style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && styles.rowPressed]}
                >
                  <View style={styles.flex}>
                    <AppText variant="bodyMedium">{item.name}</AppText>
                    <View style={styles.rowMeta}>
                      <CodeChip code={item.code} />
                      <AppText variant="caption" color="textSecondary" numberOfLines={1} style={styles.flex}>
                        {fieldName.get(item.fieldId)}
                      </AppText>
                    </View>
                  </View>
                  {active ? <Icon name="check" size={20} color="primary" /> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  flex: { flex: 1 },
  field: {
    minHeight: touch.input,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  fieldError: { borderColor: colors.error, borderWidth: 1.5 },
  sheet: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl, gap: spacing.md },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: touch.min + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    minHeight: 64,
  },
  rowActive: { backgroundColor: colors.primarySurface },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  empty: { marginTop: spacing.xxxl },
});
