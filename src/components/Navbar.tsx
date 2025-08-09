'use client';

import Link from 'next/link';
import { LoginButton } from '@/components/LoginButton';

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 z-20">
      <div className="flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8">
        <div className="w-64 flex justify-start pl-6">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-700 to-accent-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AC</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              AudioCourse AI
            </h1>
          </Link>
        </div>
        <div className="flex items-center space-x-4 pr-4">
          <LoginButton />
        </div>
      </div>
    </header>
  );
}