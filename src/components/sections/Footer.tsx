'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Mail, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='relative border-t border-white/10 bg-slate-950/60 backdrop-blur-2xl pt-16 pb-8 overflow-hidden'>
      {/* Decorative gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"></div>
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-cyan-400/10 blur-[120px] rounded-full animate-float-slow"></div>
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-fuchsia-500/10 blur-[120px] rounded-full animate-float"></div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12'>
          {/* Brand */}
          <div className='space-y-6'>
            <Link href='/' className='flex items-center space-x-3 group'>
              <div className='relative flex items-center justify-center w-10 h-10 rounded-2xl shadow-neon overflow-hidden transition-transform group-hover:scale-110 neon-ring'>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-violet-500" />
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className='flex flex-col'>
                <span className='font-black text-white text-lg tracking-tight leading-none'>IPL</span>
                <span className='text-cyan-300 font-bold text-xs uppercase tracking-[0.28em] leading-none mt-1'>Predictor</span>
              </div>
            </Link>
            <p className='text-slate-400 leading-relaxed'>
              The most advanced Monte Carlo simulation engine for IPL playoff qualification probabilities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='text-white font-bold mb-6 tracking-wide'>Platform</h4>
            <ul className='space-y-4'>
              {['Home', 'Analytics', 'Head-to-Head', 'Fantasy', 'Simulator', 'Teams'].map((item) => (
                <li key={item}>
                  <Link href={item === 'Home' ? '/' : `/${item.toLowerCase().replace(/\s+/g, '-')}`} className='text-slate-400 hover:text-white transition-colors flex items-center group'>
                    <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className='text-white font-bold mb-6 tracking-wide'>Resources</h4>
            <ul className='space-y-4'>
              {['Documentation', 'API Reference', 'Methodology', 'Support'].map((item) => (
                <li key={item}>
                  <a href='#' className='text-slate-400 hover:text-accent-400 transition-colors flex items-center group'>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className='text-white font-bold mb-6 tracking-wide'>Connect</h4>
            <p className="text-slate-400 mb-6">Join our community of cricket data enthusiasts.</p>
            <div className='flex space-x-4'>
              <motion.a whileHover={{ y: -3, scale: 1.04 }} href='#' aria-label="Community chat" className='w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-cyan-500 transition-colors border border-white/10 hover:border-transparent'>
                <MessageCircle className='w-5 h-5' />
              </motion.a>
              <motion.a whileHover={{ y: -3, scale: 1.04 }} href='#' aria-label="Send email" className='w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-fuchsia-500 transition-colors border border-white/10 hover:border-transparent'>
                <Mail className='w-5 h-5' />
              </motion.a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className='border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center'>
          <p className='text-slate-500 text-sm mb-4 md:mb-0 flex items-center'>
            © {currentYear} IPL Predictor. Built with <Heart className="w-4 h-4 mx-1.5 text-rose-500" /> by Data Nerds.
          </p>
          <div className='flex space-x-6 text-sm'>
            <a href='#' className='text-slate-500 hover:text-slate-300 transition-colors'>Privacy Policy</a>
            <a href='#' className='text-slate-500 hover:text-slate-300 transition-colors'>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
