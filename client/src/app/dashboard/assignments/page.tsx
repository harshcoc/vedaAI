'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import AssignmentCard from '@/components/assignments/AssignmentCard';
import EmptyState from '@/components/assignments/EmptyState';
import Spinner from '@/components/ui/Spinner';
import './assignments.css';

export default function AssignmentsPage() {
  const assignments = useAssignmentStore((s) => s.assignments);
  const isLoading = useAssignmentStore((s) => s.isLoading);
  const fetchAssignments = useAssignmentStore((s) => s.fetchAssignments);
  const deleteAssignment = useAssignmentStore((s) => s.deleteAssignment);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading && assignments.length === 0) {
    return <Spinner size="lg" text="Loading assignments..." />;
  }

  if (assignments.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="assignments-page">
      <div className="assignments-page__header">
        <div>
          <h1 className="assignments-page__title">Assignments</h1>
          <p className="assignments-page__subtitle">
            Manage and create assignments for your classes.
          </p>
        </div>
      </div>

      <div className="assignments-page__toolbar">
        <button className="assignments-page__filter">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4H14M4 8H12M6 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Filter By
        </button>
        <div className="assignments-page__search">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search Assignment"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="assignments-page__grid">
        {filtered.map((assignment, i) => (
          <AssignmentCard
            key={assignment._id}
            assignment={assignment}
            onDelete={deleteAssignment}
            index={i}
          />
        ))}
      </div>

      {filtered.length === 0 && search && (
        <div className="assignments-page__no-results">
          <p>No assignments matching &quot;{search}&quot;</p>
        </div>
      )}

      <div className="assignments-page__bottom-bar">
        <Link href="/dashboard/assignments/create" className="assignments-page__create-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Create Assignment
        </Link>
      </div>
    </div>
  );
}
