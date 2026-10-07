import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radius, spacing, touch } from '@/theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: IconName;
  /** Adds a show/hide toggle for password fields. */
  revealable?: boolean;
  optional?: boolean;
  footer?: ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, leftIcon, revealable, optional, footer, multiline, secureTextEntry, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const borderColor = error ? colors.error : focused ? colors.primary : colors.borderStrong;

  return (
    <View style={styles.wrapper}>
      <AppText variant="label" color="textBody">
        {label}
        {optional ? <AppText variant="caption" color="textDisabled">{'  (optional)'}</AppText> : null}
      </AppText>
      <View
        style={[
          styles.field,
          multiline && styles.multiline,
          { borderColor, borderWidth: error || focused ? 1.5 : 1 },
          focused && !error && styles.focusRing,
        ]}
      >
        {leftIcon ? <Icon name={leftIcon} size={19} color={focused ? 'primary' : 'icon'} /> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.textDisabled}
          selectionColor={colors.primary}
          secureTextEntry={secureTextEntry && !revealed}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          maxFontSizeMultiplier={1.4}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, style]}
          {...rest}
        />
        {revealable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            style={styles.reveal}
          >
            <Icon name={revealed ? 'eye-off' : 'eye'} size={19} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.message} accessibilityLiveRegion="polite">
          <Icon name="alert-circle" size={14} color="errorText" />
          <AppText variant="caption" color="errorText" style={styles.messageText}>
            {error}
          </AppText>
        </View>
      ) : hint ? (
        <AppText variant="caption" color="textSecondary">
          {hint}
        </AppText>
      ) : null}
      {footer}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  field: {
    minHeight: touch.input,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  multiline: { alignItems: 'flex-start', paddingVertical: spacing.md },
  focusRing: { shadowColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  inputMultiline: { minHeight: 96, paddingVertical: 0, lineHeight: 22 },
  reveal: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.md },
  message: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  messageText: { flex: 1 },
});
