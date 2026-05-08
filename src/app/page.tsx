'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, Trophy, Crosshair, Zap, ChevronRight, BarChart3, Users, Star, Shield, Sparkles, Flame, Orbit } from 'lucide-react';

export default function HomePage() {
  const sections = [
    {
      title: 'Analytics Dashboard',
      description: 'Real-time playoff probabilities, elegant match intelligence, and advanced simulation insights.',
      link: '/analytics',
      color: 'from-cyan-400 via-blue-500 to-violet-500',
      icon: <BarChart3 className="w-8 h-8 text-white" />,
      delay: 0.1
    },
    {
      title: 'Teams Analysis',
      description: 'Deep dive into every franchise with sharp metrics, momentum, and playoff scenarios.',
      link: '/teams',
      color: 'from-fuchsia-500 via-pink-500 to-rose-500',
      icon: <Users className="w-8 h-8 text-white" />,
      delay: 0.2
    },
    {
      title: 'Head-to-Head',
      description: 'Compare any two teams with history, form, and current table context.',
      link: '/head-to-head',
      color: 'from-emerald-400 via-cyan-400 to-sky-500',
      icon: <Shield className="w-8 h-8 text-white" />,
      delay: 0.25
    },
    {
      title: 'Fantasy Picks',
      description: 'Generate a smart fantasy XI with captain and vice-captain recommendations.',
      link: '/fantasy',
      color: 'from-amber-400 via-fuchsia-500 to-purple-500',
      icon: <Sparkles className="w-8 h-8 text-white" />,
      delay: 0.28
    },
    {
      title: 'Match Simulator',
      description: 'Test match outcomes and instantly visualize playoff swings with smarter simulation.',
      link: '/simulator',
      color: 'from-sky-400 via-cyan-400 to-teal-500',
      icon: <Crosshair className="w-8 h-8 text-white" />,
      delay: 0.3
    },
    {
      title: 'Live Action Hub',
      description: 'Track fixtures, review completed matches, and explore the tournament schedule.',
      link: '/matches',
      color: 'from-rose-500 via-orange-500 to-amber-500',
      icon: <Activity className="w-8 h-8 text-white" />,
      delay: 0.4
    },
  ];

  const stats = [
    { label: 'Total Matches', value: '74', icon: <Flame className="w-5 h-5 text-cyan-300" /> },
    { label: 'Franchises', value: '10', icon: <Star className="w-5 h-5 text-fuchsia-300" /> },
    { label: 'Playoff Berths', value: '4', icon: <Zap className="w-5 h-5 text-amber-300" /> },
    { label: 'Simulations Run', value: '10K+', icon: <Orbit className="w-5 h-5 text-violet-300" /> },
  ];

  return (
    <div className='relative min-h-screen overflow-hidden'>
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 via-fuchsia-400/10 to-transparent blur-[110px] rounded-full mix-blend-screen"></div>
      </div>
      <div className="absolute top-32 -left-40 w-96 h-96 bg-cyan-400/10 blur-[120px] rounded-full pointer-events-none animate-float-slow"></div>
      <div className="absolute bottom-24 -right-40 w-96 h-96 bg-fuchsia-500/10 blur-[120px] rounded-full pointer-events-none animate-float"></div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20'>
        {/* Hero Section */}
        <div className='text-center mb-24 hero-glow'>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className='inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-card panel-sheen mb-8'
          >
            <span className="flex h-2 w-2 rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400 animate-pulse"></span>
            <span className='text-slate-300 text-sm font-semibold tracking-wide uppercase'>
              Live IPL 2026 Analytics
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className='text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight'
          >
            The Ultimate <br className="hidden md:block" />
            <span className='text-gradient-electric bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]'>
              Playoff Predictor
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className='text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10'
          >
            Harness the power of advanced Monte Carlo simulations to calculate real-time qualification probabilities and explore "what-if" scenarios for every team.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
          >
            <Link href="/simulator">
              <button className="px-8 py-4 vibrant-button flex items-center shadow-neon-accent">
                Start Simulating
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </Link>
            <Link href="/analytics">
              <button className="px-8 py-4 glass-card text-white font-bold rounded-full hover:border-cyan-400/30 transition-all flex items-center">
                View Analytics
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Dynamic Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="elevated-card panel-sheen rounded-3xl p-6 flex flex-col items-center justify-center text-center group"
            >
              <div className="p-3 bg-white/5 rounded-2xl mb-4 group-hover:scale-110 transition-transform neon-ring">
                {stat.icon}
              </div>
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-300 font-medium uppercase tracking-[0.2em]">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Feature Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: section.delay }}
              whileHover={{ y: -8 }}
              className="group h-full"
            >
              <Link href={section.link} className="block h-full">
                <div className="elevated-card panel-sheen rounded-[2rem] p-8 h-full relative overflow-hidden flex flex-col justify-between">
                  {/* Glowing gradient blob behind the card content */}
                  <div className={`absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br ${section.color} rounded-full blur-[90px] opacity-20 group-hover:opacity-45 transition-opacity duration-500`}></div>
                  
                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${section.color} flex items-center justify-center mb-6 shadow-lg transform group-hover:rotate-6 transition-transform duration-300 neon-ring`}>
                      {section.icon}
                    </div>
                    <h2 className='text-3xl font-bold text-white mb-4 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-colors'>
                      {section.title}
                    </h2>
                    <p className='text-slate-400 leading-relaxed text-lg'>
                      {section.description}
                    </p>
                  </div>

                  <div className="relative z-10 mt-8 flex items-center text-cyan-300 font-bold group-hover:text-fuchsia-300 transition-colors">
                    Explore Feature 
                    <motion.div
                      className="ml-2"
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </motion.div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
