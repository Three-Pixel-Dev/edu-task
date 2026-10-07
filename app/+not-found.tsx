import { router } from 'expo-router';
import { EmptyState, Screen } from '@/components';

export default function NotFound() {
  return (
    <Screen>
      <EmptyState
        icon="compass"
        title="Page not found"
        message="This screen doesn’t exist. Let’s get you back home."
        actionLabel="Go to Home"
        actionIcon="home"
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}
