import { format, parseISO } from 'date-fns';
import { QuestionTypeConfig } from '@/types';

/**
 * Format a date string to DD-MM-YYYY
 */
export function formatDate(date: string): string {
  try {
    const parsed = parseISO(date);
    return format(parsed, 'dd-MM-yyyy');
  } catch {
    return date;
  }
}

/**
 * Join class names, filtering out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Calculate total questions and marks from question type configs
 */
export function calculateTotals(questionTypes: QuestionTypeConfig[]): {
  totalQuestions: number;
  totalMarks: number;
} {
  return questionTypes.reduce(
    (acc, qt) => ({
      totalQuestions: acc.totalQuestions + qt.count,
      totalMarks: acc.totalMarks + qt.count * qt.marksPerQuestion,
    }),
    { totalQuestions: 0, totalMarks: 0 }
  );
}

/**
 * Get status label text
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    generating: 'Generating...',
    completed: 'Completed',
    failed: 'Failed',
  };
  return labels[status] || status;
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'var(--color-text-tertiary)',
    generating: 'var(--color-warning)',
    completed: 'var(--color-success)',
    failed: 'var(--color-error)',
  };
  return colors[status] || 'var(--color-text-tertiary)';
}
