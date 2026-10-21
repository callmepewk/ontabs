import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 1 | 2 | 3;
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, elevation = 1, interactive = false, className = '', style, ...props }, ref) => {
    const elevationStyles: Record<1 | 2 | 3, React.CSSProperties> = {
      1: {
        background: 'var(--surface-base)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      },
      2: {
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-md)',
      },
      3: {
        background: 'var(--surface-overlay)',
        border: '1px solid var(--border-strong)',
        boxShadow: 'var(--shadow-lg)',
      },
    };

    const combinedStyle: React.CSSProperties = {
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      transition: 'border-color var(--duration-fast) var(--ease-spring), transform var(--duration-fast) var(--ease-spring), box-shadow var(--duration-fast) var(--ease-spring)',
      cursor: interactive ? 'pointer' : 'default',
      ...elevationStyles[elevation],
      ...style,
    };

    return (
      <div
        ref={ref}
        style={combinedStyle}
        className={`card ${interactive ? 'card-interactive' : ''} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
