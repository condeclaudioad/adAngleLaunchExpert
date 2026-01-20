import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-accent-gradient text-white hover:opacity-90 shadow-glow-soft hover:shadow-glow-orange border border-transparent',
    secondary: 'bg-bg-tertiary text-text-primary hover:bg-border-default border border-border-default hover:border-border-hover',
    outline: 'bg-transparent text-text-primary border border-border-default hover:border-text-muted hover:text-white',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${widthClass}
        ${className}
      `}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
