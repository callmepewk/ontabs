import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  radius,
  circle = false,
  className = '',
  style,
  ...props
}) => {
  const combinedStyle: React.CSSProperties = {
    width: circle ? height : width,
    height,
    borderRadius: circle ? '50%' : radius || 'var(--radius-sm)',
    display: 'inline-block',
    ...style,
  };

  return <div className={`skeleton ${className}`} style={combinedStyle} {...props} />;
};
