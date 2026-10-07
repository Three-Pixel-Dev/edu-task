// Per-weight imports so only the four Inter weights we use are bundled.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono/500Medium';
import { GeistMono_600SemiBold } from '@expo-google-fonts/geist-mono/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks';
import { AppProviders } from '@/store/AppProviders';
import { colors } from '@/theme';

// Keep the native splash visible until fonts load and the session is restored.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
  });

  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style="dark" />
        <RootNavigator ready={fontsLoaded || Boolean(fontError)} />
      </AppProviders>
    </SafeAreaProvider>
  );
}

/**
 * Splash → session check → (auth) or main app.
 * Stack.Protected swaps the available routes when the auth state changes,
 * so logging in/out redirects automatically.
 */
function RootNavigator({ ready }: { ready: boolean }) {
  const { status } = useAuth();
  const restoring = status === 'restoring';

  useEffect(() => {
    if (ready && !restoring) void SplashScreen.hideAsync();
  }, [ready, restoring]);

  // The Stack always renders (the router needs a mounted navigator); the native
  // splash stays on top until fonts are ready and the session check finishes.
  const signedIn = status === 'signedIn';

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="quiz/fields" />
        <Stack.Screen name="quiz/subjects" />
        <Stack.Screen name="quiz/levels" />
        <Stack.Screen name="quiz/questions" options={{ gestureEnabled: false }} />
        <Stack.Screen name="quiz/result" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="tasks/[id]" />
        <Stack.Screen name="tasks/create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="tasks/edit" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
