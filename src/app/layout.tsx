import type { Metadata } from 'next';
import { Inter, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import { SideNav } from '@/components/common/SideNav';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-barlow',
});

export const metadata: Metadata = {
  title: 'IPL Playoff Predictor 2026 — Live Analytics',
  description:
    'Advanced IPL playoff prediction platform with Monte Carlo simulations, live match tracking, and scenario analysis.',
  keywords: ['IPL', 'Cricket', 'Predictions', 'Analytics', 'Playoff', 'Monte Carlo'],
  authors: [{ name: 'IPL Predictor' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang='en'
      className={`${inter.variable} ${barlow.variable}`}
      style={{ background: '#0D0F14' }}
    >
      <body
        className='overflow-x-hidden'
        style={{
          background: '#0D0F14',
          color: '#E8E8E8',
          fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
        }}
      >
        <a href='#main-content' className='skip-link'>Skip to content</a>
        <SideNav />
        <main
          id='main-content'
          className='relative z-10 min-h-screen pb-16 md:pb-0 md:ml-[56px]'
        >
          {children}
        </main>
      </body>
    </html>
  );
}
