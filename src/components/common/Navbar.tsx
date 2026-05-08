'use client';

import Link from 'next/link';
import { Menu, X, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveStatusBanner } from './LiveStatusBanner';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Live Matches', href: '/matches' },
    { label: 'Head-to-Head', href: '/head-to-head' },
    { label: 'Fantasy', href: '/fantasy' },
    { label: 'Simulator', href: '/simulator' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Team Stats', href: '/teams' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 flex flex-col transition-all duration-300 ${
        isScrolled
          ? 'bg-[#05030f]/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_20px_60px_rgba(2,6,23,0.55)]'
          : 'bg-transparent pt-4'
      }`}
    >
      <LiveStatusBanner />
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full'>
        <div className={`flex justify-between items-center transition-all duration-300 ${isScrolled ? 'h-16' : 'h-20'}`}>
          {/* Logo */}
          <Link href='/' className='flex items-center space-x-3 group relative'>
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.3 }}
              className='relative flex items-center justify-center w-12 h-12 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.5)] overflow-hidden border-2 border-cyan-400/30'
            >
              <img src="/logos/app-logo.png" alt="IPL Predictor Logo" className="w-full h-full object-cover" />
            </motion.div>
            <div className='flex flex-col'>
              <span className='font-black text-white text-xl tracking-tight leading-none'>
                IPL
              </span>
              <span className='text-cyan-300 font-bold text-sm uppercase tracking-[0.28em] leading-none mt-1'>
                Predictor
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex items-center space-x-2 bg-white/5 backdrop-blur-xl px-2 py-1.5 rounded-full border border-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.45)]' aria-label="Primary navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className='relative px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-full transition-all duration-300 group overflow-hidden focus-visible:text-white'
              >
                <span className="relative z-10">{link.label}</span>
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-fuchsia-400/20 to-violet-400/20 scale-0 rounded-full group-hover:scale-100 transition-transform duration-300 ease-out origin-center"></span>
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className='hidden sm:flex items-center'>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              aria-label="Launch the IPL Predictor app"
              className='px-6 py-2.5 vibrant-button shadow-neon-accent'
            >
              Launch App
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isOpen}
            className='lg:hidden relative p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors backdrop-blur-md neon-ring'
          >
            {isOpen ? (
              <X className='w-6 h-6 text-accent-400' />
            ) : (
              <Menu className='w-6 h-6 text-cyan-300' />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='lg:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl overflow-hidden'
          >
            <div className="py-4 px-4 flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className='px-4 py-3 text-base font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-all flex items-center space-x-2 focus-visible:bg-white/10'
                  onClick={() => setIsOpen(false)}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400 opacity-0 transition-opacity"></div>
                  <span>{link.label}</span>
                </Link>
              ))}
              <div className="pt-4 border-t border-white/5 mt-2">
                <button type="button" aria-label="Launch the IPL Predictor app" className='w-full px-6 py-3 vibrant-button text-center'>
                  Launch App
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
