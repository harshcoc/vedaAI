'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import './output.css';

export default function OutputPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const generatedPaper = useAssignmentStore((s) => s.generatedPaper);
  const currentAssignment = useAssignmentStore((s) => s.currentAssignment);
  const isLoading = useAssignmentStore((s) => s.isLoading);
  const fetchGeneratedPaper = useAssignmentStore((s) => s.fetchGeneratedPaper);
  const fetchAssignment = useAssignmentStore((s) => s.fetchAssignment);
  const triggerGeneration = useAssignmentStore((s) => s.triggerGeneration);

  // Editable school info
  const [schoolName, setSchoolName] = useState('Delhi Public School');
  const [cityName, setCityName] = useState('Bokaro Steel City');
  const [isEditingSchool, setIsEditingSchool] = useState(false);

  useEffect(() => {
    fetchAssignment(id);
    fetchGeneratedPaper(id);
  }, [id, fetchAssignment, fetchGeneratedPaper]);

  const handleDownloadPDF = async () => {
    try {
      const res = await api.get(`/api/assignments/${id}/paper/pdf`);
      const downloadUrl = res.data.data?.downloadUrl;
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      } else {
        alert('PDF download URL not available.');
      }
    } catch {
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleRegenerate = async () => {
    await triggerGeneration(id);
    router.push(`/dashboard/assignments/${id}`);
  };

  if (isLoading && !generatedPaper) {
    return <Spinner size="lg" text="Loading question paper..." />;
  }

  if (!generatedPaper) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>No generated paper found</h2>
        <p style={{ color: 'var(--color-text-secondary)', margin: '1rem 0' }}>
          The question paper hasn&apos;t been generated yet.
        </p>
        <Button variant="primary" onClick={() => router.push(`/dashboard/assignments/${id}`)}>
          Go Back
        </Button>
      </div>
    );
  }

  const { sections, metadata } = generatedPaper;

  return (
    <div className="output-page">
      {/* Action Bar */}
      <div className="output-page__action-bar">
        <Button variant="ghost" onClick={() => router.back()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </Button>
        <div className="output-page__action-bar-right">
          <Button variant="secondary" onClick={handleRegenerate}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8C2 4.68629 4.68629 2 8 2C10.2208 2 12.1599 3.26209 13.1973 5.10527M14 8C14 11.3137 11.3137 14 8 14C5.77924 14 3.84014 12.7379 2.80269 10.8947M13.1973 5.10527V2M13.1973 5.10527H10.0921M2.80269 10.8947V14M2.80269 10.8947H5.90789" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Regenerate
          </Button>
          <Button variant="primary" onClick={handleDownloadPDF}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2V10M8 10L5 7M8 10L11 7M3 13H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download PDF
          </Button>
        </div>
      </div>

      {/* Question Paper */}
      <div className="paper" id="question-paper">
        <div className="paper__header">
          <h1 className="paper__school">{schoolName}, {cityName}</h1>
          <h2 className="paper__exam-title">{currentAssignment?.title || 'Examination'}</h2>
          <div className="paper__meta-row">
            <span>Subject: <strong>{metadata.subject}</strong></span>
            <span>Duration: <strong>{metadata.duration}</strong></span>
            <span>Maximum Marks: <strong>{metadata.totalMarks}</strong></span>
          </div>
          <hr className="paper__divider" />
        </div>

        <div className="paper__student-info">
          <div className="paper__student-row">
            <label>Name:</label>
            <span className="paper__student-line" />
          </div>
          <div className="paper__student-row-group">
            <div className="paper__student-row">
              <label>Roll Number:</label>
              <span className="paper__student-line" />
            </div>
            <div className="paper__student-row">
              <label>Section:</label>
              <span className="paper__student-line" />
            </div>
          </div>
          <div className="paper__student-row">
            <label>Date:</label>
            <span className="paper__student-line" />
          </div>
        </div>

        <hr className="paper__divider" />

        <div className="paper__instructions">
          <strong>General Instructions:</strong>
          <ul>
            <li>All questions are compulsory unless stated otherwise.</li>
            <li>Read each question carefully before answering.</li>
            <li>Marks are indicated against each question.</li>
          </ul>
        </div>

        {sections.map((section, sIndex) => (
          <div key={sIndex} className="paper__section">
            <h3 className="paper__section-title">{section.title}</h3>
            <p className="paper__section-instruction">{section.instruction}</p>

            <div className="paper__questions">
              {section.questions.map((q) => (
                <div key={q.questionNumber} className="paper__question">
                  <div className="paper__question-header">
                    <span className="paper__question-number">Q{q.questionNumber}.</span>
                    <span className="paper__question-text">{q.text}</span>
                    <div className="paper__question-badges">
                      <Badge variant={q.difficulty as 'easy' | 'moderate' | 'hard'} size="sm">
                        {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                      </Badge>
                    </div>
                  </div>
                  {q.options && q.options.length > 0 && (
                    <div className="paper__question-options">
                      {q.options.map((opt, oIndex) => (
                        <span key={oIndex} className="paper__question-option">
                          ({String.fromCharCode(97 + oIndex)}) {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="paper__footer">
          <hr className="paper__divider" />
          <p className="paper__footer-text">— End of Question Paper —</p>
          <p className="paper__footer-summary">
            Total Questions: {metadata.totalQuestions} | Total Marks: {metadata.totalMarks}
          </p>
        </div>
      </div>

      {/* School Name Editor — Fixed Bottom Left */}
      <div className={`school-editor ${isEditingSchool ? 'school-editor--open' : ''}`}>
        {isEditingSchool ? (
          <div className="school-editor__panel">
            <div className="school-editor__header">
              <span className="school-editor__title">Edit School Info</span>
              <button
                className="school-editor__close"
                onClick={() => setIsEditingSchool(false)}
                aria-label="Close editor"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11 3L3 11M3 3L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="school-editor__fields">
              <div className="school-editor__field">
                <label className="school-editor__label">School Name</label>
                <input
                  type="text"
                  className="school-editor__input"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Delhi Public School"
                />
              </div>
              <div className="school-editor__field">
                <label className="school-editor__label">City</label>
                <input
                  type="text"
                  className="school-editor__input"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g. Bokaro Steel City"
                />
              </div>
            </div>
            <button
              className="school-editor__done"
              onClick={() => setIsEditingSchool(false)}
            >
              Done
            </button>
          </div>
        ) : (
          <button
            className="school-editor__trigger"
            onClick={() => setIsEditingSchool(true)}
            title="Edit school name & city"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M11.3333 2.66667C11.5084 2.49155 11.7163 2.35273 11.9451 2.25853C12.1739 2.16433 12.4191 2.11621 12.6667 2.11621C12.9143 2.11621 13.1594 2.16433 13.3882 2.25853C13.617 2.35273 13.825 2.49155 14 2.66667C14.1751 2.84179 14.3139 3.04969 14.4081 3.27852C14.5023 3.50735 14.5504 3.75248 14.5504 4C14.5504 4.24752 14.5023 4.49265 14.4081 4.72148C14.3139 4.95031 14.1751 5.15821 14 5.33333L5.33333 14L1.33333 14.6667L2 10.6667L11.3333 2.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Edit School</span>
          </button>
        )}
      </div>
    </div>
  );
}
