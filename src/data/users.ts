import type { User } from '@/types';

/**
 * Demo students for mock mode. The shared demo password is for local
 * development only — it is never sent anywhere and is ignored once Firebase
 * Authentication is configured.
 */
export const DEMO_PASSWORD = 'edutask123';
export const DEMO_EMAIL = 'alvin.tan@student.ceit.edu';

export interface MockUserRecord extends User {
  password: string;
}

export const mockUsers: MockUserRecord[] = [
  {
    id: 'u-alvin',
    fullName: 'Alvin Tan',
    email: DEMO_EMAIL,
    studentId: '22-0147',
    program: 'CEIT',
    year: 4,
    createdAt: '2026-08-04T02:00:00.000Z',
    password: DEMO_PASSWORD,
  },
  {
    id: 'u-thiri',
    fullName: 'Thiri Win',
    email: 'thiri.win@student.ceit.edu',
    studentId: '23-0412',
    program: 'CEIT',
    year: 3,
    createdAt: '2026-08-11T02:00:00.000Z',
    password: DEMO_PASSWORD,
  },
  {
    id: 'u-kaung',
    fullName: 'Kaung Htet',
    email: 'kaung.htet@student.ceit.edu',
    studentId: '22-0093',
    program: 'CEIT',
    year: 4,
    createdAt: '2026-08-05T02:00:00.000Z',
    password: DEMO_PASSWORD,
  },
  {
    id: 'u-may',
    fullName: 'May Phyu',
    email: 'may.phyu@student.ceit.edu',
    studentId: '24-0218',
    program: 'CEIT',
    year: 2,
    createdAt: '2026-09-01T02:00:00.000Z',
    password: DEMO_PASSWORD,
  },
];
