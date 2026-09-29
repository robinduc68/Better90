import { memo } from 'react';
import Svg, { Circle, G, Line, Rect } from 'react-native-svg';

import { useTheme } from '@/design-system';

import { MOVEMENTS, type MovementKey } from './movements';
import type { Equip, FrontPose, Pose, Pt, Segment, SidePose } from './rig';

interface Palette {
  body: string;
  far: string;
  primary: string;
  secondary: string;
  gear: string;
  weight: string;
}

interface MovementArtworkProps {
  movement: MovementKey;
  height: number;
  primary: Segment[];
  secondary?: Segment[];
  /** 'end' shows the finished rep with the start ghosted behind — conveys motion in one frame. */
  frame?: 'start' | 'end' | 'motion';
}

const W = { torso: 15, upperArm: 7, forearm: 6, thigh: 9.5, shin: 7.5, neck: 6 } as const;

/** Square viewBox hugging the figure + gear so small sizes stay legible. */
function fitViewBox(poses: Pose[], pad: number): string {
  const xs: number[] = [];
  const ys: number[] = [];
  const add = (p: Pt) => {
    xs.push(p[0]);
    ys.push(p[1]);
  };
  for (const pose of poses) {
    for (const v of Object.values(pose)) if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'number') add(v as unknown as Pt);
    for (const g of pose.gear) {
      if (g.kind === 'block') {
        add([g.x, g.y]);
        add([g.x + g.w, g.y + g.h]);
      } else if (g.kind === 'line' || g.kind === 'cable') {
        add(g.from);
        add(g.to);
      } else add(g.at);
    }
  }
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  const size = Math.max(maxX - minX, maxY - minY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return `${(cx - size / 2).toFixed(1)} ${(cy - size / 2).toFixed(1)} ${size.toFixed(1)} ${size.toFixed(1)}`;
}

function line(a: Pt, b: Pt, color: string, width: number, key: string, opacity = 1) {
  return <Line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={width} strokeLinecap="round" opacity={opacity} />;
}

const mid = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function renderGear(gear: Equip[], p: Palette, layer: 'back' | 'front') {
  return gear.map((g, i) => {
    const k = `${layer}-${i}`;
    const back = g.kind === 'block' || g.kind === 'line' || g.kind === 'pulley';
    if ((layer === 'back') !== back) return null;
    switch (g.kind) {
      case 'block':
        return <Rect key={k} x={g.x} y={g.y} width={g.w} height={g.h} rx={2} fill={p.gear} />;
      case 'line':
        return line(g.from, g.to, p.gear, g.w ?? 3, k);
      case 'pulley':
        return <Circle key={k} cx={g.at[0]} cy={g.at[1]} r={3.2} fill={p.weight} />;
      case 'cable':
        return line(g.from, g.to, p.weight, 1.2, k, 0.8);
      case 'bar':
        return line([g.at[0] - (g.length ?? 20) / 2, g.at[1]], [g.at[0] + (g.length ?? 20) / 2, g.at[1]], p.weight, 3, k);
      case 'plate':
        return (
          <G key={k}>
            <Circle cx={g.at[0]} cy={g.at[1]} r={g.r ?? 7} fill={p.weight} />
            <Circle cx={g.at[0]} cy={g.at[1]} r={(g.r ?? 7) * 0.32} fill={p.gear} />
          </G>
        );
      case 'dumbbell':
        return g.vertical ? (
          <G key={k}>
            <Rect x={g.at[0] - 1.2} y={g.at[1] - 6} width={2.4} height={12} fill={p.weight} />
            <Rect x={g.at[0] - 3.5} y={g.at[1] - 8} width={7} height={4} rx={1.2} fill={p.weight} />
            <Rect x={g.at[0] - 3.5} y={g.at[1] + 4} width={7} height={4} rx={1.2} fill={p.weight} />
          </G>
        ) : (
          <G key={k}>
            <Rect x={g.at[0] - 6} y={g.at[1] - 1.2} width={12} height={2.4} fill={p.weight} />
            <Rect x={g.at[0] - 8} y={g.at[1] - 3.5} width={4} height={7} rx={1.2} fill={p.weight} />
            <Rect x={g.at[0] + 4} y={g.at[1] - 3.5} width={4} height={7} rx={1.2} fill={p.weight} />
          </G>
        );
    }
  });
}

function segColor(seg: Segment, p: Palette, primary: Set<Segment>, secondary: Set<Segment>, fallback: string) {
  if (primary.has(seg)) return p.primary;
  if (secondary.has(seg)) return p.secondary;
  return fallback;
}

function SideFigure({ pose, p, primary, secondary, ghost }: { pose: SidePose; p: Palette; primary: Set<Segment>; secondary: Set<Segment>; ghost?: boolean }) {
  const body = ghost ? p.far : p.body;
  const c = (s: Segment, f = body) => (ghost ? p.far : segColor(s, p, primary, secondary, f));
  const farElbow = pose.farElbow ?? ([pose.elbow[0] - 3, pose.elbow[1] - 1] as Pt);
  const farHand = pose.farHand ?? ([pose.hand[0] - 3, pose.hand[1] - 1] as Pt);
  const farKnee = pose.farKnee ?? ([pose.knee[0] - 3, pose.knee[1]] as Pt);
  const farFoot = pose.farFoot ?? ([pose.foot[0] - 3, pose.foot[1]] as Pt);
  const toe = (f: Pt): Pt => [f[0] + 6, f[1] + 1];
  const chestA = mid(pose.neck, pose.hip, 0.12);
  const chestB = mid(pose.neck, pose.hip, 0.42);
  const absA = mid(pose.neck, pose.hip, 0.5);
  const absB = mid(pose.neck, pose.hip, 0.85);
  const o = ghost ? 1 : 0.55;
  return (
    <G>
      {/* far limbs */}
      {line(pose.hip, farKnee, ghost ? p.far : c('thigh', p.far), W.thigh, 'fth', o)}
      {line(farKnee, farFoot, ghost ? p.far : c('shin', p.far), W.shin, 'fsh', o)}
      {line(farFoot, toe(farFoot), p.far, 4, 'fft', o)}
      {line(pose.shoulder, farElbow, ghost ? p.far : c('upperArm', p.far), W.upperArm, 'fua', o)}
      {line(farElbow, farHand, p.far, W.forearm, 'ffa', o)}
      {/* torso */}
      {line(pose.neck, pose.hip, c('torso'), W.torso, 'tor')}
      {!ghost && primary.has('chest') ? line(chestA, chestB, p.primary, W.torso - 3, 'chest') : null}
      {!ghost && !primary.has('chest') && secondary.has('chest') ? line(chestA, chestB, p.secondary, W.torso - 3, 'chest2') : null}
      {!ghost && (primary.has('abs') || secondary.has('abs')) ? line(absA, absB, primary.has('abs') ? p.primary : p.secondary, W.torso - 5, 'abs') : null}
      <Circle cx={pose.hip[0]} cy={pose.hip[1]} r={7.5} fill={c('hip')} />
      {line(pose.neck, pose.head, body, W.neck, 'neck')}
      <Circle cx={pose.head[0]} cy={pose.head[1]} r={7} fill={body} />
      {/* near leg */}
      {line(pose.hip, pose.knee, c('thigh'), W.thigh, 'th')}
      {line(pose.knee, pose.foot, c('shin'), W.shin, 'sh')}
      {line(pose.foot, toe(pose.foot), body, 4.5, 'ft')}
      {/* near arm */}
      {line(pose.shoulder, pose.elbow, c('upperArm'), W.upperArm, 'ua')}
      {line(pose.elbow, pose.hand, c('forearm'), W.forearm, 'fa')}
      <Circle cx={pose.shoulder[0]} cy={pose.shoulder[1]} r={5.6} fill={c('shoulder')} />
    </G>
  );
}

function FrontFigure({ pose, p, primary, secondary, ghost }: { pose: FrontPose; p: Palette; primary: Set<Segment>; secondary: Set<Segment>; ghost?: boolean }) {
  const body = ghost ? p.far : p.body;
  const c = (s: Segment) => (ghost ? p.far : segColor(s, p, primary, secondary, body));
  const toe = (f: Pt, dir: number): Pt => [f[0] + dir * 3, f[1] + 1];
  const midShoulder = mid(pose.shoulderL, pose.shoulderR, 0.5);
  const midHip = mid(pose.hipL, pose.hipR, 0.5);
  return (
    <G>
      {line(pose.hipL, pose.kneeL, c('thigh'), W.thigh, 'tl')}
      {line(pose.kneeL, pose.footL, c('shin'), W.shin, 'sl')}
      {line(pose.footL, toe(pose.footL, -1), body, 4.5, 'fl')}
      {line(pose.hipR, pose.kneeR, c('thigh'), W.thigh, 'tr')}
      {line(pose.kneeR, pose.footR, c('shin'), W.shin, 'sr')}
      {line(pose.footR, toe(pose.footR, 1), body, 4.5, 'fr')}
      {/* torso as a tapered block */}
      {line([midShoulder[0], midShoulder[1] + 4], [midHip[0], midHip[1] - 3], c('torso'), 22, 'tor')}
      {!ghost && (primary.has('chest') || secondary.has('chest')) ? line([midShoulder[0], midShoulder[1] + 5], [midShoulder[0], midShoulder[1] + 13], primary.has('chest') ? p.primary : p.secondary, 20, 'chest') : null}
      {!ghost && (primary.has('abs') || secondary.has('abs')) ? line([midHip[0], midHip[1] - 22], [midHip[0], midHip[1] - 6], primary.has('abs') ? p.primary : p.secondary, 10, 'abs') : null}
      {line(pose.hipL, pose.hipR, c('hip'), 11, 'hips')}
      {line(pose.neck, pose.head, body, W.neck, 'neck')}
      <Circle cx={pose.head[0]} cy={pose.head[1]} r={7} fill={body} />
      {line(pose.shoulderL, pose.elbowL, c('upperArm'), W.upperArm, 'ual')}
      {line(pose.elbowL, pose.handL, c('forearm'), W.forearm, 'fal')}
      {line(pose.shoulderR, pose.elbowR, c('upperArm'), W.upperArm, 'uar')}
      {line(pose.elbowR, pose.handR, c('forearm'), W.forearm, 'far')}
      <Circle cx={pose.shoulderL[0]} cy={pose.shoulderL[1]} r={5.6} fill={c('shoulder')} />
      <Circle cx={pose.shoulderR[0]} cy={pose.shoulderR[1]} r={5.6} fill={c('shoulder')} />
    </G>
  );
}

function Figure(props: { pose: Pose; p: Palette; primary: Set<Segment>; secondary: Set<Segment>; ghost?: boolean }) {
  return props.pose.view === 'side' ? <SideFigure {...props} pose={props.pose} /> : <FrontFigure {...props} pose={props.pose} />;
}

/**
 * A person performing the exercise, target muscles in lime.
 * TODO: Replace with final Level90 exercise artwork.
 */
export const MovementArtwork = memo(function MovementArtwork({ movement, height, primary, secondary = [], frame = 'motion' }: MovementArtworkProps) {
  const { colors, scheme } = useTheme();
  const m = MOVEMENTS[movement];
  const p: Palette =
    scheme === 'dark'
      ? { body: '#D9DEE5', far: 'rgba(217,222,229,0.28)', primary: colors.accent, secondary: 'rgba(183,243,74,0.55)', gear: 'rgba(255,255,255,0.16)', weight: 'rgba(255,255,255,0.45)' }
      : { body: '#2A2F36', far: 'rgba(42,47,54,0.16)', primary: '#9BD62E', secondary: '#CDEB8F', gear: '#D5D9DF', weight: '#8A919B' };
  const pri = new Set(primary);
  const sec = new Set(secondary);
  const shown = frame === 'start' ? m.start : m.end;
  // Same box for both frames so start/finish line up; tighter padding when small.
  const viewBox = fitViewBox([m.start, m.end], height < 80 ? 6 : 12);
  return (
    <Svg width={height} height={height} viewBox={viewBox}>
      {renderGear(shown.gear, p, 'back')}
      {frame === 'motion' ? <Figure pose={m.start} p={p} primary={pri} secondary={sec} ghost /> : null}
      <Figure pose={shown} p={p} primary={pri} secondary={sec} />
      {renderGear(shown.gear, p, 'front')}
    </Svg>
  );
});
