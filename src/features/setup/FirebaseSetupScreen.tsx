import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, Icon, Logo, Screen } from '@/components';
import { missingFirebaseConfig } from '@/services/firebase';
import { colors, radius, spacing } from '@/theme';

/**
 * Shown instead of the app when the Firebase config is missing. EduTask has no
 * offline/demo data mode on purpose — it needs a real Firebase project.
 */
export function FirebaseSetupScreen({ ready }: { ready: boolean }) {
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  return (
    <Screen>
      <Logo />
      <View style={styles.heading}>
        <AppText variant="title" accessibilityRole="header">
          Connect Firebase
        </AppText>
        <AppText variant="body" color="textSecondary">
          EduTask stores everything in Firebase. Add your project’s web app config to a <AppText variant="bodyStrong">.env</AppText> file in the
          project folder, then restart Expo with <AppText variant="code">npx expo start -c</AppText>.
        </AppText>
      </View>

      <Card style={styles.card}>
        <AppText variant="overline" color="textSecondary">
          Missing values
        </AppText>
        {missingFirebaseConfig.map((key) => (
          <View key={key} style={styles.row}>
            <Icon name="x-circle" size={16} color="error" />
            <AppText variant="code" color="text" style={styles.key}>
              {key}
            </AppText>
          </View>
        ))}
      </Card>

      <Card tone="muted" style={styles.card}>
        <AppText variant="subheading">Where to find them</AppText>
        <AppText variant="body" color="textBody">
          Firebase console → Project settings → General → Your apps → Web app ({'</>'} icon) → SDK setup and configuration → Config. Copy each value
          into the matching variable from <AppText variant="code">.env.example</AppText>.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.sm },
  card: { gap: spacing.sm + 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: colors.card },
  key: { fontSize: 13 },
});
