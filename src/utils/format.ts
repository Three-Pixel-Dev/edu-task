import type { TaskPriority } from '@/types';

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export const priorityLabel: Record<TaskPriority, string> = { low: 'Low', medium: 'Medium', high: 'High' };

export const pluralise = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

export const nowIso = () => new Date().toISOString();
