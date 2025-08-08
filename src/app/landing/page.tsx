'use client';

import { useAuth } from '@/components/AuthProvider';
import { useState } from 'react';
import Link from 'next/link';
import { PlayIcon, ClockIcon, StarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

// Sample podcast examples
const podcastExamples = [
  {
    id: 1,
    title: "AI and Machine Learning Fundamentals",
    topic: "Introduction to artificial intelligence",
    duration: "8 min",
    familiarity: "new",
    industries: ["Technology", "Business"],
    description: "Perfect for beginners wanting to understand AI basics and real-world applications.",
    keyPoints: ["What is AI?", "Machine Learning vs Deep Learning", "Business Applications", "Future Trends"],
    rating: 4.9
  },
  {
    id: 2,
    title: "Sustainable Energy Solutions",
    topic: "Renewable energy technologies",
    duration: "12 min",
    familiarity: "some",
    industries: ["Environment", "Engineering"],
    description: "Exploring solar, wind, and emerging clean energy technologies for climate action.",
    keyPoints: ["Solar Panel Efficiency", "Wind Power Innovations", "Energy Storage", "Policy Impact"],
    rating: 4.8
  },
  {
    id: 3,
    title: "Modern Investment Strategies",
    topic: "Personal finance and investing",
    duration: "10 min",
    familiarity: "expert",
    industries: ["Finance", "Economics"],
    description: "Advanced portfolio management and emerging investment opportunities.",
    keyPoints: ["Diversification Strategies", "ESG Investing", "Crypto Assets", "Risk Management"],
    rating: 4.7
  }
];

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [selectedExample, setSelectedExample] = useState(podcastExamples[0]);

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2">
            {/* Hero Section */}
            <div className="text-center lg:text-left mb-12">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Learn Anything with
                <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  {' '}AI Podcasts
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Transform any topic into a personalized podcast. Get AI-powered explanations 
                tailored to your level, with real-world examples and practical insights.
              </p>
              
              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn || loading}
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-primary-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isSigningIn ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </button>
                
                <Link
                  href="/demo"
                  className="flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-lg hover:border-primary-500 hover:text-primary-600 transition-all"
                >
                  Try Demo First
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ClockIcon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Custom Duration</h3>
                <p className="text-sm text-gray-600">1-15 minutes tailored to your schedule</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <StarIcon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Skill Level Adaptive</h3>
                <p className="text-sm text-gray-600">Beginner to expert explanations</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <PlayIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Audio Generation</h3>
                <p className="text-sm text-gray-600">High-quality AI narration</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Choose AudioCourse AI?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Personalized Learning</h4>
                    <p className="text-gray-600 text-sm">Content adapted to your knowledge level and industry focus</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Save Anywhere</h4>
                    <p className="text-gray-600 text-sm">Access your episodes across all devices</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Real Examples</h4>
                    <p className="text-gray-600 text-sm">Practical case studies and applications</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Quick & Efficient</h4>
                    <p className="text-gray-600 text-sm">Learn complex topics in minutes, not hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Podcast Examples */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Popular Podcast Examples
                </h3>
                <p className="text-sm text-gray-600">
                  See what others are learning about
                </p>
              </div>

              {/* Example List */}
              <div className="divide-y divide-gray-100">
                {podcastExamples.map((example) => (
                  <div
                    key={example.id}
                    onClick={() => setSelectedExample(example)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedExample.id === example.id
                        ? 'bg-primary-50 border-r-2 border-primary-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                        {example.title}
                      </h4>
                      <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                        <StarIcon className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-500">{example.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {example.duration}
                      </span>
                      <span className="capitalize">{example.familiarity}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {example.industries.slice(0, 2).map((industry) => (
                        <span
                          key={industry}
                          className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded"
                        >
                          {industry}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Example Detail */}
              <div className="p-6 bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {selectedExample.title}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {selectedExample.description}
                </p>
                
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-gray-900 mb-2">Key Topics:</h5>
                  <ul className="space-y-1">
                    {selectedExample.keyPoints.map((point, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn || loading}
                  className="w-full bg-primary-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {isSigningIn ? 'Signing in...' : 'Create Similar Podcast'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
