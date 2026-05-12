'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
  Swords,
  BarChart3,
  Gamepad2,
  Shield,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/matches', label: 'Matches', icon: CalendarDays },
  { href: '/teams', label: 'Teams', icon: Shield },
  { href: '/head-to-head', label: 'Head to Head', icon: Swords },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/simulator', label: 'Simulator', icon: Gamepad2 },
];

export function SideNav() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* ═══ DESKTOP SIDE RAIL ═══ */}
      <nav
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className='fixed left-0 top-0 bottom-0 z-50 hidden md:flex flex-col items-start py-6'
        style={{
          width: expanded ? 200 : 56,
          background: '#111318',
          borderRight: '1px solid #1E2028',
          transition: 'width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div className='flex items-center gap-3 px-4 mb-8 whitespace-nowrap'>
          <div
            className='flex items-center justify-center shrink-0'
            style={{
              width: 28,
              height: 28,
              background: '#D4AF37',
              borderRadius: 4,
              color: '#0D0F14',
              fontFamily: 'var(--font-barlow), Barlow Condensed, sans-serif',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            IP
          </div>
          <span
            style={{
              fontFamily: 'var(--font-barlow), Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '0.04em',
              color: '#E8E8E8',
              opacity: expanded ? 1 : 0,
              transition: 'opacity 180ms ease',
            }}
          >
            IPL PREDICTOR
          </span>
        </div>

        {/* Nav Items */}
        <div className='flex flex-col gap-1 w-full flex-1'>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className='group relative flex items-center gap-3 px-4 py-3 whitespace-nowrap'
                style={{
                  color: isActive ? '#E8E8E8' : '#8890A0',
                  background: isActive ? 'rgba(212, 175, 55, 0.06)' : 'transparent',
                  transition: 'color 150ms ease, background 150ms ease',
                }}
              >
                {/* Active gold bar */}
                {isActive && (
                  <motion.div
                    layoutId='nav-active-bar'
                    className='absolute left-0 top-2 bottom-2'
                    style={{
                      width: 3,
                      background: '#D4AF37',
                      borderRadius: '0 2px 2px 0',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} className='shrink-0' />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    opacity: expanded ? 1 : 0,
                    transition: 'opacity 180ms ease',
                  }}
                >
                  {item.label}
                </span>

                {/* Tooltip when collapsed */}
                {!expanded && (
                  <span
                    className='absolute left-14 px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none'
                    style={{
                      background: '#1A1D26',
                      border: '1px solid #1E2028',
                      borderRadius: 4,
                      color: '#E8E8E8',
                      transition: 'opacity 120ms ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ═══ MOBILE BOTTOM TAB BAR ═══ */}
      <nav
        className='fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around'
        style={{
          height: 56,
          background: '#111318',
          borderTop: '1px solid #1E2028',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className='relative flex flex-col items-center justify-center gap-1 flex-1 py-2'
              style={{ color: isActive ? '#D4AF37' : '#8890A0' }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em' }}>
                {item.label.split(' ')[0]}
              </span>
              {isActive && (
                <motion.div
                  layoutId='mobile-tab-underline'
                  className='absolute bottom-0 left-3 right-3'
                  style={{ height: 2, background: '#D4AF37', borderRadius: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
