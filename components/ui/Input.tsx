import React from 'react';

// --- INPUT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  helperText,
  className = '',
  fullWidth = true,
  ...props
}) => {
  const wrapperClass = fullWidth ? 'w-full' : 'inline-block';

  return (
    <div className={`${wrapperClass} flex flex-col gap-1.5`}>
      {label && (
        <label className="text-xs font-medium text-text-secondary ml-1">
          {label}
        </label>
      )}

      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-primary transition-colors">
            {icon}
          </div>
        )}

        <input
          className={`
            w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5
            text-text-primary placeholder:text-text-muted/50
            focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50' : ''}
            ${className}
          `}
          {...props}
        />
      </div>

      {(error || helperText) && (
        <p className={`text-xs ml-1 ${error ? 'text-red-500' : 'text-text-muted'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

// --- TEXTAREA ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  className = '',
  rows = 4,
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-text-secondary ml-1">
          {label}
        </label>
      )}

      <textarea
        rows={rows}
        className={`
          w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-3
          text-text-primary placeholder:text-text-muted/50
          focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-y
          transition-all duration-200
          ${error ? 'border-red-500/50 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />

      {(error || helperText) && (
        <p className={`text-xs ml-1 ${error ? 'text-red-500' : 'text-text-muted'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

// --- SELECT ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-text-secondary ml-1">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          className={`
            w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5
            text-text-primary appearance-none cursor-pointer
            focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${error ? 'border-red-500/50' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Chevron Icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 ml-1">{error}</p>
      )}
    </div>
  );
};
