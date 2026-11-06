import { Tabs } from 'expo-router';
import { colors } from '@/theme';

/**
 * Web tabs: same five routes as mobile, but the bottom tab bar is hidden.
 * Navigation chrome comes from `WebShell` inside `Screen.web.tsx`.
 */
export default function TabsLayoutWeb() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="quiz" options={{ title: 'Multiple choice' }} />
      <Tabs.Screen name="true-false" options={{ title: 'Quiz' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
