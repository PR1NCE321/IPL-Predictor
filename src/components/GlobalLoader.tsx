export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0D0F14]/80 backdrop-blur-sm">
      <div className="relative flex flex-col items-center gap-6">
        {/* Glowing backdrop effect behind logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#D4AF37]/20 rounded-full blur-2xl animate-pulse" />
        
        {/* IPL Logo with breathing animation */}
        <div className="relative z-10 w-24 h-24 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
          <img 
            src="/logos/app-logo.png" 
            alt="IPL Predictor" 
            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]"
          />
        </div>

        {/* Fancy loading text/bar */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-[#D4AF37] font-black tracking-[0.2em] text-xs uppercase animate-pulse" style={{ fontFamily: 'var(--font-barlow)' }}>
            Loading System
          </span>
          <div className="w-32 h-1 bg-[#1A1D26] rounded-full overflow-hidden border border-[#1E2028]">
            <div className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-300 w-1/2 rounded-full animate-[spin_2s_linear_infinite]" style={{ animation: 'loadingBar 1.5s ease-in-out infinite alternate' }} />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes loadingBar {
            0% { transform: translateX(-100%); width: 50%; }
            100% { transform: translateX(200%); width: 50%; }
          }
        `
      }} />
    </div>
  );
}
