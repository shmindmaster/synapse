import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppError } from '../types';

interface ErrorLogProps {
  errors: AppError[];
  setErrors: React.Dispatch<React.SetStateAction<AppError[]>>;
}

const ErrorLog: React.FC<ErrorLogProps> = ({ errors, setErrors }) => {
  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setErrors(prev => prev.filter(e => {
        if (e.type === 'error') return true;
        const timestamp = e.timestamp instanceof Date ? e.timestamp.getTime() : new Date(e.timestamp).getTime();
        return Date.now() - timestamp < 3000;
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [setErrors]);

  const removeError = (index: number) => {
    setErrors(errors.filter((_, i) => i !== index));
  };

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {errors.map((error, index) => (
        <div
          key={index}
          className={`
            pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl backdrop-blur-md border transition-all duration-300 animate-in slide-in-from-right-8
            ${error.type === 'error' 
              ? 'bg-white/90 dark:bg-red-900/90 border-red-200 dark:border-red-700 text-red-800 dark:text-red-100' 
              : 'bg-white/90 dark:bg-teal-900/90 border-teal-200 dark:border-teal-700 text-teal-800 dark:text-teal-100'
            }
          `}
        >
          {error.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          
          <div className="flex-1 text-sm font-medium leading-relaxed">
            {error.message}
          </div>

          <button 
            onClick={() => removeError(index)} 
            className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ErrorLog;