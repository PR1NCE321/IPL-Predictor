'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, CalendarDays, Swords, BarChart3, Gamepad2, Shield, Sparkles, Trophy, MapPin, Crosshair } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveStatusBanner } from './LiveStatusBanner';

const NAV_LINKS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Matches', href: '/matches', icon: CalendarDays },
  { label: 'Head-to-Head', href: '/head-to-head', icon: Swords },
  { label: 'Fantasy', href: '/fantasy', icon: Sparkles },
  { label: 'Simulator', href: '/simulator', icon: Gamepad2 },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Venues', href: '/analytics/venues', icon: MapPin },
  { label: 'Battles', href: '/analytics/battles', icon: Crosshair },
  { label: 'Teams', href: '/teams', icon: Shield },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className='fixed top-0 left-0 right-0 z-50 flex flex-col'
        style={{
          background: isScrolled
            ? 'rgba(13, 15, 20, 0.88)'
            : 'rgba(13, 15, 20, 0.5)',
          backdropFilter: 'blur(20px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
          borderBottom: isScrolled ? '1px solid rgba(212,175,55,0.12)' : '1px solid transparent',
          boxShadow: isScrolled ? '0 8px 40px rgba(0,0,0,0.5)' : 'none',
          transition: 'background 400ms ease, border-bottom 400ms ease, box-shadow 400ms ease',
        }}
      >
        <LiveStatusBanner />

        <div className='max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8'>
          <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-16' : 'h-[72px]'}`}>

            {/* ── LOGO ── */}
            <Link href='/' className='flex items-center gap-3 group'>
              <motion.div
                whileHover={{ scale: 1.08, rotate: 4 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className='relative rounded-lg overflow-hidden flex-shrink-0'
                style={{
                  width: 44,
                  height: 44,
                  padding: 4,
                  background: 'linear-gradient(135deg, #002B5B 0%, #0A3A6B 100%)',
                  border: '1.5px solid rgba(212,175,55,0.35)',
                  boxShadow: '0 0 16px rgba(212,175,55,0.2), inset 0 1px 2px rgba(255,255,255,0.05)',
                }}
              >
                <img
                  src="/logos/ipl-logo-new-old.avif"
                  alt="IPL"
                  className="w-full h-full object-contain"
                  draggable={false}
                />
                {/* Shine effect on hover */}
                <div className='absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
              </motion.div>

              <div className='flex flex-col'>
                <span
                  className='font-black text-lg tracking-tight leading-none'
                  style={{ fontFamily: 'var(--font-barlow), Barlow Condensed, sans-serif', color: '#FFFFFF' }}
                >
                  IPL
                </span>
                <span
                  className='font-bold text-[11px] uppercase leading-none mt-0.5'
                  style={{ color: '#D4AF37', letterSpacing: '0.18em' }}
                >
                  Predictor
                </span>
              </div>
            </Link>

            {/* ── DESKTOP NAV ── */}
            <div className='hidden lg:flex items-center gap-1' role='navigation' aria-label='Primary navigation'>
              <div
                className='flex items-center gap-0.5 px-1.5 py-1 rounded-full'
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className='relative px-3.5 py-2 text-[13px] font-medium rounded-full transition-colors duration-200 flex items-center gap-1.5'
                      style={{
                        color: isActive ? '#FFFFFF' : '#9AA2B5',
                      }}
                    >
                      {/* Active pill background */}
                      {isActive && (
                        <motion.div
                          layoutId='nav-active-pill'
                          className='absolute inset-0 rounded-full'
                          style={{
                            background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.08))',
                            border: '1px solid rgba(212,175,55,0.2)',
                            boxShadow: '0 0 12px rgba(212,175,55,0.1)',
                          }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}

                      {/* Hover glow (non-active) */}
                      {!isActive && (
                        <span
                          className='absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200'
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                        />
                      )}

                      <Icon
                        size={14}
                        className='relative z-10 flex-shrink-0'
                        strokeWidth={isActive ? 2.4 : 1.8}
                        style={{ color: isActive ? '#D4AF37' : '#6B7280' }}
                      />
                      <span className='relative z-10'>{link.label}</span>

                      {/* Active dot */}
                      {isActive && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className='absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full'
                          style={{ background: '#D4AF37', boxShadow: '0 0 6px rgba(212,175,55,0.6)' }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ── DESKTOP CTA ── */}
            <div className='hidden lg:flex items-center gap-3'>
              {/* Season badge */}
              <div
                className='flex items-center gap-1.5 px-3 py-1.5 rounded-full'
                style={{
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.15)',
                }}
              >
                <Trophy size={12} style={{ color: '#D4AF37' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.08em' }}>
                  2026
                </span>
              </div>
            </div>

            {/* ── MOBILE HAMBURGER ── */}
            <motion.button
              onClick={() => setMobileOpen(!mobileOpen)}
              whileTap={{ scale: 0.9 }}
              type='button'
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className='lg:hidden relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors'
              style={{
                background: mobileOpen ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${mobileOpen ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <AnimatePresence mode='wait'>
                {mobileOpen ? (
                  <motion.div key='close' initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X size={20} style={{ color: '#D4AF37' }} />
                  </motion.div>
                ) : (
                  <motion.div key='menu' initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu size={20} style={{ color: '#9AA2B5' }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ── MOBILE FULLSCREEN MENU ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className='fixed inset-0 z-40 lg:hidden'
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />

            {/* Menu panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className='fixed top-0 right-0 bottom-0 z-50 w-[280px] lg:hidden flex flex-col'
              style={{
                background: 'linear-gradient(180deg, #111318 0%, #0D0F14 100%)',
                borderLeft: '1px solid rgba(212,175,55,0.1)',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
              }}
            >
              {/* Menu header */}
              <div className='flex items-center justify-between p-5 border-b' style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className='flex items-center gap-2.5'>
                  <div
                    className='rounded-lg overflow-hidden flex-shrink-0'
                    style={{
                      width: 36,
                      height: 36,
                      padding: 3,
                      background: 'linear-gradient(135deg, #002B5B, #0A3A6B)',
                      border: '1px solid rgba(212,175,55,0.3)',
                    }}
                  >
                    <img src="/logos/ipl-logo-new-old.avif" alt="IPL" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className='font-bold text-sm' style={{ color: '#FFFFFF', fontFamily: 'var(--font-barlow)' }}>IPL</span>
                    <span className='font-bold text-[10px] uppercase block' style={{ color: '#D4AF37', letterSpacing: '0.15em' }}>Predictor</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className='w-8 h-8 flex items-center justify-center rounded-lg'
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <X size={16} style={{ color: '#9AA2B5' }} />
                </button>
              </div>

              {/* Nav items */}
              <div className='flex-1 overflow-y-auto py-4 px-3'>
                <p className='px-3 mb-3 text-[10px] font-semibold uppercase tracking-[0.15em]' style={{ color: '#3D4356' }}>
                  Navigation
                </p>
                {NAV_LINKS.map((link, idx) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ x: 40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className='flex items-center gap-3 px-3 py-3 rounded-lg mb-0.5 transition-colors relative overflow-hidden'
                        style={{
                          color: isActive ? '#FFFFFF' : '#9AA2B5',
                          background: isActive ? 'rgba(212,175,55,0.08)' : 'transparent',
                        }}
                      >
                        {/* Active bar */}
                        {isActive && (
                          <motion.div
                            layoutId='mobile-nav-bar'
                            className='absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full'
                            style={{ background: '#D4AF37' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                          />
                        )}
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.2 : 1.6}
                          style={{ color: isActive ? '#D4AF37' : '#6B7280', flexShrink: 0 }}
                        />
                        <span className='text-[14px] font-medium'>{link.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className='p-4 border-t' style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className='flex items-center gap-2 px-1'>
                  <Trophy size={12} style={{ color: '#D4AF37' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#3D4356', letterSpacing: '0.06em' }}>
                    IPL Season 2026
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
