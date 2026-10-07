import { TASKS } from '@/constants/app';
import type { Task, TaskSection, TaskUrgency } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Returns a date `days` from today at the given local time. */
export function daysFromNow(days: number, hours = 23, minutes = 59, now = new Date()) {
  const d = startOfDay(now);
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const longDate = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const timeOnly = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

export const formatShortDate = (iso: string) => shortDate.format(new Date(iso));
export const formatLongDate = (iso: string) => longDate.format(new Date(iso));
export const formatTime = (iso: string) => timeOnly.format(new Date(iso));

export function formatRelativeDay(iso: string, now = new Date()) {
  const date = new Date(iso);
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return formatShortDate(iso);
}

export function taskUrgency(task: Task, now = new Date()): TaskUrgency {
  if (task.status === 'completed') return 'completed';
  const due = new Date(task.dueDate).getTime();
  if (due < now.getTime()) return 'overdue';
  if (due - now.getTime() <= TASKS.dueSoonHours * 60 * 60 * 1000 || isSameDay(new Date(task.dueDate), now)) return 'dueSoon';
  return 'upcoming';
}

/** Today = pending tasks due today or already overdue. */
export function taskSection(task: Task, now = new Date()): TaskSection {
  if (task.status === 'completed') return 'completed';
  return new Date(task.dueDate).getTime() <= endOfDay(now).getTime() ? 'today' : 'upcoming';
}

export function dueLabel(task: Task, now = new Date()) {
  if (task.status === 'completed') {
    return task.completedAt ? `Completed ${formatRelativeDay(task.completedAt, now).toLowerCase() === 'today' ? 'today' : formatShortDate(task.completedAt)}` : 'Completed';
  }
  const due = new Date(task.dueDate);
  if (due.getTime() < now.getTime()) return `Overdue · ${formatShortDate(task.dueDate)}`;
  if (isSameDay(due, now)) return `Due today, ${formatTime(task.dueDate)}`;
  const relative = formatRelativeDay(task.dueDate, now);
  return relative === 'Tomorrow' ? `Due tomorrow, ${formatTime(task.dueDate)}` : `Due ${relative}`;
}

export function greetingFor(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
