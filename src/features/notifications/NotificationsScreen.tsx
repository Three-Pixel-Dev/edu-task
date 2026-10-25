import { Alert, Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  LoadingState,
  Screen,
  ScreenHeader,
} from '@/components';
import { useNotificationActions, useNotifications } from '@/hooks';
import { messageOf } from '@/services/errors';
import { colors, radius, spacing } from '@/theme';
import type { AppNotification, NotificationType } from '@/types';
import { formatRelativeDay, formatTime } from '@/utils/date';

const typeLabel: Record<NotificationType, string> = {
  taskDue: 'Task due',
  taskOverdue: 'Task overdue',
  quizCompleted: 'Quiz completed',
};

const typeIcon: Record<NotificationType, 'clock' | 'alert-circle' | 'check-circle'> = {
  taskDue: 'clock',
  taskOverdue: 'alert-circle',
  quizCompleted: 'check-circle',
};

export function NotificationsScreen() {
  const { notifications, unreadCount, status, error, retry } = useNotifications();
  const { markAllRead, remove, openNotification } = useNotificationActions();

  const onMarkAll = () => {
    void markAllRead().catch((e: unknown) => Alert.alert('Couldn’t update', messageOf(e)));
  };

  const onDelete = (item: AppNotification) => {
    Alert.alert('Delete notification?', item.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void remove(item.id).catch((e: unknown) => Alert.alert('Couldn’t delete', messageOf(e))),
      },
    ]);
  };

  let body: React.ReactNode;
  if (status === 'loading') {
    body = <LoadingState rows={5} label="Loading notifications" />;
  } else if (status === 'error') {
    body = <ErrorState title="Couldn’t load notifications" message={error ?? undefined} onRetry={retry} />;
  } else if (notifications.length === 0) {
    body = (
      <EmptyState
        icon="bell"
        title="You’re all caught up"
        message="Task reminders and quiz results will show up here."
      />
    );
  } else {
    body = (
      <View style={styles.list}>
        {notifications.map((item) => (
          <NotificationRow key={item.id} item={item} onPress={() => void openNotification(item)} onDelete={() => onDelete(item)} />
        ))}
      </View>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        back
        right={
          unreadCount > 0 ? (
            <Pressable accessibilityRole="button" onPress={onMarkAll} hitSlop={8} style={styles.markAll}>
              <AppText variant="label" color="primaryDark">
                Mark all read
              </AppText>
            </Pressable>
          ) : undefined
        }
      />
      {body}
    </Screen>
  );
}

function NotificationRow({
  item,
  onPress,
  onDelete,
}: {
  item: AppNotification;
  onPress: () => void;
  onDelete: () => void;
}) {
  const when = `${formatRelativeDay(item.createdAt)} · ${formatTime(item.createdAt)}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.read ? '' : 'Unread. '}${typeLabel[item.type]}. ${item.title}. ${item.body}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !item.read && styles.rowUnread, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, !item.read ? styles.iconUnread : styles.iconRead]}>
        <Icon name={typeIcon[item.type]} size={18} color={!item.read ? 'primary' : 'textSecondary'} />
      </View>
      <View style={styles.body}>
        <AppText variant="caption" color="textSecondary">
          {typeLabel[item.type]} · {when}
        </AppText>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {item.title}
        </AppText>
        <AppText variant="body" color="textSecondary" numberOfLines={2}>
          {item.body}
        </AppText>
      </View>
      <IconButton icon="trash-2" accessibilityLabel="Delete notification" variant="plain" onPress={onDelete} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  markAll: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowUnread: { borderColor: colors.primaryBorder, backgroundColor: colors.primarySurface },
  pressed: { opacity: 0.92 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconUnread: { backgroundColor: colors.primarySurfaceStrong },
  iconRead: { backgroundColor: colors.surfaceMuted },
  body: { flex: 1, gap: 2 },
});
