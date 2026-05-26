'use client';

import { useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import './TopBar.css';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
}

export default function TopBar({ title = 'Assignment', showBack = true }: TopBarProps) {
  const router = useRouter();

  return (
    <header className="topbar">
      <div className="topbar__left">
        {showBack && (
          <button className="topbar__back" onClick={() => router.back()} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <div className="topbar__breadcrumb">
          <svg className="topbar__breadcrumb-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>{title}</span>
        </div>
      </div>
      <div className="topbar__right">
        <button className="topbar__notification" aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2C7.23858 2 5 4.23858 5 7V10L3 13H17L15 10V7C15 4.23858 12.7614 2 10 2ZM10 2V1M8 16C8 17.1046 8.89543 18 10 18C11.1046 18 12 17.1046 12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="topbar__notification-dot" />
        </button>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
