import { useEffect, useRef, useState } from 'react';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Smoothly animates a number from its previous value to the new `value`.
 * Renders plain text (with optional format/prefix/suffix) so it can drop
 * into any existing element (e.g. a `.display-5` stat number).
 */
export default function CountUp({
  value = 0,
  duration = 1100,
  decimals = 0,
  prefix = '',
  suffix = '',
  format,
  className = '',
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const target = Number(value) || 0;
    const from = fromRef.current;

    if (prefersReducedMotion() || duration <= 0) {
      fromRef.current = target;
      setDisplay(target);
      return undefined;
    }

    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setDisplay(from + (target - from) * easeOutCubic(p));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  const text = format
    ? format(Number(display))
    : `${prefix}${Number(display).toFixed(decimals)}${suffix}`;

  return <span className={className}>{text}</span>;
}
