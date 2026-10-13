import { AUTH, TASKS } from '@/constants/app';
import type { RegisterInput, TaskInput, TaskPriority } from '@/types';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRIORITIES: readonly TaskPriority[] = ['low', 'medium', 'high'];

export const isEmail = (value: string) => EMAIL_RE.test(value.trim());

export function validateLogin(email: string, password: string) {
  const errors: FieldErrors<{ email: string; password: string }> = {};
  if (!email.trim()) errors.email = 'Enter your email.';
  else if (!isEmail(email)) errors.email = 'That doesn’t look like an email address.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export type RegisterForm = RegisterInput & { confirmPassword: string };

/**
 * Password rule: at least 8 characters with at least one letter and one number
 * (Firebase's own minimum is 6; ours is stricter on purpose).
 */
export function passwordProblem(password: string): string | null {
  if (password.length < AUTH.passwordMinLength) return `Use at least ${AUTH.passwordMinLength} characters.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.';
  return null;
}

export function validateRegister(input: RegisterForm) {
  const errors: FieldErrors<RegisterForm> = {};
  const name = input.displayName.trim();
  if (name.length < 2) errors.displayName = 'Enter your full name.';
  else if (name.length > AUTH.displayNameMaxLength) errors.displayName = `Keep your name under ${AUTH.displayNameMaxLength} characters.`;
  if (!isEmail(input.email)) errors.email = 'Enter a valid email address.';
  const pw = passwordProblem(input.password);
  if (pw) errors.password = pw;
  if (input.confirmPassword !== input.password) errors.confirmPassword = 'Passwords don’t match.';
  return errors;
}

export type PasswordStrength = 0 | 1 | 2 | 3;

export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  if (passwordProblem(password)) return 1;
  return /[^A-Za-z0-9]/.test(password) && password.length >= 10 ? 3 : 2;
}

export function validateTask(input: TaskInput) {
  const errors: FieldErrors<TaskInput> = {};
  const title = input.title.trim();
  if (!title) errors.title = 'Add a title so you can find this task later.';
  else if (title.length > TASKS.titleMaxLength) errors.title = `Keep the title under ${TASKS.titleMaxLength} characters.`;
  if (input.description.trim().length > TASKS.descriptionMaxLength) {
    errors.description = `Keep the description under ${TASKS.descriptionMaxLength} characters.`;
  }
  if (!input.subjectId) errors.subjectId = 'Choose a subject.';
  const due = new Date(input.dueDate);
  if (Number.isNaN(due.getTime())) errors.dueDate = 'Choose a valid due date.';
  else if (due.getFullYear() < 2000 || due.getFullYear() > 2100) errors.dueDate = 'Choose a due date between 2000 and 2100.';
  if (!PRIORITIES.includes(input.priority)) errors.priority = 'Choose a priority.';
  return errors;
}

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;
