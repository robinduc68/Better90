import { useEffect, useMemo, useState } from 'react';
import { Pressable, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { useReducedMotion } from '../../hooks';

import { makeStyles, useTheme } from '../../theme';
import { Text } from '../Text';

export interface ChartPoint {
  id: string;
  label: string;
  value: number;
}

interface LineChartProps {
  points: ChartPoint[];
  height?: number;
  formatValue: (v: number) => string;
  accessibilityLabel: string;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

const PAD_X = 8;
const PAD_Y = 14;

/**
 * Minimal line chart: muted baseline, accent line, small points.
 * Tap anywhere to inspect the nearest value.
 */
export function LineChart({ points, height = 140, formatValue, accessibilityLabel }: LineChartProps) {
  const styles = useStyles();
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const geometry = useMemo(() => {
    if (width === 0 || points.length === 0) return null;
    const values = points.map((p) => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const innerW = width - PAD_X * 2;
    const innerH = height - PAD_Y * 2;
    const xs = points.map((_, i) => PAD_X + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW));
    const ys = points.map((p) => PAD_Y + innerH - ((p.value - min) / (max - min)) * innerH);
    const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i]!.toFixed(1)}`).join(' ');
    let length = 0;
    for (let i = 1; i < xs.length; i++) length += Math.hypot(xs[i]! - xs[i - 1]!, ys[i]! - ys[i - 1]!);
    return { xs, ys, d, min, max, length: Math.max(1, length) };
  }, [points, width, height]);

  const active = selected !== null ? points[selected] : points[points.length - 1];

  // Draw the line once on first entry; later data changes update instantly.
  const reduceMotion = useReducedMotion();
  const draw = useSharedValue(reduceMotion ? 1 : 0);
  const ready = !!geometry;
  useEffect(() => {
    if (ready) draw.value = reduceMotion ? 1 : withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [ready, draw, reduceMotion]);
  const length = geometry?.length ?? 1;
  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - draw.value) }));

  const onPress = (e: GestureResponderEvent) => {
    if (!geometry) return;
    const x = e.nativeEvent.locationX;
    let best = 0;
    geometry.xs.forEach((px, i) => {
      if (Math.abs(px - x) < Math.abs(geometry.xs[best]! - x)) best = i;
    });
    setSelected(best);
  };

  return (
    <View>
      <View style={styles.readout} accessibilityLiveRegion="polite">
        {active ? (
          <>
            <Text variant="metricS">{formatValue(active.value)}</Text>
            <Text variant="caption" color="muted">
              {active.label}
            </Text>
          </>
        ) : null}
      </View>
      <Pressable
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        onPress={onPress}
        style={{ height }}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      >
        {geometry ? (
          <Svg width={width} height={height}>
            <Line x1={0} x2={width} y1={height - 1} y2={height - 1} stroke={theme.colors.border} strokeWidth={1} />
            {selected !== null ? (
              <Line x1={geometry.xs[selected]} x2={geometry.xs[selected]} y1={0} y2={height} stroke={theme.colors.borderStrong} strokeWidth={1} />
            ) : null}
            <AnimatedPath
              d={geometry.d}
              stroke={theme.scheme === 'light' ? theme.colors.accentForeground : theme.colors.accent}
              strokeWidth={2.5}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={`${geometry.length} ${geometry.length}`}
              animatedProps={lineProps}
            />
            {geometry.xs.map((x, i) => {
              const isActive = selected === i || (selected === null && i === points.length - 1);
              return (
                <Circle
                  key={points[i]!.id}
                  cx={x}
                  cy={geometry.ys[i]}
                  r={isActive ? 4.5 : 2.5}
                  fill={isActive ? theme.colors.accent : theme.colors.surface}
                  stroke={theme.scheme === 'light' ? theme.colors.accentForeground : theme.colors.accent}
                  strokeWidth={1.5}
                />
              );
            })}
          </Svg>
        ) : null}
      </Pressable>
      {geometry ? (
        <View style={styles.axis}>
          <Text variant="caption" color="muted">
            {points[0]!.label}
          </Text>
          <Text variant="caption" color="muted">
            {points[points.length - 1]!.label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  readout: { flexDirection: 'row', alignItems: 'baseline', gap: t.spacing.xs, minHeight: 24, marginBottom: t.spacing.xs },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: t.spacing.xxs },
}));
