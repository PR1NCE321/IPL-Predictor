import HeadToHeadComparison from '@/components/sections/HeadToHeadComparison';

export const metadata = {
  title: 'Head-to-Head Comparison - IPL Predictor',
};

export default function HeadToHeadPage() {
  return (
    <main className="relative min-h-screen pt-24 pb-16 overflow-hidden">
      <div className="absolute top-24 left-0 w-[500px] h-[500px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeadToHeadComparison />
      </div>
    </main>
  );
}
