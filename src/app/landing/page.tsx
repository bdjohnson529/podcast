'use client';

import { useAuth } from '@/components/AuthProvider';
import { useState } from 'react';
import Link from 'next/link';
import { PlayIcon, ClockIcon, StarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicSamples from '@/components/PublicSamples';

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  // If user is authenticated, redirect to main app
  if (user) {
    window.location.href = '/';
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(167,139,250,0.15),transparent_50%),radial-gradient(ellipse_at_bottom,_rgba(96,165,250,0.12),transparent_55%)] -mt-20">

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="pt-20 md:pt-28 pb-16">
          {/* Hero Section */}
          <div className="text-center animate-[fadeInUp_500ms_ease-out]">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-ink mb-5">
              Learn Anything with{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-sky bg-200% animate-shimmer">
                AI Podcasts
              </span>
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg md:text-xl text-ink-2 leading-relaxed">
              Transform any topic into a personalized podcast. Get AI-powered explanations 
              tailored to your level, with real-world examples and practical insights.
            </p>

            {/* Public samples player */}
            <PublicSamples />

            {/* Primary CTA */}
            <div className="mt-8 flex flex-col items-center">
              <button
                onClick={handleSignIn}
                disabled={isSigningIn || loading}
                className="inline-flex items-center gap-3 rounded-full px-6 py-3 text-white shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-accent hover:from-primary-600 hover:to-accent-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="rounded-full bg-white/20 p-1.5">
                  {isSigningIn ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                </div>
                {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            <div className="rounded-2xl bg-blue-50 p-6 text-center">
              <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mx-auto">
                <ClockIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Custom Duration</h3>
              <p className="mt-1 text-sm text-gray-600">1-15 minutes tailored to your schedule</p>
            </div>
            
            <div className="rounded-2xl bg-green-50 p-6 text-center">
              <div className="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center mx-auto">
                <StarIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Skill Level Adaptive</h3>
              <p className="mt-1 text-sm text-gray-600">Beginner to expert explanations</p>
            </div>
            
            <div className="rounded-2xl bg-purple-50 p-6 text-center">
              <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center mx-auto">
                <PlayIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Audio Generation</h3>
              <p className="mt-1 text-sm text-gray-600">High-quality AI narration</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
