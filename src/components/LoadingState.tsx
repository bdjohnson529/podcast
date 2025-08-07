'use client';

interface LoadingStateProps {
  message: string;
  subMessage?: string;
}

export function LoadingState({ message, subMessage }: LoadingStateProps) {
  return (
    <div className="card text-center py-12">
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-accent-400 rounded-full animate-spin animation-delay-150"></div>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {message}
      </h3>
      
      {subMessage && (
        <p className="text-gray-600 text-sm">
          {subMessage}
        </p>
      )}
      
      <div className="mt-6 flex justify-center space-x-2">
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce animation-delay-100"></div>
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce animation-delay-200"></div>
      </div>
    </div>
  );
}
