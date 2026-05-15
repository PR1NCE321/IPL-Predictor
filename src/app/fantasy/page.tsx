import InteractiveFantasyBuilder from '@/components/sections/InteractiveFantasyBuilder';

export const metadata = {
  title: 'Fantasy Team Recommendations - IPL Predictor',
};

export default function FantasyPage() {
  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className='mb-8'>
          <p className='section-label mb-2'>IPL 2026</p>
          <h1 className='text-4xl font-bold tracking-tight' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>
            FANTASY PICKS
          </h1>
          <p style={{ color: '#8890A0', marginTop: 8, fontSize: 14 }}>Build, optimize, and share your perfect fantasy team.</p>
        </div>
        <InteractiveFantasyBuilder />
      </div>
    </main>
  );
}
