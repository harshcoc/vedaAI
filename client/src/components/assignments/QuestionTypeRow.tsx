'use client';

import type { QuestionTypeConfig } from '@/types';
import './QuestionTypeRow.css';

const QUESTION_TYPES = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Answer Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'True/False',
  'Fill in the Blanks',
  'Match the Following',
];

interface QuestionTypeRowProps {
  config: QuestionTypeConfig;
  onChange: (updates: Partial<QuestionTypeConfig>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function QuestionTypeRow({ config, onChange, onRemove, canRemove }: QuestionTypeRowProps) {
  return (
    <div className="question-type-row">
      <div className="question-type-row__select">
        <select
          className="select-group__select"
          value={config.type}
          onChange={(e) => onChange({ type: e.target.value })}
        >
          <option value="" disabled>Select type</option>
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <button
        className="question-type-row__remove"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Remove question type"
        style={{ opacity: canRemove ? 1 : 0.3 }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      <div className="question-type-row__number">
        <input
          type="number"
          min="1"
          value={config.count}
          onChange={(e) => onChange({ count: Math.max(1, parseInt(e.target.value) || 1) })}
          aria-label="Number of questions"
        />
      </div>
      <div className="question-type-row__marks">
        <input
          type="number"
          min="1"
          value={config.marksPerQuestion}
          onChange={(e) => onChange({ marksPerQuestion: Math.max(1, parseInt(e.target.value) || 1) })}
          aria-label="Marks per question"
        />
      </div>
    </div>
  );
}
