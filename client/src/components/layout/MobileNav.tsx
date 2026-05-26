'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './MobileNav.css';

const tabs = [
  { label: 'Home', href: '/dashboard', icon: 'M3 10L10 3L17 10M5 8.5V16.5H8.5V12.5H11.5V16.5H15V8.5' },
  { label: 'Assignments', href: '/dashboard/assignments', icon: 'M6 2H14C15.1046 2 16 2.89543 16 4V18L10 15L4 18V4C4 2.89543 4.89543 2 6 2Z' },
  { label: 'Library', href: '/dashboard/library', icon: 'M3 4H7C8.06087 4 9.07828 4.42143 9.82843 5.17157C10.5786 5.92172 11 6.93913 11 8V17C11 16.2044 10.6839 15.4413 10.1213 14.8787C9.55871 14.3161 8.79565 14 8 14H3V4ZM17 4H13C11.9391 4 10.9217 4.42143 10.1716 5.17157C9.42143 5.92172 9 6.93913 9 8V17C9 16.2044 9.31607 15.4413 9.87868 14.8787C10.4413 14.3161 11.2044 14 12 14H17V4Z' },
  { label: 'AI Toolkit', href: '/dashboard/toolkit', icon: 'M10 2L2 7L10 12L18 7L10 2ZM2 13L10 18L18 13' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <Link href="/dashboard/assignments/create" className="mobile-nav__fab" aria-label="Create assignment">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </Link>
      <nav className="mobile-nav">
        <div className="mobile-nav__tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href));
            return (
              <Link key={tab.href} href={tab.href} className={`mobile-nav__tab ${isActive ? 'mobile-nav__tab--active' : ''}`}>
                <svg className="mobile-nav__tab-icon" viewBox="0 0 20 20" fill="none">
                  <path d={tab.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
