'use client';

import Link from 'next/link';
import './EmptyState.css';

export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state__illustration">
        <div className="empty-state__illustration-circle">
          <svg className="empty-state__illustration-icon" viewBox="0 0 80 80" fill="none">
            <circle cx="35" cy="35" r="20" stroke="#D1D5DB" strokeWidth="3"/>
            <path d="M50 50L65 65" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round"/>
            <rect x="25" y="28" width="20" height="3" rx="1.5" fill="#D1D5DB"/>
            <rect x="25" y="35" width="14" height="3" rx="1.5" fill="#D1D5DB"/>
          </svg>
          <div className="empty-state__illustration-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>
      <h2 className="empty-state__title">No assignments yet</h2>
      <p className="empty-state__description">
        Create your first assignment to start collecting and grading student
        submissions. You can set up rubrics, define marking criteria, and let AI
        assist with grading.
      </p>
      <Link href="/dashboard/assignments/create" className="empty-state__action">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Create Your First Assignment
      </Link>
    </div>
  );
}
