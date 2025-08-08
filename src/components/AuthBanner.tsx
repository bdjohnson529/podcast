'use client';

import { useAuth } from './AuthProvider';
import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export function AuthBanner() {
  const { session } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if user is signed in or banner is dismissed
  if (session || isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 9.74s9-4.19 9-9.74V7l-10-5z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                🎯 <strong>Save your episodes forever!</strong> Sign in to access your podcasts from anywhere.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              href="/auth"
              className="bg-white text-primary-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign in free
            </Link>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Dismiss banner"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
