'use client';

import './Badge.css';

interface BadgeProps {
  variant?: 'easy' | 'moderate' | 'hard' | 'default' | 'primary' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export default function Badge({ variant = 'default', size = 'md', children }: BadgeProps) {
  return <span className={`badge badge--${variant} badge--${size}`}>{children}</span>;
}
