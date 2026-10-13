import { router, usePathname, type Href } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { routes } from '@/constants/routes';
import { AuthContext } from '@/providers/AuthProvider';
import { useTaskSections } from '@/hooks';
import { colors, fonts, spacing } from '@/theme';
import { desktop } from '@/theme/desktop';

const ITEMS: { label: string; href: Href; icon: IconName; match: (path: string) => boolean }[] = [
  {
    label: 'Home',
    href: routes.home,
    icon: 'home',
    match: (p) => p === '/' || p === '' || p.endsWith('/(tabs)') || p.endsWith('/(tabs)/'),
  },
  {
    label: 'Quiz',
    href: routes.quizTab,
    icon: 'help-circle',
    match: (p) => p.includes('/quiz'),
  },
  {
    label: 'Tasks',
    href: routes.tasksTab,
    icon: 'check-square',
    match: (p) => p.includes('/tasks'),
  },
  {
    label: 'Profile',
    href: routes.profileTab,
    icon: 'user',
    match: (p) => p.includes('/profile'),
  },
];

export function WebSidebar() {
  const pathname = usePathname();
  const auth = useContext(AuthContext);
  const { counts } = useTaskSections();
  const [expanded, setExpanded] = useState(true);
  const displayName = auth?.profile?.displayName ?? auth?.user?.displayName ?? 'Student';

  return (
    <View style={[styles.root, { width: expanded ? desktop.sidebarWidth : 72 }]}>
      <View style={styles.brand}>
        <Logo size={40} />
        {expanded ? (
          <>
            <AppText variant="heading" style={styles.brandName}>
              EduTask
            </AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Collapse sidebar" onPress={() => setExpanded(false)} style={styles.collapse}>
              <Icon name="chevrons-left" size={17} color="textSecondary" />
            </Pressable>
          </>
        ) : null}
      </View>
      {!expanded ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Expand sidebar" onPress={() => setExpanded(true)} style={styles.expand}>
          <Icon name="chevrons-right" size={17} color="textSecondary" />
        </Pressable>
      ) : null}

      <View style={styles.nav}>
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Pressable
              key={String(item.href)}
              accessibilityRole="link"
              accessibilityState={{ selected: active }}
              onPress={() => router.navigate(item.href)}
              style={[styles.item, active && styles.itemActive]}
            >
              <Icon name={item.icon} size={20} color={active ? 'primaryDark' : 'textSecondary'} />
              {expanded ? (
                <AppText variant="label" color={active ? 'primaryDark' : 'textSubtle'} style={styles.navLabel}>
                  {item.label}
                </AppText>
              ) : null}
              {expanded && item.label === 'Tasks' && counts.dueToday + counts.overdue > 0 ? (
                <View style={styles.countBadge}>
                  <AppText variant="tiny" color="warningText">{counts.dueToday + counts.overdue}</AppText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.spacer} />
      <Pressable accessibilityRole="button" onPress={() => router.navigate(routes.profileTab)} style={styles.item}>
        <Icon name="settings" size={20} color="textSecondary" />
        {expanded ? <AppText variant="label" color="textSubtle">Settings</AppText> : null}
      </Pressable>
      {expanded ? <View style={styles.divider} /> : null}
      {expanded ? (
        <Pressable accessibilityRole="button" onPress={() => router.navigate(routes.profileTab)} style={styles.profile}>
          <Avatar name={displayName} size={36} />
          <View style={styles.profileText}>
            <AppText variant="label" numberOfLines={1}>{displayName}</AppText>
            <AppText variant="caption" color="textSecondary">CEIT · Year 4</AppText>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: desktop.sidebarWidth,
    backgroundColor: colors.card,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, height: 40, marginBottom: spacing.lg },
  brandName: { fontFamily: fonts.bold, flex: 1 },
  collapse: { width: 32, height: 32, borderWidth: 1, borderColor: colors.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  expand: { width: 40, height: 32, borderWidth: 1, borderColor: colors.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  nav: { gap: spacing.xs },
  item: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
  },
  itemActive: { backgroundColor: colors.primarySurfaceStrong },
  navLabel: { flex: 1 },
  countBadge: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: colors.warningSurfaceStrong, alignItems: 'center', justifyContent: 'center' },
  spacer: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm + 2 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, padding: spacing.sm, borderRadius: 12 },
  profileText: { flex: 1, minWidth: 0 },
});
