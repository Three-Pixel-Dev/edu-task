import Constants from 'expo-constants';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Avatar,
  Button,
  Card,
  ErrorState,
  InlineAlert,
  ListGroup,
  ListRow,
  ProgressBar,
  Screen,
  SectionHeader,
  Skeleton,
  StatGroup,
  StatTile,
} from '@/components';
import { useAuth, useProfile, useQuizHistory, useQuizStats, useTasks, useTaskSections } from '@/hooks';
import { messageOf } from '@/services/errors';
import { colors, spacing } from '@/theme';
import { formatLongDate } from '@/utils/date';
import { ChangePasswordForm } from './ChangePasswordForm';

/** Desktop profile: identity + stats in two columns. */
export function ProfileScreen() {
  const { logout } = useAuth();
  const { profile, status: profileStatus, error: profileError, displayName, email } = useProfile();
  const quiz = useQuizHistory();
  const quizStats = useQuizStats();
  const mcStats = useQuizStats('multipleChoice');
  const tfStats = useQuizStats('trueFalse');
  const tasks = useTasks();
  const { counts } = useTaskSections();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const confirmLogout = async () => {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
    } catch (e) {
      setLoggingOut(false);
      setLogoutError(messageOf(e, 'We couldn’t log you out. Please try again.'));
    }
  };

  const quizLoading = quiz.status === 'loading';
  const tasksLoading = tasks.status === 'loading';
  const completionRate = counts.total ? counts.completed / counts.total : 0;

  return (
    <Screen inTabs>
      <AppText style={styles.pageTitle}>Profile</AppText>
      <View style={styles.columns}>
        <View style={styles.left}>
          <Card style={styles.identity}>
            <Avatar name={displayName || '?'} size={80} />
            <View style={styles.identityText}>
              {profileStatus === 'loading' && !displayName ? <Skeleton width={180} height={24} /> : <AppText variant="heading">{displayName}</AppText>}
              <AppText variant="label" color="textSecondary" numberOfLines={1}>
                {email}
              </AppText>
            </View>
          </Card>
          {profileStatus === 'error' ? <ErrorState title="Couldn’t load your profile" message={profileError ?? undefined} /> : null}

          <Card style={styles.info}>
            <AppText variant="subheading">Student information</AppText>
            <ListGroup>
              <ListRow title="Name" value={displayName || '—'} />
              <ListRow title="Email" value={email || '—'} divider />
              <ListRow title="Member since" value={profile ? formatLongDate(profile.createdAt) : '—'} divider />
            </ListGroup>
          </Card>
          <AppText variant="caption" color="textDisabled">
            {`EduTask v${Constants.expoConfig?.version ?? '1.0.0'}`}
          </AppText>
        </View>

        <View style={styles.right}>
          <Card style={styles.sectionCard}>
            <SectionHeader title="Practice statistics" />
            {quiz.status === 'error' ? (
              <ErrorState title="Couldn’t load quiz statistics" message={quiz.error ?? undefined} onRetry={quiz.retry} />
            ) : (
              <StatGroup>
                <StatTile label="Multiple choice" value={quizLoading ? '–' : mcStats.attempts} />
            <StatTile label="Quiz" value={quizLoading ? '–' : tfStats.attempts} valueColor="accent" />
                <StatTile label="Average score" value={quizLoading ? '–' : `${quizStats.average}%`} valueColor="primaryDark" />
                
              </StatGroup>
            )}
          </Card>

          <Card style={styles.sectionCard}>
            <SectionHeader title="Task statistics" />
            {tasks.status === 'error' ? (
              <ErrorState title="Couldn’t load task statistics" message={tasks.error ?? undefined} onRetry={tasks.retry} />
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
          </Card>

          <Card padded={false} style={styles.settings}>
            <AppText variant="subheading" style={styles.settingsTitle}>Settings</AppText>
            <ChangePasswordForm divider />
            <View style={styles.logout}>
              {logoutError ? <InlineAlert message={logoutError} /> : null}
              <Button title="Log out" variant="danger" leftIcon="log-out" fullWidth={false} loading={loggingOut} onPress={confirmLogout} />
            </View>
          </Card>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 30, lineHeight: 38, letterSpacing: -0.6 },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xxl },
  left: { flexBasis: 340, gap: spacing.lg },
  right: { flex: 1, gap: spacing.lg, minWidth: 0 },
  identity: { alignItems: 'center', gap: spacing.md, padding: spacing.xxl },
  identityText: { alignItems: 'center', gap: 4 },
  info: { gap: spacing.md, padding: spacing.xl },
  sectionCard: { gap: spacing.lg, padding: spacing.xl },
  rate: { gap: spacing.sm },
  rateLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  settings: { overflow: 'hidden' },
  settingsTitle: { paddingHorizontal: spacing.xl, paddingTop: 18, paddingBottom: spacing.md },
  logout: { borderTopWidth: 1, borderTopColor: colors.divider, paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, alignItems: 'flex-start' },
});
