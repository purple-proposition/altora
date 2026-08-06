// Animated rotating border, used to mark a container as an AI-generated
// result (matching score cards, the copilot suggestions card, the
// personalized offer) instead of the plain violet color/sparkles icon
// alone — a moving highlight reads as "live/generated" in a way a static
// tint doesn't. Pure CSS (no framer-motion/magicui dependency): a masked
// ::before ring is rotated with a plain transform, so the technique works
// without @property support (Firefox included), unlike an animated
// conic-gradient angle.
export default function BorderBeam({
  children,
  size = 'md',
  colorVariant = 'violet',
  strength = 0.6,
  className,
}: {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'pulse-inner';
  colorVariant?: 'violet' | 'mono';
  strength?: number;
  className?: string;
}) {
  return (
    <div
      className={`border-beam border-beam--${size} border-beam--${colorVariant}${className ? ` ${className}` : ''}`}
      style={{ '--beam-strength': strength } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
