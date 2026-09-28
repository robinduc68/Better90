import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { makeStyles, Text } from '@/design-system';
import type { ProgressPhoto } from '@/domain';

import { PrivatePhoto } from './PrivatePhoto';

/** Before/after slider: drag the divider to reveal the later photo. */
export function CompareSlider({ before, after }: { before: ProgressPhoto; after: ProgressPhoto }) {
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const split = useSharedValue(0.5);
  const start = useSharedValue(0.5);

  const pan = Gesture.Pan()
    .onBegin(() => {
      start.value = split.value;
    })
    .onUpdate((e) => {
      if (width === 0) return;
      split.value = Math.min(0.98, Math.max(0.02, start.value + e.translationX / width));
    });

  const tap = Gesture.Tap().onEnd((e) => {
    if (width === 0) return;
    split.value = Math.min(0.98, Math.max(0.02, e.x / width));
  });

  const clipStyle = useAnimatedStyle(() => ({ width: `${split.value * 100}%` }));
  const handleStyle = useAnimatedStyle(() => ({ left: `${split.value * 100}%` }));

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View
        style={styles.frame}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`Comparison slider, day ${before.dayNumber} and day ${after.dayNumber}`}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          split.value = Math.min(0.98, Math.max(0.02, split.value + (e.nativeEvent.actionName === 'increment' ? 0.1 : -0.1)));
        }}
      >
        <PrivatePhoto photo={after} style={styles.fill} />
        <Animated.View style={[styles.clip, clipStyle]}>
          <View style={{ width: width || '100%', height: '100%' }}>
            <PrivatePhoto photo={before} style={styles.fill} />
          </View>
        </Animated.View>
        <Animated.View style={[styles.handle, handleStyle]} pointerEvents="none">
          <View style={styles.line} />
          <View style={styles.knob} />
        </Animated.View>
        <View style={[styles.tag, styles.tagLeft]} pointerEvents="none">
          <Text variant="label">Day {before.dayNumber}</Text>
        </View>
        <View style={[styles.tag, styles.tagRight]} pointerEvents="none">
          <Text variant="label">Day {after.dayNumber}</Text>
        </View>
      </View>
    </GestureDetector>
  );
}

const useStyles = makeStyles((t) => ({
  frame: { width: '100%', aspectRatio: 3 / 4, borderRadius: t.radius.card, overflow: 'hidden', backgroundColor: t.colors.surfaceSecondary },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  clip: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden' },
  handle: { position: 'absolute', top: 0, bottom: 0, width: 0, alignItems: 'center', justifyContent: 'center' },
  line: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: t.colors.accent },
  knob: { width: 28, height: 28, borderRadius: 14, backgroundColor: t.colors.accent, marginLeft: 0 },
  tag: { position: 'absolute', bottom: t.spacing.sm, paddingHorizontal: t.spacing.xs, paddingVertical: 3, borderRadius: t.radius.sm, backgroundColor: t.colors.overlay },
  tagLeft: { left: t.spacing.sm },
  tagRight: { right: t.spacing.sm },
}));
