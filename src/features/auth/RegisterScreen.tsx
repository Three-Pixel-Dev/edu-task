import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';
import { AppText, Button, Icon, InlineAlert, Input } from '@/components';
import { routes } from '@/constants/routes';
import { useAuth } from '@/hooks';
import { messageOf } from '@/services/storage';
import { colors, spacing } from '@/theme';
import { hasErrors, passwordStrength, validateRegister, type FieldErrors } from '@/utils/validation';
import { AuthLayout } from './AuthLayout';

type Form = { fullName: string; email: string; password: string; confirmPassword: string };

const strengthMeta = [
  { label: 'At least 8 characters', color: colors.border },
  { label: 'Too short', color: colors.warning },
  { label: 'Good', color: colors.primary },
  { label: 'Strong password', color: colors.success },
] as const;

export function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState<Form>({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FieldErrors<Form>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const set = (key: keyof Form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const strength = passwordStrength(form.password);
  const matches = form.confirmPassword.length > 0 && form.confirmPassword === form.password;

  const submit = async () => {
    const found = validateRegister(form);
    setErrors(found);
    setFormError(null);
    if (hasErrors(found)) return;
    setSubmitting(true);
    try {
      await register({ fullName: form.fullName, email: form.email, password: form.password });
    } catch (e) {
      setFormError(messageOf(e));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout compactHero>
      <View style={styles.heading}>
        <AppText variant="title" accessibilityRole="header">
          Create your account
        </AppText>
        <AppText variant="body" color="textSecondary">
          Use your student email to keep quizzes and tasks in sync.
        </AppText>
      </View>

      {formError ? <InlineAlert message={formError} /> : null}

      <Input
        label="Full name"
        leftIcon="user"
        value={form.fullName}
        onChangeText={set('fullName')}
        error={errors.fullName}
        placeholder="e.g. Alvin Tan"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <Input
        ref={emailRef}
        label="Email"
        leftIcon="mail"
        value={form.email}
        onChangeText={set('email')}
        error={errors.email}
        placeholder="you@student.ceit.edu"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Input
        ref={passwordRef}
        label="Password"
        leftIcon="lock"
        revealable
        secureTextEntry
        value={form.password}
        onChangeText={set('password')}
        error={errors.password}
        placeholder="Create a password"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        footer={
          <View style={styles.strength} accessible accessibilityLabel={`Password strength: ${strengthMeta[strength].label}`}>
            {[1, 2, 3].map((step) => (
              <View key={step} style={[styles.bar, { backgroundColor: strength >= step ? strengthMeta[strength].color : colors.border }]} />
            ))}
            <AppText variant="caption" color="textSecondary" style={styles.strengthLabel}>
              {strengthMeta[strength].label}
            </AppText>
          </View>
        }
      />
      <Input
        ref={confirmRef}
        label="Confirm password"
        leftIcon="lock"
        secureTextEntry
        value={form.confirmPassword}
        onChangeText={set('confirmPassword')}
        error={errors.confirmPassword}
        placeholder="Re-enter password"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
        footer={
          matches && !errors.confirmPassword ? (
            <View style={styles.match}>
              <Icon name="check" size={14} color="successText" />
              <AppText variant="caption" color="successText">
                Passwords match
              </AppText>
            </View>
          ) : null
        }
      />

      <Button title="Sign up" onPress={submit} loading={submitting} style={styles.cta} />

      <View style={styles.footer}>
        <AppText variant="body" color="textSecondary">
          Already have an account?{' '}
        </AppText>
        <Link href={routes.login} replace accessibilityRole="link" style={styles.link}>
          <AppText variant="bodyStrong" color="primaryDark">
            Log in
          </AppText>
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs + 2 },
  strength: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { minWidth: 120, textAlign: 'right' },
  match: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  cta: { marginTop: spacing.xs },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: spacing.lg, flexWrap: 'wrap' },
  link: { paddingVertical: spacing.sm },
});
