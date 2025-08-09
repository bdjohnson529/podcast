import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AudioCourse AI',
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
            <Navbar />
          
          <main className="pt-20">
            {children}
          </main>
          
          <footer className="bg-white/50 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center text-sm text-gray-600">
                <p>© 2025 AudioCourse AI.</p>
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
