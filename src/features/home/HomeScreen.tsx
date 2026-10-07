import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import {
  AppText,
  Avatar,
  Button,
  Card,
  CodeChip,
  ContinueQuizCard,
  Icon,
  ProgressBar,
  Screen,
  SectionHeader,
  Skeleton,
  StatGroup,
  StatTile,
  type IconName,
} from '@/components';
import { routes } from '@/constants/routes';
import { useActiveSession, useCurrentUser, useQuiz, useRecentSubjects, useTasks, useTaskSections } from '@/hooks';
import { colors, radius, spacing } from '@/theme';
import { pluralise, firstNameOf } from '@/utils/format';

export function HomeScreen() {
  const user = useCurrentUser();
  const quiz = useQuiz();
  const tasks = useTasks();
  const active = useActiveSession();
  const recent = useRecentSubjects(3);
  const { counts } = useTaskSections();
  const [refreshing, setRefreshing] = useState(false);

  const loading = quiz.status === 'loading' && quiz.results.length === 0;
  const tasksLoading = tasks.status === 'loading' && tasks.tasks.length === 0;

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([quiz.reload(), tasks.reload()]);
    setRefreshing(false);
  };

  return (
    <Screen inTabs refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="title" accessibilityRole="header">{`Hi, ${firstNameOf(user.fullName)} 👋`}</AppText>
          <AppText variant="body" color="textSecondary">
            Ready to test your knowledge?
          </AppText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.navigate(routes.profileTab)} hitSlop={6}>
          <Avatar name={user.fullName} size={44} />
        </Pressable>
      </View>

      {loading ? (
        <Skeleton height={220} rounded={radius.xxl} />
      ) : active ? (
        <ContinueQuizCard
          subject={active.subject}
          session={active.session}
          onContinue={() => router.push(routes.quizQuestions(active.subject.id, active.session.level))}
        />
      ) : (
        <Card tone="brand" style={styles.startCard}>
          <AppText variant="overline" color="onPrimaryMuted">
            Start learning
          </AppText>
          <AppText variant="heading" color="onPrimary">
            Pick a field and take a 10-question quiz.
          </AppText>
          <Button title="Browse subjects" variant="inverse" size="md" rightIcon="arrow-right" onPress={() => router.push(routes.quizFields)} />
        </Card>
      )}

      <View style={styles.section}>
        <SectionHeader title="Quick access" />
        <View style={styles.quickRow}>
          <QuickTile icon="help-circle" title="Quiz" subtitle="7 fields · 15 levels" tint={colors.primarySurface} iconColor="primary" onPress={() => router.navigate(routes.quizTab)} />
          <QuickTile
            icon="check-square"
            title="Tasks"
            subtitle={tasksLoading ? 'Loading…' : `${counts.active} active`}
            tint={colors.accentSurface}
            iconColor="accent"
            onPress={() => router.navigate(routes.tasksTab)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Recent subjects" actionLabel="Browse" onAction={() => router.push(routes.quizFields)} />
        {loading ? (
          <Skeleton height={150} rounded={radius.xxl} />
        ) : recent.length ? (
          <Card padded={false} style={styles.listCard}>
            {recent.map((item, i) => (
              <Pressable
                key={item.subject.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.subject.name}, ${item.subject.code}, level ${item.level} of ${item.subject.levelCount}`}
                onPress={() => router.push(routes.quizLevels(item.subject.id))}
                style={({ pressed }) => [styles.subjectRow, i > 0 && styles.divider, pressed && styles.pressed]}
              >
                <View style={styles.flex}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {item.subject.name}
                  </AppText>
                  <View style={styles.subjectMeta}>
                    <CodeChip code={item.subject.code} />
                    <AppText variant="caption" color="textSecondary">{`Level ${item.level} of ${item.subject.levelCount}`}</AppText>
                  </View>
                </View>
                <View style={styles.miniProgress}>
                  <ProgressBar value={item.progress} height={4} />
                </View>
                <Icon name="chevron-right" size={18} color="textDisabled" />
              </Pressable>
            ))}
          </Card>
        ) : (
          <Card tone="muted">
            <AppText variant="body" color="textSecondary">
              Subjects you practise will show up here.
            </AppText>
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Task summary" actionLabel="View all" onAction={() => router.navigate(routes.tasksTab)} />
        {tasksLoading ? (
          <Skeleton height={84} rounded={radius.xxl} />
        ) : (
          <>
            <StatGroup>
              <StatTile label="Due today" value={counts.dueToday} dot={colors.warning} onPress={() => router.navigate(routes.tasksTab)} />
              <StatTile label="Upcoming" value={counts.upcoming} dot={colors.primary} onPress={() => router.navigate(routes.tasksTab)} />
              <StatTile label="Completed" value={counts.completed} dot={colors.success} onPress={() => router.navigate(routes.tasksTab)} />
            </StatGroup>
            {counts.overdue > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${pluralise(counts.overdue, 'overdue task')}. Open tasks`}
                onPress={() => router.navigate(routes.tasksTab)}
                style={styles.overdue}
              >
                <Icon name="alert-circle" size={16} color="errorText" />
                <AppText variant="label" color="errorText" style={styles.flex}>
                  {`${pluralise(counts.overdue, 'task')} overdue`}
                </AppText>
                <Icon name="chevron-right" size={16} color="errorText" />
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}

function QuickTile({
  icon,
  title,
  subtitle,
  tint,
  iconColor,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  tint: string;
  iconColor: 'primary' | 'accent';
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${title}, ${subtitle}`} style={styles.quickTile}>
      <View style={[styles.quickIcon, { backgroundColor: tint }]}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <View>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  section: { gap: spacing.md },
  startCard: { padding: spacing.lg + 2, gap: spacing.md },
  quickRow: { flexDirection: 'row', gap: spacing.md },
  quickTile: { flex: 1, gap: spacing.md },
  quickIcon: { width: 40, height: 40, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  listCard: { overflow: 'hidden' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 68 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.background },
  subjectMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  miniProgress: { width: 44 },
  overdue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
});
