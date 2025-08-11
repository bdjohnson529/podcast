"use client";

import React from 'react';

export function TopicHeader({
  title,
  onBack,
  right,
  className = '',
}: {
  title: React.ReactNode;
  onBack?: () => void;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
            aria-label="Back to topics"
            title="Back to topics"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
            Back
          </button>
        )}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 text-center flex-1">
        {title}
      </h2>
      <div className="flex items-center gap-2 justify-end" style={{ minWidth: 76 }}>
        {right}
      </div>
    </div>
  );
}

