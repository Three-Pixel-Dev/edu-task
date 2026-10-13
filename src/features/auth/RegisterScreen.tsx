import { Link } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Icon, InlineAlert, Input } from '@/components';
import { AUTH } from '@/constants/app';
import { routes } from '@/constants/routes';
import { useAuth } from '@/hooks';
import { messageOf } from '@/services/errors';
import { colors, spacing } from '@/theme';
import { hasErrors, passwordStrength, validateRegister, type FieldErrors, type RegisterForm } from '@/utils/validation';
import { AuthLayout } from './AuthLayout';

type Form = RegisterForm;

const STRENGTH_META = [
  { label: '8+ characters, letters & numbers', color: colors.border },
  { label: 'Not strong enough', color: colors.warning },
  { label: 'Good', color: colors.primary },
  { label: 'Strong password', color: colors.success },
] as const;

// ─── Stable sub-components (defined outside the screen so they never remount) ───

interface StrengthFooterProps {
  strength: number;
}
const PasswordStrengthFooter = memo(function PasswordStrengthFooter({ strength }: StrengthFooterProps) {
  const meta = STRENGTH_META[strength];
  return (
    <View style={styles.strength} accessible accessibilityLabel={`Password strength: ${meta.label}`}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={[styles.bar, { backgroundColor: strength >= step ? meta.color : colors.border }]} />
      ))}
      <AppText variant="caption" color="textSecondary" style={styles.strengthLabel}>
        {meta.label}
      </AppText>
    </View>
  );
});

interface MatchFooterProps {
  visible: boolean;
}
const PasswordMatchFooter = memo(function PasswordMatchFooter({ visible }: MatchFooterProps) {
  if (!visible) return null;
  return (
    <View style={styles.match}>
      <Icon name="check" size={14} color="successText" />
      <AppText variant="caption" color="successText">
        Passwords match
      </AppText>
    </View>
  );
});

// ────────────────────────────────────────────────────────────────────────────────

export function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState<Form>({ displayName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FieldErrors<Form>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Stable setters — never re-created so TextInput onChangeText props stay the same reference.
  const setDisplayName = useCallback((value: string) => setForm((f) => ({ ...f, displayName: value })), []);
  const setEmail = useCallback((value: string) => setForm((f) => ({ ...f, email: value })), []);
  const setPassword = useCallback((value: string) => setForm((f) => ({ ...f, password: value })), []);
  const setConfirmPassword = useCallback((value: string) => setForm((f) => ({ ...f, confirmPassword: value })), []);

  const strength = passwordStrength(form.password);
  const matchesVisible = form.confirmPassword.length > 0 && form.confirmPassword === form.password && !errors.confirmPassword;

  // Keep footer nodes stable — only update when the derived value changes.
  const strengthFooter = useMemo(() => <PasswordStrengthFooter strength={strength} />, [strength]);
  const matchFooter = useMemo(() => <PasswordMatchFooter visible={matchesVisible} />, [matchesVisible]);

  const submit = useCallback(async () => {
    const found = validateRegister(form);
    setErrors(found);
    setFormError(null);
    if (hasErrors(found)) return;
    setSubmitting(true);
    try {
      await register({ displayName: form.displayName, email: form.email, password: form.password });
      // The auth listener + Stack.Protected take the student into the app.
    } catch (e) {
      setFormError(messageOf(e));
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

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
        value={form.displayName}
        onChangeText={setDisplayName}
        error={errors.displayName}
        maxLength={AUTH.displayNameMaxLength}
        placeholder="Your full name"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
      />
      <Input
        label="Email"
        leftIcon="mail"
        value={form.email}
        onChangeText={setEmail}
        error={errors.email}
        placeholder="you@student.ceit.edu"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <Input
        label="Password"
        leftIcon="lock"
        revealable
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        value={form.password}
        onChangeText={setPassword}
        error={errors.password}
        placeholder="Create a password"
        autoComplete="password-new"
        textContentType="newPassword"
        returnKeyType="next"
        footer={strengthFooter}
      />
      <Input
        label="Confirm password"
        leftIcon="lock"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        value={form.confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
        placeholder="Re-enter password"
        autoComplete="off"
        textContentType="none"
        returnKeyType="go"
        onSubmitEditing={submit}
        footer={matchFooter}
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
