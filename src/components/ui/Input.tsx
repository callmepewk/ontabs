import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, id, className = '', style, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: error ? 'var(--accent-coral)' : 'var(--text-secondary)',
            }}
          >
            {label}
          </label>
        )}

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {leftIcon && (
            <span
              style={{
                position: 'absolute',
                left: '12px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            style={{
              width: '100%',
              background: 'var(--surface-base)',
              border: `1px solid ${error ? 'var(--accent-coral)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-md)',
              padding: leftIcon ? '10px 14px 10px 38px' : '10px 14px',
              paddingRight: rightIcon ? '38px' : '14px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              transition: 'all var(--duration-fast) var(--ease-spring)',
              boxShadow: error ? '0 0 0 1px var(--accent-coral)' : 'none',
              ...style,
            }}
            className={`input-field ${error ? 'input-error' : ''} ${className}`}
            {...props}
          />

          {rightIcon && (
            <span
              style={{
                position: 'absolute',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {(error || helperText) && (
          <span
            style={{
              fontSize: '12px',
              color: error ? 'var(--accent-coral)' : 'var(--text-muted)',
              marginTop: '2px',
            }}
          >
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
