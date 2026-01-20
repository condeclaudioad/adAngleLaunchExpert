import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'interactive';
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  onClick
}) => {
  const baseStyles = "rounded-2xl p-6 transition-all duration-300";
  
  const variants = {
    default: "bg-surface border border-borderColor shadow-card",
    glass: "glass-card",
    interactive: "bg-surface border border-borderColor hover:border-primary/50 hover:bg-surfaceHighlight cursor-pointer hover:-translate-y-1 hover:shadow-glow"
  };

  return (
    <div 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};