import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A reusable spinner component for indicating loading states.
 * Includes accessibility attributes.
 */
export const Spinner: React.FC<SpinnerProps> = ({ text = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-4 text-gray-600">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
};