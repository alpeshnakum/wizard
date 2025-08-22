import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * A reusable component for displaying error messages in a consistent format.
 * Includes an optional "Retry" button for recoverable errors.
 * Accessibility is handled with role="alert".
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message = 'An unexpected error occurred.',
  onRetry,
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center h-full p-8 bg-red-50 border border-red-200 rounded-lg text-center"
    >
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">Operation Failed</h3>
      <p className="text-sm text-red-700 max-w-md">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Try Again
        </button>
      )}
    </div>
  );
};