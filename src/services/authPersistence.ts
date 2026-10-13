import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, type Persistence } from 'firebase/auth';

/** Native: persist the session in AsyncStorage across app restarts. */
export function authPersistence(): Persistence {
  return getReactNativePersistence(AsyncStorage);
}
