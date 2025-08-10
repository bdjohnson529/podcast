'use client';

import React from "react";
import { GlobeAltIcon, LockClosedIcon } from "@heroicons/react/24/outline";

interface Props {
  scope: 'personal' | 'public';
  onScopeChange: (scope: 'personal' | 'public') => void;
  showShortcutHints?: boolean; // shows (1) and (2)
  showPublicCount?: boolean;   // shows (n) after Public
  publicCount?: number;
}

const ScopeToggle: React.FC<Props> = ({ scope, onScopeChange, showShortcutHints, showPublicCount, publicCount }) => {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onScopeChange('personal')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          scope === 'personal' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <LockClosedIcon className="h-4 w-4 inline mr-1" />
        Personal
        {showShortcutHints && <span className="ml-1 text-xs opacity-75">(1)</span>}
      </button>
      <button
        onClick={() => onScopeChange('public')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          scope === 'public' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <GlobeAltIcon className="h-4 w-4 inline mr-1" />
        Public
        {showShortcutHints && <span className="ml-1 text-xs opacity-75">(2)</span>}
        {showPublicCount && typeof publicCount === 'number' && (
          <span className="ml-1 text-xs opacity-75">({publicCount})</span>
        )}
      </button>
    </div>
  );
};

export default ScopeToggle;

