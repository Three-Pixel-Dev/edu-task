import { TASKS } from '@/constants/app';
import type { RegisterInput, TaskInput } from '@/types';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (value: string) => EMAIL_RE.test(value.trim());

export function validateLogin(email: string, password: string) {
  const errors: FieldErrors<{ email: string; password: string }> = {};
  if (!email.trim()) errors.email = 'Enter your email.';
  else if (!isEmail(email)) errors.email = 'That doesn’t look like an email address.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function validateRegister(input: RegisterInput & { confirmPassword: string }) {
  const errors: FieldErrors<RegisterInput & { confirmPassword: string }> = {};
  if (input.fullName.trim().length < 2) errors.fullName = 'Enter your full name.';
  if (!isEmail(input.email)) errors.email = 'Enter a valid student email.';
  if (input.password.length < 8) errors.password = 'Use at least 8 characters.';
  if (input.confirmPassword !== input.password) errors.confirmPassword = 'Passwords don’t match.';
  return errors;
}

export type PasswordStrength = 0 | 1 | 2 | 3;

export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  if (password.length < 8) return 1;
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return hasDigit && hasSymbol ? 3 : 2;
}

export function validateTask(input: TaskInput) {
  const errors: FieldErrors<TaskInput> = {};
  if (!input.title.trim()) errors.title = 'Add a title so you can find this task later.';
  else if (input.title.length > TASKS.titleMaxLength) errors.title = `Keep the title under ${TASKS.titleMaxLength} characters.`;
  if (input.description.length > TASKS.descriptionMaxLength) errors.description = `Keep the description under ${TASKS.descriptionMaxLength} characters.`;
  if (!input.subjectId) errors.subjectId = 'Choose a subject.';
  if (Number.isNaN(new Date(input.dueDate).getTime())) errors.dueDate = 'Choose a due date.';
  return errors;
}

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;
