'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import type { Assignment } from '@/types';
import './AssignmentCard.css';

interface AssignmentCardProps {
  assignment: Assignment;
  onDelete: (id: string) => void;
  index?: number;
}

export default function AssignmentCard({ assignment, onDelete, index = 0 }: AssignmentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCardClick = () => {
    if (assignment.status === 'completed') {
      router.push(`/dashboard/assignments/${assignment._id}/output`);
    } else {
      router.push(`/dashboard/assignments/${assignment._id}`);
    }
  };

  return (
    <div
      className="assignment-card"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={handleCardClick}
    >
      <div className="assignment-card__header">
        <h3 className="assignment-card__title">{assignment.title}</h3>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            className="assignment-card__menu-btn"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            aria-label="Options"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
              <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
              <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="assignment-card__menu">
              <button
                className="assignment-card__menu-item"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); handleCardClick(); }}
              >
                View Assignment
              </button>
              <button
                className="assignment-card__menu-item assignment-card__menu-item--danger"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(assignment._id); }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="assignment-card__dates">
        <span className="assignment-card__date">Assigned on : {formatDate(assignment.createdAt)}</span>
        <span className="assignment-card__date">Due : {formatDate(assignment.dueDate)}</span>
      </div>
      <div className="assignment-card__status">
        <span className={`assignment-card__status-dot assignment-card__status-dot--${assignment.status}`} />
        <span className="assignment-card__status-text">{assignment.status}</span>
      </div>
    </div>
  );
}
