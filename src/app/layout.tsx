import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/sections/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IPL Playoff Predictor - Real-time Cricket Analytics',
  description:
    'Advanced IPL playoff prediction platform with Monte Carlo simulations, live match tracking, and scenario analysis.',
  keywords: [
    'IPL',
    'Cricket',
    'Predictions',
    'Analytics',
    'Playoff',
    'Monte Carlo',
  ],
  authors: [{ name: 'IPL Predictor' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className='scroll-smooth bg-slate-950' data-scroll-behavior='smooth'>
      <body
        className={`${inter.className} bg-slate-950 text-white overflow-x-hidden selection:bg-cyan-400/30 selection:text-white`}
      >
        <a href="#main-content" className="skip-link">Skip to content</a>
        <Navbar />
        <main id='main-content' className='relative z-10 min-h-screen'>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
