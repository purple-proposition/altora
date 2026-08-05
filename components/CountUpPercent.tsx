'use client';

import { useEffect, useRef, useState } from 'react';

const CONFETTI_COLORS = ['var(--green)', 'var(--amber)', 'var(--violet)', 'var(--rose)', 'var(--cyan)'];
const CONFETTI_COUNT = 24;

// Each piece gets randomized end position/rotation/color/delay once (not
// re-rolled on every render) via a lazy useState initializer.
function useConfettiPieces() {
  const [pieces] = useState(() =>
    Array.from({ length: CONFETTI_COUNT }, () => ({
      tx: `${Math.round((Math.random() - 0.5) * 260)}px`,
      ty: `${Math.round(60 + Math.random() * 120)}px`,
      rot: `${Math.round(180 + Math.random() * 540)}deg`,
      delay: `${Math.round(Math.random() * 150)}ms`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      left: `${Math.round(10 + Math.random() * 80)}%`,
    })),
  );
  return pieces;
}

function Confetti() {
  const pieces = useConfettiPieces();
  return (
    <div className="landing-match-confetti" aria-hidden="true">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="landing-match-confetti-piece"
          style={{
            left: piece.left,
            background: piece.color,
            animationDelay: piece.delay,
            // Custom properties read by the confetti-burst keyframes in
            // tracker.css, one keyframe definition, randomized per piece.
            ['--tx' as string]: piece.tx,
            ['--ty' as string]: piece.ty,
            ['--rot' as string]: piece.rot,
          }}
        />
      ))}
    </div>
  );
}

// Counts up from 0 to `value` once the score card scrolls into view,
// one-shot, like Reveal (components/Reveal.tsx), rather than the
// scroll-position-tracked odometer roll used elsewhere on the landing
// page (RollingNumber), since there's no "before/after" state to roll
// between here, just a single number worth making an entrance. 1300ms:
// long enough to read as a count-up rather than an instant jump, short
// enough that the confetti payoff at the end doesn't feel delayed.
export default function CountUpPercent({ value, duration = 1300 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          setDisplay(Math.round(easeOutQuint(progress) * value));
          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            setShowConfetti(true);
          }
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  // Same thresholds as the real ATS score card (GenerateForm.tsx's
  // scoreTone: >=80 good, >=60 mid, else low).
  const tone = value >= 80 ? 'good' : value >= 60 ? 'mid' : 'low';

  return (
    <>
      <div className={`landing-match-score landing-match-score--${tone}`} ref={ref}>{display}%</div>
      {showConfetti && <Confetti />}
    </>
  );
}
