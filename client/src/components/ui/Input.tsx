'use client';

import { type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode, forwardRef } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', ...props }, ref) => {
    const inputClasses = [
      'input-group__input',
      error && 'input-group__input--error',
      leftIcon && 'input-group__input--with-icon-left',
      rightIcon && 'input-group__input--with-icon-right',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="input-group">
        {label && <label className="input-group__label">{label}</label>}
        <div className="input-group__wrapper">
          {leftIcon && <span className="input-group__icon input-group__icon--left">{leftIcon}</span>}
          <input ref={ref} className={inputClasses} {...props} />
          {rightIcon && <span className="input-group__icon input-group__icon--right">{rightIcon}</span>}
        </div>
        {error && <span className="input-group__error">{error}</span>}
        {helperText && !error && <span className="input-group__helper">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const textareaClasses = [
      'input-group__input',
      'input-group__input--textarea',
      error && 'input-group__input--error',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="input-group">
        {label && <label className="input-group__label">{label}</label>}
        <textarea ref={ref} className={textareaClasses} {...props} />
        {error && <span className="input-group__error">{error}</span>}
        {helperText && !error && <span className="input-group__helper">{helperText}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
