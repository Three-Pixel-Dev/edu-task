import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { Button, DueDateField, InlineAlert, Input, PriorityPicker, Screen, ScreenHeader, SubjectPicker } from '@/components';
import { TASKS } from '@/constants/app';
import { messageOf } from '@/services/storage';
import { spacing } from '@/theme';
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

/** Shared form for Add Task and Edit Task. */
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
    if (attempted) setErrors(validateTask(next)); // live feedback after the first submit
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
    } catch (e) {
      setSaveError(messageOf(e, 'We couldn’t save this task. Check your connection and try again.'));
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

  return (
    <Screen keyboard gap={spacing.xl} footer={<Button title={mode === 'create' ? 'Add task' : 'Save changes'} onPress={submit} loading={saving} />}>
      <ScreenHeader back backIcon="x" backLabel="Cancel" onBack={cancel} title={mode === 'create' ? 'New task' : 'Edit task'} />

      {saveError ? <InlineAlert message={saveError} /> : null}

      <Input
        label="Task title"
        value={form.title}
        onChangeText={(v) => update('title', v)}
        error={errors.title}
        placeholder="e.g. Database Assignment"
        maxLength={TASKS.titleMaxLength}
        returnKeyType="next"
        autoFocus={mode === 'create'}
      />
      <Input
        label="Description"
        optional
        multiline
        value={form.description}
        onChangeText={(v) => update('description', v)}
        error={errors.description}
        placeholder="What needs to be done?"
        maxLength={TASKS.descriptionMaxLength}
        hint={`${form.description.length}/${TASKS.descriptionMaxLength}`}
      />
      <SubjectPicker value={form.subjectId} onChange={(id) => update('subjectId', id)} error={errors.subjectId} />
      <DueDateField value={new Date(form.dueDate)} onChange={(d) => update('dueDate', d.toISOString())} error={errors.dueDate} />
      <PriorityPicker value={form.priority} onChange={(p: TaskPriority) => update('priority', p)} />
    </Screen>
  );
}

