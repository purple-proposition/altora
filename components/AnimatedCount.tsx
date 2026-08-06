'use client';

import { useRef } from 'react';

// A small odometer-style digit swap: the new number slides in from the
// bottom when the count increases, from the top when it decreases (the
// standard convention for counters). Deliberately simple — a `key`-driven
// remount plus a plain CSS animation on the incoming digit, no imperative
// rAF/timeout choreography. An earlier version drove this by hand
// (measuring rects, toggling inline styles across two nested rAFs) and
// under rapid successive value changes — exactly what happens here, since
// every kanban beat can touch a column's count — it could end up leaving
// a digit permanently invisible. A CSS animation triggered by React's own
// key-based remount can't get stuck like that: each mount runs its
// animation independently and there's no shared imperative state to race.
export default function AnimatedCount({ value, className }: { value: number; className?: string }) {
  const prevValueRef = useRef(value);
  const dir = value > prevValueRef.current ? 'up' : value < prevValueRef.current ? 'down' : null;
  prevValueRef.current = value;

  return (
    <span className={`animated-count${className ? ` ${className}` : ''}`}>
      <span key={value} className={`animated-count-digit${dir ? ` animated-count-in-${dir}` : ''}`}>
        {value}
      </span>
    </span>
  );
}
