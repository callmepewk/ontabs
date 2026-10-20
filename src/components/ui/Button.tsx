import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    // Dimensões por tamanho com geometria consistente (raio moderado, não pílula por padrão)
    const sizeStyles: Record<'sm' | 'md' | 'lg', React.CSSProperties> = {
      sm: { padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)' },
      md: { padding: '9px 16px', fontSize: '14px', borderRadius: 'var(--radius-md)' },
      lg: { padding: '12px 22px', fontSize: '15px', borderRadius: 'var(--radius-md)' },
    };

    // Estilos visuais por variante (cores sólidas de estúdio, sem neon/cyberpunk)
    const variantStyles: Record<'primary' | 'secondary' | 'ghost' | 'danger', React.CSSProperties> = {
      primary: {
        background: 'var(--accent-primary)',
        color: '#ffffff',
        border: '1px solid transparent',
        boxShadow: 'var(--shadow-sm)',
      },
      secondary: {
        background: 'var(--surface-overlay)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-default)',
        boxShadow: 'none',
      },
      ghost: {
        background: 'transparent',
        color: 'var(--text-secondary)',
        border: 'none',
        boxShadow: 'none',
      },
      danger: {
        background: 'rgba(239, 68, 68, 0.12)',
        color: 'var(--accent-coral)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        boxShadow: 'none',
      },
    };

    const combinedStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontWeight: 600,
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'all var(--duration-fast) var(--ease-spring)',
      userSelect: 'none',
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...style,
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={combinedStyle}
        className={`btn btn-${variant} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span
            style={{
              width: 14,
              height: 14,
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
