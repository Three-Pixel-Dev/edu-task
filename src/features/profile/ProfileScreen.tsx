import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppText,
  AttemptRow,
  Avatar,
  Button,
  Card,
  ErrorState,
  ListGroup,
  ListRow,
  ProgressBar,
  Screen,
  ScreenHeader,
  SectionHeader,
  Skeleton,
  StatGroup,
  StatTile,
} from '@/components';
import { routes } from '@/constants/routes';
import { useAuth, useProfile, useQuizHistory, useQuizStats, useTasks, useTaskSections } from '@/hooks';
import { messageOf } from '@/services/errors';
import { colors, radius, spacing } from '@/theme';
import { formatLongDate } from '@/utils/date';

const HISTORY_PREVIEW = 5;

export function ProfileScreen() {
  const { logout, resetPassword } = useAuth();
  const { profile, status: profileStatus, error: profileError, displayName, email } = useProfile();
  const quiz = useQuizHistory();
  const quizStats = useQuizStats();
  const tasks = useTasks();
  const { counts } = useTaskSections();
  const [loggingOut, setLoggingOut] = useState(false);

  const confirmLogout = () => {
    Alert.alert('Log out of EduTask?', 'You can log back in any time with your email and password.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout(); // Firebase signOut → auth listener → login screen
          } catch (e) {
            setLoggingOut(false);
            Alert.alert('Couldn’t log out', messageOf(e));
          }
        },
      },
    ]);
  };

  const sendReset = () => {
    Alert.alert('Change password', `We’ll email a password reset link to ${email}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send link',
        onPress: async () => {
          try {
            await resetPassword(email);
            Alert.alert('Check your inbox', `A reset link has been sent to ${email}.`);
          } catch (e) {
            Alert.alert('Couldn’t send the link', messageOf(e));
          }
        },
      },
    ]);
  };

  const quizLoading = quiz.status === 'loading';
  const tasksLoading = tasks.status === 'loading';
  const completionRate = counts.total ? counts.completed / counts.total : 0;

  return (
    <Screen inTabs>
      <ScreenHeader large title="Profile" />

      <Card style={styles.identity}>
        <Avatar name={displayName || '?'} size={64} />
        <View style={styles.flex}>
          {profileStatus === 'loading' && !displayName ? (
            <Skeleton width={150} height={22} />
          ) : (
            <AppText variant="heading">{displayName}</AppText>
          )}
          <AppText variant="label" color="textSecondary" numberOfLines={1}>
            {email}
          </AppText>
        </View>
      </Card>
      {profileStatus === 'error' ? <ErrorState title="Couldn’t load your profile" message={profileError ?? undefined} /> : null}

      <View style={styles.section}>
        <SectionHeader title="Account" />
        <ListGroup>
          <ListRow title="Name" value={displayName || '—'} />
          <ListRow title="Email" value={email || '—'} divider />
          <ListRow title="Member since" value={profile ? formatLongDate(profile.createdAt) : '—'} divider />
        </ListGroup>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Quiz statistics" />
        {quiz.status === 'error' ? (
          <Card>
            <ErrorState title="Couldn’t load quiz statistics" message={quiz.error ?? undefined} onRetry={quiz.retry} />
          </Card>
        ) : (
          <StatGroup>
            <StatTile label="Quiz attempts" value={quizLoading ? '–' : quizStats.attempts} />
            <StatTile label="Average score" value={quizLoading ? '–' : `${quizStats.average}%`} valueColor="primaryDark" />
            <StatTile label="Levels done" value={quizLoading ? '–' : quizStats.levelsCompleted} />
          </StatGroup>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Quiz history"
          actionLabel={quiz.results.length > HISTORY_PREVIEW ? 'See all' : undefined}
          onAction={() => router.push(routes.quizHistory)}
        />
        {quizLoading ? (
          <Skeleton height={140} rounded={radius.xxl} />
        ) : quiz.status === 'error' ? null : quiz.results.length === 0 ? (
          <Card tone="muted">
            <AppText variant="body" color="textSecondary">
              No quiz attempts yet.
            </AppText>
          </Card>
        ) : (
          <Card padded={false} style={styles.list}>
            {quiz.results.slice(0, HISTORY_PREVIEW).map((result, i) => (
              <AttemptRow key={result.id} result={result} divider={i > 0} onPress={() => router.push(routes.quizResult(result.id))} />
            ))}
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Task statistics" actionLabel="My tasks" onAction={() => router.navigate(routes.tasksTab)} />
        {tasks.status === 'error' ? (
          <Card>
            <ErrorState title="Couldn’t load task statistics" message={tasks.error ?? undefined} onRetry={tasks.retry} />
          </Card>
        ) : (
          <>
            <StatGroup>
              <StatTile label="Completed" value={tasksLoading ? '–' : counts.completed} valueColor="successText" />
              <StatTile label="Active" value={tasksLoading ? '–' : counts.active} />
              <StatTile label="Overdue" value={tasksLoading ? '–' : counts.overdue} valueColor={counts.overdue ? 'errorText' : 'text'} />
            </StatGroup>
            {!tasksLoading && counts.total > 0 ? (
              <Card style={styles.rate}>
                <View style={styles.rateLabels}>
                  <AppText variant="caption" color="textSecondary">
                    Completion rate
                  </AppText>
                  <AppText variant="captionStrong">{`${counts.completed} of ${counts.total} · ${Math.round(completionRate * 100)}%`}</AppText>
                </View>
                <ProgressBar value={completionRate} height={8} color={colors.success} accessibilityLabel="Task completion rate" />
              </Card>
            ) : null}
          </>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Settings" />
        <ListGroup>
          <ListRow title="Change password" icon="lock" onPress={sendReset} />
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
  flex: { flex: 1, gap: 4 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  section: { gap: spacing.md },
  list: { overflow: 'hidden' },
  rate: { gap: spacing.sm },
  rateLabels: { flexDirection: 'row', justifyContent: 'space-between' },
});
