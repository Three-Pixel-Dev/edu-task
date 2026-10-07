import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, type TextInput } from 'react-native';
import { AppText, Button, InlineAlert, Input } from '@/components';
import { routes } from '@/constants/routes';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/data';
import { useAuth } from '@/hooks';
import { isFirebaseConfigured } from '@/services/firebase';
import { messageOf } from '@/services/storage';
import { colors, radius, spacing } from '@/theme';
import { hasErrors, isEmail, validateLogin } from '@/utils/validation';
import { AuthLayout } from './AuthLayout';

export function LoginScreen() {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    const found = validateLogin(email, password);
    setErrors(found);
    setFormError(null);
    if (hasErrors(found)) return;
    setSubmitting(true);
    try {
      await login({ email, password });
      // Stack.Protected in app/_layout.tsx moves to the main app automatically.
    } catch (e) {
      setFormError(messageOf(e));
      setSubmitting(false);
    }
  };

  const forgotPassword = async () => {
    if (!isEmail(email)) {
      setErrors({ email: 'Enter your email first, then tap “Forgot password?”.' });
      return;
    }
    try {
      await resetPassword(email);
      Alert.alert('Check your inbox', `If an account exists for ${email.trim()}, we’ve sent a link to reset your password.`);
    } catch (e) {
      Alert.alert('Couldn’t send reset link', messageOf(e));
    }
  };

  return (
    <AuthLayout>
      <View style={styles.heading}>
        <AppText variant="title" accessibilityRole="header">
          Welcome back
        </AppText>
        <AppText variant="body" color="textSecondary">
          Log in to continue your quizzes and tasks.
        </AppText>
      </View>

      {formError ? <InlineAlert message={formError} /> : null}

      <Input
        label="Email or username"
        leftIcon="mail"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        placeholder="you@student.ceit.edu"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Input
        ref={passwordRef}
        label="Password"
        leftIcon="lock"
        revealable
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        placeholder="Enter your password"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <Pressable accessibilityRole="button" onPress={forgotPassword} hitSlop={8} style={styles.forgot}>
        <AppText variant="label" color="primaryDark">
          Forgot password?
        </AppText>
      </Pressable>

      <Button title="Log in" onPress={submit} loading={submitting} />

      {!isFirebaseConfigured ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fill in the demo account"
          onPress={() => {
            setEmail(DEMO_EMAIL);
            setPassword(DEMO_PASSWORD);
            setErrors({});
            setFormError(null);
          }}
          style={styles.demo}
        >
          <AppText variant="captionStrong" color="textBody">
            Demo mode · tap to use the sample student
          </AppText>
          <AppText variant="code" color="textSecondary">
            {`${DEMO_EMAIL}  ·  ${DEMO_PASSWORD}`}
          </AppText>
        </Pressable>
      ) : null}

      <View style={styles.footer}>
        <AppText variant="body" color="textSecondary">
          Don’t have an account?{' '}
        </AppText>
        <Link href={routes.register} replace accessibilityRole="link" style={styles.link}>
          <AppText variant="bodyStrong" color="primaryDark">
            Sign up
          </AppText>
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs + 2 },
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.sm, minHeight: 32, justifyContent: 'center' },
  demo: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: spacing.lg, flexWrap: 'wrap' },
  link: { paddingVertical: spacing.sm },
});
