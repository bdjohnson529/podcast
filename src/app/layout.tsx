import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/AuthProvider';
import { LoginButton } from '@/components/LoginButton';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AudioCourse AI - AI-Powered Learning Podcasts',
  description: 'Generate and listen to personalized AI-powered podcasts on any topic to accelerate your learning.',
  keywords: ['AI', 'learning', 'podcast', 'education', 'technology', 'courses'],
  authors: [{ name: 'AudioCourse AI Team' }],
  openGraph: {
    title: 'AudioCourse AI',
    description: 'AI-Powered Learning Podcasts',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AuthProvider>
          <div className="min-h-full gradient-bg">
            <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">AC</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">
                      AudioCourse AI
                    </h1>
                  </Link>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600 hidden sm:block">
                      AI-Powered Learning Podcasts
                    </div>
                    <LoginButton />
                  </div>
                </div>
              </div>
            </header>
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          
          <footer className="bg-white/50 border-t border-gray-200 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center text-sm text-gray-600">
                <p>© 2025 AudioCourse AI. Built for AI-powered learning experiences.</p>
                <p className="mt-2">
                  Powered by{' '}
                  <span className="font-medium">OpenAI</span>,{' '}
                  <span className="font-medium">ElevenLabs</span>, and{' '}
                  <span className="font-medium">Supabase</span>
                </p>
              </div>
            </div>
          </footer>
        </div>
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </body>
  </html>
  );
}
