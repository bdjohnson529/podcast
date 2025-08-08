'use client';

import { useAuth } from './AuthProvider';
import Link from 'next/link';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

export function LoginButton() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-3">
        <Link 
          href="/auth"
          className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
        >
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata?.full_name || 'User'}
              className="w-8 h-8 rounded-full border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {user.user_metadata?.full_name?.split(' ')[0] || 'Account'}
          </span>
        </Link>
        
        <button
          onClick={signOut}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded flex items-center space-x-1"
        >
          <Cog6ToothIcon className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth"
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
    >
      Sign in
    </Link>
  );
}
