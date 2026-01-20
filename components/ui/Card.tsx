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
  ...props
}) => {
  const baseStyles = "rounded-2xl transition-all duration-300 relative overflow-hidden";

  const variants = {
    default: "bg-bg-secondary border border-border-default",
    glass: "glass-card", // Defined in globals.css
    accent: "bg-accent-primary/5 border border-accent-primary/20",
    interactive: "bg-bg-secondary border border-border-default hover:border-accent-primary/50 hover:shadow-glow-soft hover:-translate-y-1 cursor-pointer group"
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${noPadding ? '' : 'p-6'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`p-6 pb-2 ${className}`} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`p-6 pt-2 pb-6 ${className}`} {...props} />
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`p-6 pt-0 flex items-center gap-4 ${className}`} {...props} />
);