import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'vip' | 'pro';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full whitespace-nowrap transition-colors';

  const variants = {
    default: 'bg-bg-tertiary text-text-secondary border border-border-default',
    accent: 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20',
    success: 'bg-green-500/10 text-green-500 border border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20',
    vip: 'bg-gradient-to-r from-yellow-600/20 to-amber-500/20 text-yellow-500 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]',
    pro: 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400 border border-purple-500/30',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};
