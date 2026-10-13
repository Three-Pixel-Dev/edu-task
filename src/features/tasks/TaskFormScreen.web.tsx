import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText, Button, Card, DueDateField, InlineAlert, Input, PriorityPicker, Screen, SubjectPicker } from '@/components';
import { TASKS } from '@/constants/app';
import { messageOf } from '@/services/errors';
import { colors, spacing } from '@/theme';
import type { TaskInput, TaskPriority } from '@/types';
import { daysFromNow } from '@/utils/date';
import { hasErrors, validateTask, type FieldErrors } from '@/utils/validation';

interface TaskFormScreenProps {
  mode: 'create' | 'edit';
  initial?: TaskInput;
  onSubmit: (input: TaskInput) => Promise<void>;
}

const emptyTask = (): TaskInput => ({
  title: '',
  description: '',
  subjectId: '',
  dueDate: daysFromNow(1, 23, 59).toISOString(),
  priority: 'medium',
});

export function TaskFormScreen({ mode, initial, onSubmit }: TaskFormScreenProps) {
  const start = useMemo(() => initial ?? emptyTask(), [initial]);
  const [form, setForm] = useState<TaskInput>(start);
  const [errors, setErrors] = useState<FieldErrors<TaskInput>>({});
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(start);

  const update = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (attempted) setErrors(validateTask(next));
  };

  const submit = async () => {
    setAttempted(true);
    const found = validateTask(form);
    setErrors(found);
    if (hasErrors(found)) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSubmit({ ...form, title: form.title.trim(), description: form.description.trim() });
      router.back();
    } catch (error) {
      setSaveError(messageOf(error, 'We couldn’t save this task. Check your connection and try again.'));
      setSaving(false);
    }
  };

  const cancel = () => {
    if (!dirty) return router.back();
    Alert.alert('Discard changes?', 'Your changes to this task won’t be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const add = mode === 'create';
  return (
    <Screen contentStyle={styles.content} gap={spacing.xl}>
      <View>
        <AppText style={styles.title}>{add ? 'Add task' : 'Edit task'}</AppText>
        <AppText color="textSecondary" style={styles.subtitle}>{add ? 'Add an assignment or deadline to your list.' : 'Update this assignment or deadline.'}</AppText>
      </View>
      <Card style={styles.form}>
        {saveError ? <InlineAlert message={saveError} /> : null}
        <Input label="Task title" value={form.title} onChangeText={(value) => update('title', value)} error={errors.title} placeholder="e.g. Database Assignment" maxLength={TASKS.titleMaxLength} autoFocus={add} />
        <Input label="Description" optional multiline value={form.description} onChangeText={(value) => update('description', value)} error={errors.description} placeholder="What needs to be done?" maxLength={TASKS.descriptionMaxLength} hint={`${form.description.length}/${TASKS.descriptionMaxLength}`} />
        <View style={styles.twoColumns}>
          <View style={styles.field}><SubjectPicker value={form.subjectId} onChange={(id) => update('subjectId', id)} error={errors.subjectId} /></View>
          <View style={styles.field}><DueDateField value={new Date(form.dueDate)} onChange={(date) => update('dueDate', date.toISOString())} error={errors.dueDate} /></View>
        </View>
        <PriorityPicker value={form.priority} onChange={(priority: TaskPriority) => update('priority', priority)} />
        <View style={styles.actions}>
          <Button title="Cancel" variant="secondary" fullWidth={false} onPress={cancel} />
          <Button title={add ? 'Add task' : 'Save changes'} fullWidth={false} onPress={submit} loading={saving} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 720 },
  title: { fontSize: 30, lineHeight: 38, letterSpacing: -0.6 },
  subtitle: { marginTop: 6 },
  form: { padding: 28, gap: spacing.xl },
  twoColumns: { flexDirection: 'row', gap: spacing.lg },
  field: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, paddingTop: spacing.xl, borderTopWidth: 1, borderTopColor: colors.divider },
});
