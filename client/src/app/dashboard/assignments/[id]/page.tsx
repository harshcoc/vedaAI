'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import './view.css';

export default function ViewAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const currentAssignment = useAssignmentStore((s) => s.currentAssignment);
  const generationStatus = useAssignmentStore((s) => s.generationStatus);
  const isLoading = useAssignmentStore((s) => s.isLoading);
  const fetchAssignment = useAssignmentStore((s) => s.fetchAssignment);
  const triggerGeneration = useAssignmentStore((s) => s.triggerGeneration);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial fetch
  useEffect(() => {
    fetchAssignment(id);
  }, [id, fetchAssignment]);

  // Poll for status updates when generating
  useEffect(() => {
    const status = currentAssignment?.status;

    if (status === 'generating' || status === 'draft') {
      // Poll every 3 seconds while generating
      pollIntervalRef.current = setInterval(() => {
        fetchAssignment(id);
      }, 3000);
    }

    if (status === 'completed') {
      // Clear polling and navigate to output
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      router.push(`/dashboard/assignments/${id}/output`);
    }

    if (status === 'failed') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [currentAssignment?.status, id, router, fetchAssignment]);

  if (isLoading && !currentAssignment) {
    return <Spinner size="lg" text="Loading assignment..." />;
  }

  if (!currentAssignment) {
    return (
      <div className="view-page__empty">
        <h2>Assignment not found</h2>
        <Button variant="secondary" onClick={() => router.push('/dashboard/assignments')}>
          Back to Assignments
        </Button>
      </div>
    );
  }

  const statusMap: Record<string, string> = {
    draft: 'Draft',
    generating: 'Generating Question Paper...',
    completed: 'Completed',
    failed: 'Generation Failed',
  };

  const status = currentAssignment.status;
  const isGenerating = status === 'generating' || generationStatus === 'processing' || generationStatus === 'queued';

  return (
    <div className="view-page">
      <div className="view-page__card">
        <div className="view-page__card-header">
          <h1 className="view-page__card-title">{currentAssignment.title}</h1>
          <Badge variant={status === 'completed' ? 'easy' : status === 'failed' ? 'hard' : status === 'generating' ? 'moderate' : 'default'}>
            {statusMap[status] || status}
          </Badge>
        </div>

        <div className="view-page__details">
          <div className="view-page__detail">
            <span className="view-page__detail-label">Due Date</span>
            <span className="view-page__detail-value">{formatDate(currentAssignment.dueDate)}</span>
          </div>
          <div className="view-page__detail">
            <span className="view-page__detail-label">Total Questions</span>
            <span className="view-page__detail-value">{currentAssignment.totalQuestions}</span>
          </div>
          <div className="view-page__detail">
            <span className="view-page__detail-label">Total Marks</span>
            <span className="view-page__detail-value">{currentAssignment.totalMarks}</span>
          </div>
          <div className="view-page__detail">
            <span className="view-page__detail-label">Question Types</span>
            <span className="view-page__detail-value">
              {currentAssignment.questionTypes.map((qt) => qt.type).join(', ')}
            </span>
          </div>
        </div>

        {isGenerating && (
          <div className="view-page__generating">
            <Spinner size="md" />
            <div className="view-page__generating-text">
              <h3>Generating your question paper...</h3>
              <p>Our AI is creating questions from your study material. This may take a minute.</p>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="view-page__failed">
            <p>Generation failed. Please try again.</p>
            <Button variant="primary" onClick={() => triggerGeneration(id)}>
              Retry Generation
            </Button>
          </div>
        )}

        {status === 'completed' && (
          <div className="view-page__completed">
            <Button variant="primary" onClick={() => router.push(`/dashboard/assignments/${id}/output`)}>
              View Question Paper
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
