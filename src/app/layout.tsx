import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CommercializeCast - AI Commercialization Podcasts',
  description: 'Generate and listen to short podcasts on commercialization opportunities for new AI topics.',
  keywords: ['AI', 'commercialization', 'podcast', 'business', 'technology'],
  authors: [{ name: 'CommercializeCast Team' }],
  openGraph: {
    title: 'CommercializeCast',
    description: 'AI Commercialization Podcasts',
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
        <div className="min-h-full gradient-bg">
          <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">CC</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">
                    CommercializeCast
                  </h1>
                </div>
                <div className="text-sm text-gray-600">
                  AI Commercialization Podcasts
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
                <p>© 2025 CommercializeCast. Built for exploring AI commercialization opportunities.</p>
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
      </body>
    </html>
  );
}
