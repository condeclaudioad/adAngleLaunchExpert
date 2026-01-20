import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'pro' | 'vip' | 'fear' | 'greed' | 'urgency' | 'curiosity' | 'hope';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  size = 'md'
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold tracking-wide rounded-full border transition-colors";

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs"
  };

  const variants = {
    default: "bg-surfaceHighlight text-text-secondary border-transparent",
    accent: "bg-accent-primary/10 text-accent-primary border-accent-primary/20",
    success: "bg-green-500/10 text-green-500 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    danger: "bg-red-500/10 text-red-500 border-red-500/20",
    pro: "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/20 border-opacity-50",
    vip: "bg-gradient-to-r from-yellow-600/20 to-amber-600/20 text-amber-500 border-amber-500/30",

    // Emotions (from prompt)
    fear: "bg-red-500/10 text-red-500 border-red-500/20",
    greed: "bg-green-500/10 text-green-500 border-green-500/20",
    urgency: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    curiosity: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    hope: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
  };

  // Fallback for emotion matching if variant is passed as string dynamically
  const getVariantStyle = (v: string) => {
    // @ts-ignore
    return variants[v] || variants.default;
  };

  return (
    <span className={`${baseStyles} ${sizes[size]} ${getVariantStyle(variant)} ${className}`}>
      {children}
    </span>
  );
};
