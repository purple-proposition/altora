import type { CSSProperties } from 'react';

// The Altora wordmark as an inline SVG (not a plain styled <span>), set in
// the Gloock display font — used everywhere the wordmark appears (landing
// nav, login, signup) so it's the same asset in every place instead of
// each page re-styling its own text. `fill="currentColor"` so it follows
// whatever text color the surrounding page already uses.
export default function AltoraLogo({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 104 28"
      width="104"
      height="28"
      role="img"
      aria-label="Altora"
      className={className}
      style={{ overflow: 'visible', ...style }}
    >
      <text x="0" y="21" fontFamily="Gloock, Georgia, serif" fontSize="24" letterSpacing="-4" fill="currentColor">
        Altora
      </text>
    </svg>
  );
}
