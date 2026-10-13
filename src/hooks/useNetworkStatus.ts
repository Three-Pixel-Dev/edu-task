import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * `offline` is true only when the device reports no connection (or no
 * internet reachability). Unknown states count as online so we never block
 * the user on a false alarm. NetInfo is bundled in Expo Go.
 */
export function useNetworkStatus() {
  const [offline, setOffline] = useState(false);
  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        setOffline(state.isConnected === false || state.isInternetReachable === false);
      }),
    [],
  );
  return { offline };
}
