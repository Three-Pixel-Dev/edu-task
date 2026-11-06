import { browserLocalPersistence, type Persistence } from 'firebase/auth';

/** Web: persist the session in the browser (localStorage). */
export function authPersistence(): Persistence {
  return browserLocalPersistence;
}
