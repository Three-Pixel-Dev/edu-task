import { router, useGlobalSearchParams, usePathname } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { routes } from '@/constants/routes';
import { AuthContext } from '@/providers/AuthProvider';
import { NotificationsContext } from '@/providers/NotificationsProvider';
import { colors, spacing } from '@/theme';
import { desktop } from '@/theme/desktop';

function titleFor(pathname: string, type?: string): string {
  const label = type === 'trueFalse' ? 'Quiz' : 'Multiple choice';
  if (pathname.includes('/true-false')) return 'Quiz';
  if (pathname.includes('/quiz/questions')) return label;
  if (pathname.includes('/quiz/result')) return 'Result';
  if (pathname.includes('/quiz/history')) return 'Attempt history';
  if (pathname.includes('/quiz/levels')) return `${label} · Choose level`;
  if (pathname.includes('/quiz/subjects')) return `${label} · Subjects`;
  if (pathname.includes('/quiz/fields')) return `${label} · Choose a field`;
  if (pathname.includes('/quiz')) return 'Multiple choice';
  if (pathname.includes('/tasks/create')) return 'Add task';
  if (pathname.includes('/tasks/edit')) return 'Edit task';
  if (pathname.includes('/tasks/')) return 'Task details';
  if (pathname.includes('/tasks')) return 'My tasks';
  if (pathname.includes('/profile')) return 'Profile';
  if (pathname.includes('/notifications')) return 'Notifications';
  if (pathname.includes('/login') || pathname.includes('/register')) return 'Welcome';
  return 'Home';
}

export function WebTopBar({ title }: { title?: string }) {
  const pathname = usePathname();
  const { type } = useGlobalSearchParams<{ type?: string }>();
  const auth = useContext(AuthContext);
  const notifications = useContext(NotificationsContext);
  const unreadCount = notifications?.unreadCount ?? 0;
  const [open, setOpen] = useState(false);
  const displayName = auth?.profile?.displayName ?? auth?.user?.displayName ?? '';
  const email = auth?.profile?.email ?? auth?.user?.email ?? '';
  const heading = title ?? titleFor(pathname, type);
  const firstName = displayName.trim().split(/\s+/)[0] || 'Student';

  return (
    <View style={styles.root}>
      <AppText variant="subheading" accessibilityRole="header">
        {heading}
      </AppText>
      <View style={styles.right}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          onPress={() => router.push(routes.notifications)}
          style={styles.iconButton}
        >
          <Icon name="bell" size={19} color="textBody" />
          {unreadCount > 0 ? <View style={styles.notificationDot} /> : null}
        </Pressable>
        <View>
          <Pressable accessibilityRole="button" accessibilityLabel="Account menu" onPress={() => setOpen((value) => !value)} style={styles.accountButton}>
            <Avatar name={displayName || '?'} size={32} />
            <AppText variant="label" numberOfLines={1}>{firstName}</AppText>
            <Icon name="chevron-down" size={16} color="textSecondary" />
          </Pressable>
          {open ? (
            <View style={styles.menu}>
              <View style={styles.menuIdentity}>
                <AppText variant="label">{displayName || 'Student'}</AppText>
                <AppText variant="caption" color="textSecondary" numberOfLines={1}>{email}</AppText>
              </View>
              <Pressable onPress={() => { setOpen(false); router.navigate(routes.profileTab); }} style={styles.menuItem}>
                <Icon name="user" size={17} color="textBody" />
                <AppText variant="label">Profile</AppText>
              </Pressable>
              <Pressable onPress={() => { setOpen(false); router.navigate(routes.profileTab); }} style={styles.menuItem}>
                <Icon name="settings" size={17} color="textBody" />
                <AppText variant="label">Settings</AppText>
              </Pressable>
              <View style={styles.menuDivider} />
              <Pressable onPress={() => void auth?.logout()} style={styles.menuItem}>
                <Icon name="log-out" size={17} color="errorText" />
                <AppText variant="label" color="errorText">Log out</AppText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: desktop.topBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: desktop.gutter,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.lg,
    zIndex: 30,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error, borderWidth: 2, borderColor: colors.card },
  accountButton: { height: 40, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingLeft: 4, paddingRight: 10, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  menu: { position: 'absolute', right: 0, top: 48, width: 220, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 6, zIndex: 50, shadowColor: colors.shadow, shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
  menuIdentity: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.divider, marginBottom: 6 },
  menuItem: { height: 38, paddingHorizontal: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 6 },
});
