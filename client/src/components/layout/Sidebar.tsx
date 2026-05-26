'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Sidebar.css';

const navItems = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 10L10 3L17 10M5 8.5V16.5H8.5V12.5H11.5V16.5H15V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'My Groups',
    href: '/dashboard/groups',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M7 9C8.65685 9 10 7.65685 10 6C10 4.34315 8.65685 3 7 3C5.34315 3 4 4.34315 4 6C4 7.65685 5.34315 9 7 9ZM7 9C3.68629 9 1 11.2386 1 14V16H13V14C13 11.2386 10.3137 9 7 9ZM14 9C15.6569 9 17 7.65685 17 6C17 4.34315 15.6569 3 14 3M14 9C15.7 9 17.2 9.6 18.3 10.6M19 16V14C19 12.4 18.2 11 16.9 10.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'Assignments',
    href: '/dashboard/assignments',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M6 2H14C15.1046 2 16 2.89543 16 4V18L10 15L4 18V4C4 2.89543 4.89543 2 6 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badge: true,
  },
  {
    label: "AI Teacher's Toolkit",
    href: '/dashboard/toolkit',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L2 7L10 12L18 7L10 2ZM2 13L10 18L18 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'My Library',
    href: '/dashboard/library',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 4H7C8.06087 4 9.07828 4.42143 9.82843 5.17157C10.5786 5.92172 11 6.93913 11 8V17C11 16.2044 10.6839 15.4413 10.1213 14.8787C9.55871 14.3161 8.79565 14 8 14H3V4ZM17 4H13C11.9391 4 10.9217 4.42143 10.1716 5.17157C9.42143 5.92172 9 6.93913 9 8V17C9 16.2044 9.31607 15.4413 9.87868 14.8787C10.4413 14.3161 11.2044 14 12 14H17V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

interface SidebarProps {
  assignmentCount?: number;
}

export default function Sidebar({ assignmentCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">V</div>
        <span className="sidebar__logo-text">VedaAI</span>
      </div>

      <Link href="/dashboard/assignments/create" className="sidebar__create-btn">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Create Assignment
      </Link>

      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
            >
              <span className="sidebar__nav-icon">{item.icon}</span>
              {item.label}
              {item.badge && assignmentCount > 0 && (
                <span className="sidebar__nav-badge">{assignmentCount}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar__bottom">
        <Link href="/dashboard/settings" className="sidebar__settings">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M16.1 12.1C15.9 12.6 16 13.1 16.4 13.5L16.5 13.6C16.8 13.9 17 14.4 17 14.8C17 15.3 16.8 15.7 16.5 16L16 16.5C15.7 16.8 15.2 17 14.8 17C14.3 17 13.9 16.8 13.6 16.5L13.5 16.4C13.1 16 12.6 15.9 12.1 16.1C11.6 16.3 11.3 16.8 11.3 17.3V17.5C11.3 18.3 10.6 19 9.8 19H9.2C8.4 19 7.7 18.3 7.7 17.5V17.3C7.7 16.8 7.4 16.3 6.9 16.1C6.4 15.9 5.9 16 5.5 16.4L5.4 16.5C5.1 16.8 4.6 17 4.2 17C3.7 17 3.3 16.8 3 16.5L2.5 16C2.2 15.7 2 15.3 2 14.8C2 14.4 2.2 13.9 2.5 13.6L2.6 13.5C3 13.1 3.1 12.6 2.9 12.1C2.7 11.6 2.2 11.3 1.7 11.3H1.5C0.7 11.3 0 10.6 0 9.8V9.2C0 8.4 0.7 7.7 1.5 7.7H1.7C2.2 7.7 2.7 7.4 2.9 6.9C3.1 6.4 3 5.9 2.6 5.5L2.5 5.4C2.2 5.1 2 4.6 2 4.2C2 3.7 2.2 3.3 2.5 3L3 2.5C3.3 2.2 3.7 2 4.2 2C4.6 2 5.1 2.2 5.4 2.5L5.5 2.6C5.9 3 6.4 3.1 6.9 2.9H7C7.5 2.7 7.8 2.2 7.8 1.7V1.5C7.8 0.7 8.5 0 9.3 0H9.8C10.6 0 11.3 0.7 11.3 1.5V1.7C11.3 2.2 11.6 2.7 12.1 2.9C12.6 3.1 13.1 3 13.5 2.6L13.6 2.5C13.9 2.2 14.4 2 14.8 2C15.3 2 15.7 2.2 16 2.5L16.5 3C16.8 3.3 17 3.7 17 4.2C17 4.6 16.8 5.1 16.5 5.4L16.4 5.5C16 5.9 15.9 6.4 16.1 6.9V7C16.3 7.5 16.8 7.8 17.3 7.8H17.5C18.3 7.8 19 8.5 19 9.3V9.8C19 10.6 18.3 11.3 17.5 11.3H17.3C16.8 11.3 16.3 11.6 16.1 12.1Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          Settings
        </Link>
        <div className="sidebar__school">
          <div className="sidebar__school-avatar">DP</div>
          <div className="sidebar__school-info">
            <span className="sidebar__school-name">Delhi Public School</span>
            <span className="sidebar__school-location">Bokaro Steel City</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
