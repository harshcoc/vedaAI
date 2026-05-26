'use client';

import './Spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function Spinner({ size = 'md', text }: SpinnerProps) {
  if (text) {
    return (
      <div className="spinner-container">
        <div className={`spinner spinner--${size}`} />
        <p className="spinner-container__text">{text}</p>
      </div>
    );
  }
  return <div className={`spinner spinner--${size}`} />;
}
