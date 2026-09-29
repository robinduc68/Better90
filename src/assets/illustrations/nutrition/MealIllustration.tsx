import { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { food as c } from '../palette';

export type MealArt = 'bowl' | 'breakfast' | 'salmon' | 'snack';

/**
 * Top-down meal illustrations of real food — no supplements.
 * TODO: Replace with final Level90 artwork.
 */
export const MealIllustration = memo(function MealIllustration({ variant, size }: { variant: MealArt; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle cx={60} cy={62} r={56} fill="rgba(16,20,24,0.06)" />
      <Circle cx={60} cy={60} r={56} fill={c.plate} stroke={c.plateRim} strokeWidth={1.5} />
      {variant === 'bowl' ? <Bowl /> : variant === 'breakfast' ? <Oats /> : variant === 'salmon' ? <Salmon /> : <Yogurt />}
    </Svg>
  );
});

function Bowl() {
  return (
    <G>
      <Circle cx={60} cy={60} r={46} fill={c.bowlInside} />
      {/* rice */}
      <Path d="M22 66 C20 44 38 30 58 32 C62 46 58 70 40 88 C30 84 23 76 22 66 Z" fill={c.rice} />
      {[[34, 50], [40, 60], [30, 64], [46, 44], [36, 74], [48, 54], [44, 70]].map(([x, y], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={2.4} ry={1.2} fill={c.riceGrain} transform={`rotate(${i * 37} ${x} ${y})`} />
      ))}
      {/* chicken slices */}
      {[0, 1, 2, 3].map((i) => (
        <G key={i} transform={`rotate(${-18 + i * 4} 78 ${40 + i * 11})`}>
          <Rect x={62} y={34 + i * 11} width={28} height={9} rx={4} fill={c.chicken} />
          <Rect x={66} y={37 + i * 11} width={20} height={1.6} rx={0.8} fill={c.chickenSear} />
        </G>
      ))}
      {/* broccoli */}
      {[[52, 84], [62, 90], [70, 82]].map(([x, y], i) => (
        <G key={i}>
          <Rect x={x! - 1.5} y={y! + 2} width={3} height={7} rx={1.5} fill={c.stem} />
          <Circle cx={x! - 4} cy={y} r={5} fill={c.broccoli} />
          <Circle cx={x! + 4} cy={y} r={5} fill={c.broccoli} />
          <Circle cx={x} cy={y! - 4} r={5.5} fill={c.broccoliLight} />
        </G>
      ))}
      {/* tomatoes */}
      <Circle cx={86} cy={80} r={6} fill={c.tomato} />
      <Circle cx={84.5} cy={78.5} r={2} fill={c.tomatoLight} />
      <Circle cx={92} cy={70} r={5} fill={c.tomato} />
      {/* leaves */}
      <Path d="M44 24 C50 20 56 22 58 28 C52 30 47 29 44 24 Z" fill={c.leaf} />
    </G>
  );
}

function Oats() {
  return (
    <G>
      <Circle cx={60} cy={60} r={46} fill={c.oats} />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const r = 18 + (i % 3) * 9;
        return <Ellipse key={i} cx={60 + Math.cos(a) * r} cy={60 + Math.sin(a) * r} rx={3} ry={1.6} fill={c.oatDot} transform={`rotate(${i * 23} ${60 + Math.cos(a) * r} ${60 + Math.sin(a) * r})`} />;
      })}
      {/* banana slices */}
      {[[40, 44], [50, 38], [36, 56]].map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={7} fill={c.banana} stroke={c.bananaCore} strokeWidth={1} />
          <Circle cx={x} cy={y} r={1.6} fill={c.bananaCore} />
        </G>
      ))}
      {/* blueberries */}
      {[[70, 50], [78, 58], [72, 64], [82, 46], [64, 72]].map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={4.6} fill={c.blueberry} />
          <Circle cx={x! - 1.4} cy={y! - 1.4} r={1.2} fill={c.berryShine} />
        </G>
      ))}
      {/* raspberries */}
      {[[56, 80], [46, 74], [80, 76]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={5.5} fill={c.raspberry} />
      ))}
      {/* seeds */}
      {[[60, 56], [58, 62], [64, 60], [54, 58]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={1.2} fill={c.seed} />
      ))}
    </G>
  );
}

function Salmon() {
  return (
    <G>
      {/* salmon fillet */}
      <Path d="M30 50 C34 36 62 30 82 38 C90 42 90 56 80 62 C62 70 38 70 30 60 Z" fill={c.salmon} />
      {[0, 1, 2, 3].map((i) => (
        <Path key={i} d={`M${42 + i * 10} 40 C${46 + i * 10} 48 ${44 + i * 10} 58 ${40 + i * 10} 66`} stroke={c.salmonLine} strokeWidth={2} fill="none" strokeLinecap="round" />
      ))}
      {/* asparagus */}
      {[0, 1, 2, 3].map((i) => (
        <G key={i} transform={`rotate(-12 60 84)`}>
          <Rect x={30} y={76 + i * 5} width={46} height={3.4} rx={1.7} fill={c.asparagus} />
          <Ellipse cx={77} cy={77.7 + i * 5} rx={4} ry={2.4} fill={c.broccoliLight} />
        </G>
      ))}
      {/* lemon wedge */}
      <Path d="M82 70 A14 14 0 0 1 96 84 L82 84 Z" fill={c.lemon} />
      {/* greens */}
      <Path d="M86 30 C94 28 100 34 98 42 C90 42 86 38 86 30 Z" fill={c.leaf} />
      <Path d="M92 44 C100 46 102 54 96 58 C90 54 89 50 92 44 Z" fill={c.broccoliLight} />
    </G>
  );
}

function Yogurt() {
  return (
    <G>
      <Circle cx={60} cy={60} r={46} fill={c.yogurt} stroke={c.plateRim} strokeWidth={1} />
      {/* granola */}
      {[[40, 42], [48, 36], [36, 52], [44, 50], [52, 44], [30, 60]].map(([x, y], i) => (
        <Rect key={i} x={x} y={y} width={8} height={6} rx={2.5} fill={i % 2 ? c.granola : c.granolaDark} transform={`rotate(${i * 29} ${x! + 4} ${y! + 3})`} />
      ))}
      {/* strawberries */}
      {[[74, 44], [84, 56], [70, 58]].map(([x, y], i) => (
        <G key={i}>
          <Path d={`M${x! - 7} ${y! - 3} Q${x} ${y! - 9} ${x! + 7} ${y! - 3} Q${x! + 5} ${y! + 8} ${x} ${y! + 9} Q${x! - 5} ${y! + 8} ${x! - 7} ${y! - 3} Z`} fill={c.raspberry} />
          <Circle cx={x! - 2} cy={y} r={0.9} fill={c.seed} />
          <Circle cx={x! + 2} cy={y! + 3} r={0.9} fill={c.seed} />
        </G>
      ))}
      {/* blueberries */}
      {[[56, 76], [64, 82], [48, 80], [74, 74]].map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={4.4} fill={c.blueberry} />
          <Circle cx={x! - 1.3} cy={y! - 1.3} r={1.1} fill={c.berryShine} />
        </G>
      ))}
      {/* nuts */}
      <Ellipse cx={40} cy={74} rx={5} ry={3.4} fill={c.granolaDark} transform="rotate(30 40 74)" />
      <Ellipse cx={34} cy={68} rx={4.6} ry={3} fill={c.granola} transform="rotate(-20 34 68)" />
    </G>
  );
}
