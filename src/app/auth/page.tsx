'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function AuthPage() {
  const { user, session, loading, signInWithGoogle, signOut } = useAuth();
  const router = useRouter();

  // Redirect to home if already signed in
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50">
        <div className="container mx-auto px-4 pt-4 pb-8">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Link 
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Podcast Generator
            </Link>
          </div>

          {/* User Profile Card */}
          <div className="max-w-md mx-auto mt-4">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="mb-6">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.full_name || 'User'}
                    className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-primary-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-primary-100 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-primary-700">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome back!
                </h1>
                
                <div className="space-y-1 text-gray-600">
                  <p className="font-medium">{user.user_metadata?.full_name || 'User'}</p>
                  <p className="text-sm">{user.email}</p>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-3">Account Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-medium capitalize">
                      {user.app_metadata?.provider || 'Google'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member since:</span>
                    <span className="font-medium">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last sign in:</span>
                    <span className="font-medium">
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : 'Now'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="bg-primary-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-3">Your Benefits</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Episodes saved across devices
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Unlimited podcast generation
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Personalized recommendations
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Audio generation & download
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Link
                  href="/"
                  className="w-full btn btn-primary"
                >
                  Continue to App
                </Link>
                
                <button
                  onClick={signOut}
                  className="w-full btn btn-secondary"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50">
      <div className="max-w-md w-full mx-auto px-4 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Podcast Generator
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sign in to PodcastAI
          </h1>
          <p className="text-gray-600">
            Sign in to save your episodes and access them anywhere
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 9.74s9-4.19 9-9.74V7l-10-5z"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Get Started
            </h2>
            <p className="text-gray-600 text-sm">
              Sign in with your Google account to unlock all features
            </p>
          </div>

          {/* Sign In Button */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Footer */}
          <p className="text-xs text-gray-500 text-center mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            <br />
          </p>
        </div>
      </div>
    </div>
  );
}
