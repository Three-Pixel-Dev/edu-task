import { QUIZ_TYPES } from '@/constants/app';
import type { QuizType } from '@/types';
import { Badge } from '../ui';

/** "Multiple choice" (blue) or "Quiz" (purple accent) tag. */
export function QuizTypeBadge({ type, withIcon = true }: { type: QuizType; withIcon?: boolean }) {
  const meta = QUIZ_TYPES[type];
  return <Badge label={meta.label} tone={type === 'trueFalse' ? 'accent' : 'primary'} icon={withIcon ? meta.icon : undefined} />;
}
