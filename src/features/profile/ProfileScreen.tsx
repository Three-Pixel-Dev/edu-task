import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  ListGroup,
  ListRow,
  ProgressBar,
  Screen,
  ScreenHeader,
  SectionHeader,
  StatGroup,
  StatTile,
  SwitchRow,
} from '@/components';
import { routes } from '@/constants/routes';
import { useAuth, useCurrentUser, useQuiz, useQuizStats, useTasks, useTaskSections } from '@/hooks';
import { isFirebaseConfigured } from '@/services/firebase';
import { preferencesService, resetLocalData } from '@/services/preferences';
import { colors, spacing } from '@/theme';
import { formatShortDate } from '@/utils/date';

export function ProfileScreen() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const quizStats = useQuizStats();
  const { counts } = useTaskSections();
  const tasks = useTasks();
  const quiz = useQuiz();
  const [reminders, setReminders] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    void preferencesService.get(user.id).then((p) => setReminders(p.deadlineReminders));
  }, [user.id]);

  const toggleReminders = (value: boolean) => {
    setReminders(value);
    void preferencesService.set(user.id, { deadlineReminders: value });
  };

  const confirmLogout = () => {
    Alert.alert('Log out of EduTask?', 'You can log back in any time with your email and password.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
        },
      },
    ]);
  };

  const confirmReset = () => {
    Alert.alert('Reset demo data?', 'This restores the sample tasks and quiz history and signs you out.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await resetLocalData();
          await logout();
        },
      },
    ]);
  };

  const completionRate = counts.total ? counts.completed / counts.total : 0;

  return (
    <Screen inTabs>
      <ScreenHeader large title="Profile" />

      <Card style={styles.identity}>
        <Avatar name={user.fullName} size={64} />
        <View style={styles.flex}>
          <AppText variant="heading">{user.fullName}</AppText>
          <AppText variant="label" color="textSecondary" numberOfLines={1}>
            {user.email}
          </AppText>
          <View style={styles.badges}>
            <Badge label={`${user.program} · Year ${user.year}`} tone="primary" />
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Student information" />
        <ListGroup>
          <ListRow title="Student ID" value={user.studentId} />
          <ListRow title="Program" value={user.program} divider />
          <ListRow title="Year" value={`Year ${user.year}`} divider />
          <ListRow title="Member since" value={formatShortDate(user.createdAt)} divider />
        </ListGroup>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Quiz statistics" actionLabel="Quiz history" onAction={() => router.navigate(routes.quizTab)} />
        <StatGroup>
          <StatTile label="Quiz attempts" value={quiz.status === 'loading' ? '–' : quizStats.attempts} />
          <StatTile label="Average score" value={quiz.status === 'loading' ? '–' : `${quizStats.average}%`} valueColor="primaryDark" />
          <StatTile label="Levels done" value={quiz.status === 'loading' ? '–' : quizStats.levelsCompleted} />
        </StatGroup>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Task statistics" actionLabel="My tasks" onAction={() => router.navigate(routes.tasksTab)} />
        <StatGroup>
          <StatTile label="Completed" value={tasks.status === 'loading' ? '–' : counts.completed} valueColor="successText" />
          <StatTile label="Active" value={tasks.status === 'loading' ? '–' : counts.active} />
          <StatTile label="Overdue" value={tasks.status === 'loading' ? '–' : counts.overdue} valueColor={counts.overdue ? 'errorText' : 'text'} />
        </StatGroup>
        <Card style={styles.rate}>
          <View style={styles.rateLabels}>
            <AppText variant="caption" color="textSecondary">
              Completion rate
            </AppText>
            <AppText variant="captionStrong">{`${counts.completed} of ${counts.total} · ${Math.round(completionRate * 100)}%`}</AppText>
          </View>
          <ProgressBar value={completionRate} height={8} color={colors.success} accessibilityLabel="Task completion rate" />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Settings" />
        <ListGroup>
          <SwitchRow title="Deadline reminders" subtitle="Remind me the day before a task is due" value={reminders} onValueChange={toggleReminders} />
          <ListRow
            title="Data source"
            icon="database"
            value={isFirebaseConfigured ? 'Firebase' : 'Demo data'}
            divider
          />
          {!isFirebaseConfigured ? <ListRow title="Reset demo data" icon="refresh-cw" onPress={confirmReset} divider /> : null}
        </ListGroup>
      </View>

      <Button title="Log out" variant="danger" leftIcon="log-out" loading={loggingOut} onPress={confirmLogout} />
      <AppText variant="caption" color="textDisabled" align="center">
        {`EduTask v${Constants.expoConfig?.version ?? '1.0.0'}`}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  badges: { flexDirection: 'row', marginTop: spacing.sm },
  section: { gap: spacing.md },
  rate: { gap: spacing.sm },
  rateLabels: { flexDirection: 'row', justifyContent: 'space-between' },
});
