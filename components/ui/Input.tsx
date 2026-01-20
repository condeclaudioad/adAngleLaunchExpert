
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="text-xs font-semibold text-textMuted uppercase tracking-wider pl-1">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted">
            {icon}
          </div>
        )}
        <input 
          className={`w-full bg-surfaceHighlight border border-borderColor rounded-xl px-4 py-3 text-textMain placeholder-textMuted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="text-xs font-semibold text-textMuted uppercase tracking-wider pl-1">{label}</label>}
      <textarea 
        className={`w-full bg-surfaceHighlight border border-borderColor rounded-xl px-4 py-3 text-textMain placeholder-textMuted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all min-h-[120px] resize-y ${className}`}
        {...props}
      />
    </div>
  );
};
