'use client';
import { useState, useEffect, useRef } from 'react';

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function useCountUp(target: number, duration: number = 800, decimals: number = 0) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(target);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const from = prevTarget.current !== target ? prevTarget.current : 0;
    prevTarget.current = target;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = from + (target - from) * easedProgress;
      setValue(parseFloat(current.toFixed(decimals)));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };

    rafId.current = requestAnimationFrame(animate);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [target, duration, decimals]);

  return value;
}
