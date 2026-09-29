import { memo } from 'react';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { useTheme } from '../../theme';
import type { Tone } from '../../tokens';

interface MiniSparklineProps {
  values: number[];
  width?: number;
  height?: number;
  tone?: Tone;
}

/** Tiny trend line — a polyline, no chart library. */
export const MiniSparkline = memo(function MiniSparkline({ values, width = 72, height = 28, tone = 'brand' }: MiniSparklineProps) {
  const { colors, scheme } = useTheme();
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 3;
  const pts = values.map((v, i) => [pad + (i / (values.length - 1)) * (width - pad * 2), pad + (1 - (v - min) / span) * (height - pad * 2)] as const);
  const stroke = tone === 'brand' && scheme === 'light' ? colors.accentForeground : colors.tones[tone].fg;
  const last = pts[pts.length - 1]!;
  return (
    <Svg width={width} height={height}>
      <Polyline points={pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={last[0]} cy={last[1]} r={3} fill={stroke} />
    </Svg>
  );
});
