import { useEffect, useRef, useState } from 'react';

import { useReducedMotion } from '../../hooks';
import { Text, type TextProps } from '../Text';

interface AnimatedNumberProps extends Omit<TextProps, 'children'> {
  value: number;
  format: (v: number) => string;
  durationMs?: number;
}

/**
 * Tweens between numeric values (1.50 → 1.75 L) with an ease-out curve.
 * Cheap JS tween — used for a handful of hero metrics only.
 */
export function AnimatedNumber({ value, format, durationMs = 350, ...text }: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (reduceMotion || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / durationMs);
      const eased = 1 - (1 - p) ** 3;
      setShown(start + (value - start) * eased);
      if (p < 1) frame.current = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      from.current = value;
    };
  }, [value, durationMs, reduceMotion]);

  return (
    <Text tabular accessibilityLabel={format(value)} {...text}>
      {format(shown)}
    </Text>
  );
}
