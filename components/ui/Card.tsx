import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'accent' | 'interactive';
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  noPadding = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'rounded-2xl border transition-all duration-200 overflow-hidden';

  const variants = {
    default: 'bg-bg-secondary border-border-default',
    glass: 'glass-card', // defined in globals.css
    accent: 'bg-gradient-to-br from-accent-primary/5 to-transparent border-accent-primary/20',
    interactive: 'bg-bg-secondary border-border-default hover:-translate-y-1 hover:shadow-glow-soft hover:border-border-hover cursor-pointer'
  };

  const paddingClass = noPadding ? '' : 'p-5';

  return (
    <div
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${paddingClass}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`p-5 pb-0 ${className}`} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-text-primary ${className}`} {...props} />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className = '', ...props }) => (
  <p className={`text-sm text-text-secondary mt-1 ${className}`} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`p-5 ${className}`} {...props} />
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`p-5 pt-0 flex items-center gap-3 ${className}`} {...props} />
);