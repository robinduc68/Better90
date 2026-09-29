import { memo, useMemo } from 'react';
import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/design-system';
import type { MuscleGroup } from '@/domain';

import { GROUP_REGIONS, REGIONS, sidesFor, type RegionId, type Shape, type Side } from './muscleRegions';

interface MuscleGroupArtworkProps {
  primary: MuscleGroup[];
  secondary?: MuscleGroup[];
  /** 'auto' shows the side(s) with highlights; thumbnails usually want one. */
  view?: 'auto' | 'front' | 'back' | 'both';
  maxSides?: 1 | 2;
  height: number;
}

const ORDER: RegionId[] = ['torso', 'pelvis', 'neck', 'head', 'thigh', 'shin', 'foot', 'forearm', 'hand', 'upperArm', 'delts', 'upperBack', 'lats', 'lowerBack', 'glutes', 'chest', 'abs'];
const SKIN: ReadonlySet<RegionId> = new Set(['torso', 'pelvis', 'neck', 'head', 'hand', 'foot', 'forearm']);
const MIRROR = 'matrix(-1 0 0 1 60 0)';

function shapeEl(s: Shape, fill: string, key: string, transform?: string) {
  switch (s.kind) {
    case 'path':
      return <Path key={key} d={s.d} fill={fill} transform={transform} />;
    case 'ellipse':
      return <Ellipse key={key} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={fill} transform={transform} />;
    case 'rect': {
      const rot = s.rotate ? `rotate(${s.rotate} ${s.x + s.w / 2} ${s.y + s.h / 2})` : undefined;
      return <Rect key={key} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} fill={fill} transform={[transform, rot].filter(Boolean).join(' ') || undefined} />;
    }
  }
}

/**
 * Stylized body with target muscles highlighted (primary = lime,
 * secondary = soft lime). Navigational fitness visual, not anatomy.
 */
export const MuscleGroupArtwork = memo(function MuscleGroupArtwork({ primary, secondary = [], view = 'auto', maxSides = 2, height }: MuscleGroupArtworkProps) {
  const { colors, scheme } = useTheme();
  const sides: Side[] = useMemo(() => {
    if (view === 'front' || view === 'back') return [view];
    if (view === 'both') return ['front', 'back'];
    const s = sidesFor(primary.length ? primary : secondary);
    return (s.length ? s : ['front']).slice(0, maxSides) as Side[];
  }, [view, primary, secondary, maxSides]);

  const lit = (side: Side, groups: MuscleGroup[]) => new Set(groups.flatMap((g) => GROUP_REGIONS[g][side] ?? []));
  const skin = scheme === 'dark' ? 'rgba(255,255,255,0.10)' : '#E6E9ED';
  const muscle = scheme === 'dark' ? 'rgba(255,255,255,0.16)' : '#D4D9DF';
  const vbW = 60 * sides.length + 8 * (sides.length - 1);

  return (
    <Svg width={(height / 120) * vbW} height={height} viewBox={`0 0 ${vbW} 120`}>
      {sides.map((side, i) => {
        const p = lit(side, primary);
        const s = lit(side, secondary);
        const regions = REGIONS[side];
        return (
          <G key={side} transform={`translate(${i * 68},0)`}>
            {ORDER.map((id) => {
              const shapes = regions[id];
              if (!shapes) return null;
              const fill = p.has(id) ? colors.accent : s.has(id) ? colors.accentSubtle : SKIN.has(id) ? skin : muscle;
              return shapes.flatMap((shape, j) => [
                shapeEl(shape, fill, `${id}-${j}`),
                shape.mirror ? shapeEl(shape, fill, `${id}-${j}-m`, MIRROR) : null,
              ]);
            })}
          </G>
        );
      })}
    </Svg>
  );
});
