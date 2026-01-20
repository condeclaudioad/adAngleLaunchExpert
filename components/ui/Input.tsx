import React from 'react';

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, icon, error, helperText, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider pl-1">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-bg-tertiary border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted/50 
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border-default focus:border-accent-primary'}
            ${icon ? 'pl-10' : ''} 
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 pl-1 mt-0.5">{error}</p>}
      {helperText && !error && <p className="text-xs text-text-muted pl-1 mt-0.5">{helperText}</p>}
    </div>
  );
};

// --- TextArea ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, helperText, showCount, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider pl-1">{label}</label>}
      <textarea
        className={`
          w-full bg-bg-tertiary border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted/50 
          transition-all duration-200 min-h-[120px] resize-y
          focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary
          disabled:opacity-50 disabled:cursor-not-allowed
             ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border-default focus:border-accent-primary'}
          ${className}
        `}
        {...props}
      />
      {/* Footers */}
      <div className="flex justify-between items-start px-1 mt-0.5">
        <div className="flex-1">
          {error && <p className="text-xs text-red-500">{error}</p>}
          {helperText && !error && <p className="text-xs text-text-muted">{helperText}</p>}
        </div>
        {showCount && props.maxLength && typeof props.value === 'string' && (
          <span className="text-xs text-text-muted ml-2">
            {props.value.length} / {props.maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider pl-1">{label}</label>}
      <div className="relative">
        <select
          className={`
            w-full bg-bg-tertiary border rounded-xl px-4 py-3 text-text-primary appearance-none
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary
            disabled:opacity-50 disabled:cursor-not-allowed
             ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border-default focus:border-accent-primary'}
            ${className}
          `}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {/* Chewron */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-red-500 pl-1 mt-0.5">{error}</p>}
    </div>
  );
}
