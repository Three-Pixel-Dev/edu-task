import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, InlineAlert, Input, ListRow } from '@/components';
import { useAuth } from '@/hooks';
import { messageOf } from '@/services/errors';
import { spacing } from '@/theme';
import { hasErrors, validatePasswordChange, type PasswordChangeForm } from '@/utils/validation';

const empty: PasswordChangeForm = { currentPassword: '', password: '', confirmPassword: '' };

/** In-app password change. Collapsed it is the settings row; expanded it is the form. */
export function ChangePasswordForm({ divider }: { divider?: boolean }) {
  const { changePassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PasswordChangeForm>(empty);
  const [errors, setErrors] = useState<Partial<PasswordChangeForm>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const close = () => {
    setOpen(false);
    setForm(empty);
    setErrors({});
    setFormError(null);
    setSaved(false);
  };

  const submit = async () => {
    const found = validatePasswordChange(form);
    setErrors(found);
    setFormError(null);
    setSaved(false);
    if (hasErrors(found)) return;
    setSaving(true);
    try {
      await changePassword(form.currentPassword, form.password);
      setForm(empty);
      setSaved(true);
    } catch (error) {
      setFormError(messageOf(error, 'We couldn’t change your password. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return <ListRow title="Change password" icon="lock" onPress={() => setOpen(true)} divider={divider} />;
  }

  return (
    <View style={styles.form}>
      <AppText variant="bodyMedium">Change password</AppText>
      {formError ? <InlineAlert message={formError} /> : null}
      {saved ? <InlineAlert tone="success" message="Your password has been updated. Use it the next time you log in." /> : null}
      <Input
        label="Current password"
        leftIcon="lock"
        revealable
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        value={form.currentPassword}
        onChangeText={(currentPassword) => setForm((prev) => ({ ...prev, currentPassword }))}
        error={errors.currentPassword}
        autoComplete="current-password"
        textContentType="password"
      />
      <Input
        label="New password"
        leftIcon="lock"
        revealable
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        value={form.password}
        onChangeText={(password) => setForm((prev) => ({ ...prev, password }))}
        error={errors.password}
        hint="At least 8 characters, with a letter and a number."
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Input
        label="Confirm new password"
        leftIcon="lock"
        revealable
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        value={form.confirmPassword}
        onChangeText={(confirmPassword) => setForm((prev) => ({ ...prev, confirmPassword }))}
        error={errors.confirmPassword}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <View style={styles.actions}>
        <Button title="Cancel" variant="secondary" fullWidth={false} onPress={close} disabled={saving} />
        <Button title="Save password" fullWidth={false} loading={saving} onPress={submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, padding: spacing.lg },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});
