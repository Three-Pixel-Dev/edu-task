import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components';
import { colors, fonts, layout } from '@/theme';

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={[styles.pill, focused && styles.pillActive]}>
      <Icon name={name} size={21} color={focused ? 'primaryDark' : 'textSecondary'} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [styles.bar, { height: layout.tabBarHeight + insets.bottom, paddingBottom: Math.max(insets.bottom, 8) }],
        tabBarItemStyle: styles.item,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }}
      />
      <Tabs.Screen
        name="quiz"
        options={{ title: 'Quiz', tabBarIcon: ({ focused }) => <TabIcon name="help-circle" focused={focused} /> }}
      />
      <Tabs.Screen
        name="tasks"
        options={{ title: 'Tasks', tabBarIcon: ({ focused }) => <TabIcon name="check-square" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="user" focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  item: { paddingTop: 2 },
  label: { fontFamily: fonts.semibold, fontSize: 11, marginTop: 2 },
  pill: { width: 56, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: colors.primarySurfaceStrong },
});
