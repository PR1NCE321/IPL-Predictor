import FantasyRecommendations from '@/components/sections/FantasyRecommendations';

export const metadata = {
  title: 'Fantasy Team Recommendations - IPL Predictor',
};

export default function FantasyPage() {
  return (
    <main className="relative min-h-screen pt-24 pb-16 overflow-hidden">
      <div className="absolute top-24 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-500/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FantasyRecommendations />
      </div>
    </main>
  );
}
