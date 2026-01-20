
import React, { useEffect } from 'react';
import { AppError } from '../../services/errorHandler';

interface Props {
  error: AppError | null;
  onDismiss: () => void;
}

export const ErrorToast: React.FC<Props> = ({ error, onDismiss }) => {
  if (!error) return null;

  // Auto-dismiss recoverable errors after 6 seconds
  useEffect(() => {
      if (error.recoverable) {
          const timer = setTimeout(onDismiss, 6000);
          return () => clearTimeout(timer);
      }
  }, [error, onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in max-w-sm w-full">
      <div className={`
        p-4 rounded-xl shadow-2xl border flex items-start gap-4 backdrop-blur-sm
        ${error.recoverable 
          ? 'bg-surface/90 border-yellow-500/50 shadow-yellow-900/20' 
          : 'bg-red-950/90 border-red-500/50 shadow-red-900/20'
        }
      `}>
        <div className="text-2xl pt-1">
          {error.recoverable ? '⚠️' : '❌'}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
             <h4 className={`text-sm font-bold mb-1 ${error.recoverable ? 'text-yellow-500' : 'text-red-400'}`}>
                {error.code}
             </h4>
             <button 
               onClick={onDismiss}
               className="text-textMuted hover:text-textMain text-lg leading-none"
             >
               &times;
             </button>
          </div>
          
          <p className="text-sm font-medium text-textMain mb-1">
            {error.userMessage}
          </p>
          
          {error.originalError?.message && (
              <p className="text-[10px] text-textMuted font-mono truncate max-w-[200px] opacity-70">
                  Dev: {error.originalError.message}
              </p>
          )}
        </div>
      </div>
    </div>
  );
};
