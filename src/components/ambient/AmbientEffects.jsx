import { useEffect, useRef } from 'react';

/**
 * Ambient background orbs — pure CSS animated, zero canvas overhead
 */
export function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      <div
        className="ambient-glow bg-purple-300/35"
        style={{ top: '-80px', left: '-120px', width: '520px', height: '520px' }}
      />
      <div
        className="ambient-glow bg-violet-300/30"
        style={{ top: '35%', right: '-130px', width: '480px', height: '480px', animationDelay: '2.5s' }}
      />
      <div
        className="ambient-glow bg-fuchsia-300/20"
        style={{ bottom: '15%', left: '-80px', width: '400px', height: '400px', animationDelay: '4.5s' }}
      />
      <div
        className="ambient-glow bg-indigo-300/20"
        style={{ bottom: '-60px', right: '-60px', width: '360px', height: '360px', animationDelay: '1.5s' }}
      />
    </div>
  );
}

/**
 * Ambient cursor spotlight that follows the mouse
 */
export function CursorSpotlight() {
  return null;
}

/**
 * Scroll progress bar at the top of the page
 */
export function ScrollProgressBar() {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    function update() {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = height > 0 ? `${(winScroll / height) * 100}%` : '0%';
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  return <div ref={barRef} id="scroll-progress-bar" />;
}

/**
 * Count-up animation hook
 */
export function useCountUp(target, duration = 1600, decimals = 0) {
  const ref = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      ([entry], obs) => {
        if (!entry.isIntersecting) return;
        obs.unobserve(el);
        const startTime = performance.now();
        function tick(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          const val = ease * target;
          el.textContent = decimals > 0
            ? val.toFixed(decimals)
            : Math.floor(val).toLocaleString('id-ID');
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = decimals > 0 ? target.toFixed(decimals) : target.toLocaleString('id-ID');
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.2 }
    );
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [target, duration, decimals]);

  return ref;
}
