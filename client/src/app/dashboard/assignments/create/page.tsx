'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import FileUpload from '@/components/assignments/FileUpload';
import QuestionTypeRow from '@/components/assignments/QuestionTypeRow';
import { Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { QuestionTypeConfig } from '@/types';
import './create.css';

const defaultQuestionTypes: QuestionTypeConfig[] = [
  { type: 'Multiple Choice Questions', count: 4, marksPerQuestion: 1 },
  { type: 'Short Questions', count: 5, marksPerQuestion: 2 },
  { type: 'Diagram/Graph-Based Questions', count: 5, marksPerQuestion: 5 },
  { type: 'Numerical Problems', count: 5, marksPerQuestion: 5 },
];

interface FormErrors {
  file?: string;
  title?: string;
  dueDate?: string;
  questionTypes?: string;
  general?: string;
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const createAssignment = useAssignmentStore((s) => s.createAssignment);
  const triggerGeneration = useAssignmentStore((s) => s.triggerGeneration);
  const isLoading = useAssignmentStore((s) => s.isLoading);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeConfig[]>(defaultQuestionTypes);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const totalQuestions = questionTypes.reduce((sum, qt) => sum + qt.count, 0);
  const totalMarks = questionTypes.reduce((sum, qt) => sum + qt.count * qt.marksPerQuestion, 0);

  const addQuestionType = () => {
    setQuestionTypes([...questionTypes, { type: '', count: 1, marksPerQuestion: 1 }]);
  };

  const removeQuestionType = (index: number) => {
    setQuestionTypes(questionTypes.filter((_, i) => i !== index));
  };

  const updateQuestionType = (index: number, updates: Partial<QuestionTypeConfig>) => {
    setQuestionTypes(questionTypes.map((qt, i) => (i === index ? { ...qt, ...updates } : qt)));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!file) newErrors.file = 'Please upload a file';
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!dueDate) newErrors.dueDate = 'Due date is required';
    else if (new Date(dueDate) <= new Date()) newErrors.dueDate = 'Due date must be in the future';
    if (questionTypes.length === 0) newErrors.questionTypes = 'Add at least one question type';
    if (questionTypes.some((qt) => !qt.type)) newErrors.questionTypes = 'Select a type for all rows';
    if (questionTypes.some((qt) => qt.count < 1 || qt.marksPerQuestion < 1)) {
      newErrors.questionTypes = 'Questions and marks must be at least 1';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append('file', file!);
    formData.append('title', title);
    formData.append('dueDate', dueDate);
    formData.append('questionTypes', JSON.stringify(questionTypes));
    formData.append('additionalInstructions', additionalInstructions);
    formData.append('totalQuestions', String(totalQuestions));
    formData.append('totalMarks', String(totalMarks));

    try {
      const assignment = await createAssignment(formData);
      await triggerGeneration(assignment._id);
      router.push(`/dashboard/assignments/${assignment._id}`);
    } catch {
      setErrors({ general: 'Failed to create assignment. Please try again.' });
    }
  };

  return (
    <div className="create-page">
      <div className="create-page__header">
        <h1 className="create-page__title">Create Assignment</h1>
        <p className="create-page__subtitle">Set up a new assignment for your students.</p>
      </div>

      <div className="create-page__form">
        <section className="create-page__section">
          <h2 className="create-page__section-title">Assignment Details</h2>
          <p className="create-page__section-subtitle">Basic information about your assignment</p>

          <div className="create-page__field">
            <label className="create-page__label">Assignment Title</label>
            <input
              className={`input-group__input ${errors.title ? 'input-group__input--error' : ''}`}
              type="text"
              placeholder="e.g. Quiz on Electricity"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <span className="input-group__error">{errors.title}</span>}
          </div>

          <div className="create-page__field">
            <FileUpload file={file} onFileChange={setFile} error={errors.file} />
          </div>

          <div className="create-page__field">
            <label className="create-page__label">Due Date</label>
            <input
              className={`input-group__input ${errors.dueDate ? 'input-group__input--error' : ''}`}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {errors.dueDate && <span className="input-group__error">{errors.dueDate}</span>}
          </div>
        </section>

        <section className="create-page__section">
          <div className="question-types__header">
            <span className="question-types__header-label">Question Type</span>
            <span className="question-types__header-spacer" />
            <span className="question-types__header-label question-types__header-num">No. of Questions</span>
            <span className="question-types__header-label question-types__header-marks">Marks</span>
          </div>

          {questionTypes.map((qt, i) => (
            <QuestionTypeRow
              key={i}
              config={qt}
              onChange={(updates) => updateQuestionType(i, updates)}
              onRemove={() => removeQuestionType(i)}
              canRemove={questionTypes.length > 1}
            />
          ))}

          {errors.questionTypes && <span className="input-group__error">{errors.questionTypes}</span>}

          <button className="question-types__add" onClick={addQuestionType}>
            <span className="question-types__add-icon">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            Add Question Type
          </button>

          <div className="question-types__totals">
            <span className="question-types__total">Total Questions : <strong>{totalQuestions}</strong></span>
            <span className="question-types__total">Total Marks : <strong>{totalMarks}</strong></span>
          </div>
        </section>

        <section className="create-page__section">
          <Textarea
            label="Additional Information (For better output)"
            placeholder="eg. Generate a question paper for 3 hour exam duration..."
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            rows={4}
          />
        </section>

        {errors.general && (
          <div className="create-page__error">{errors.general}</div>
        )}

        <div className="create-page__actions">
          <Button variant="secondary" onClick={() => router.back()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Previous
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isLoading}>
            Next
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
