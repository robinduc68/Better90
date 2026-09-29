import type { Exercise, MuscleGroup } from '@/domain';

/**
 * Stylized body for navigation-level muscle visuals — not anatomy.
 * 60×120 box per figure. Shapes flagged `mirror` are drawn on both sides.
 * TODO: Replace with final Level90 muscle artwork (custom SVG pack).
 */
export type Side = 'front' | 'back';

export type Shape =
  | { kind: 'path'; d: string; mirror?: boolean }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; mirror?: boolean }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r: number; rotate?: number; mirror?: boolean };

export type RegionId =
  | 'head'
  | 'neck'
  | 'torso'
  | 'pelvis'
  | 'hand'
  | 'foot'
  | 'forearm'
  | 'delts'
  | 'chest'
  | 'abs'
  | 'upperBack'
  | 'lats'
  | 'lowerBack'
  | 'glutes'
  | 'upperArm'
  | 'thigh'
  | 'shin';

const SKELETON: Partial<Record<RegionId, Shape[]>> = {
  head: [{ kind: 'ellipse', cx: 30, cy: 10, rx: 6.4, ry: 7.4 }],
  neck: [{ kind: 'path', d: 'M26.8 15.5 L33.2 15.5 L34.4 22.5 L25.6 22.5 Z' }],
  torso: [{ kind: 'path', d: 'M17 24.5 C20.5 21 39.5 21 43 24.5 L42.2 40 C41.4 48 39.8 53.5 38.6 58 L21.4 58 C20.2 53.5 18.6 48 17.8 40 Z' }],
  pelvis: [{ kind: 'path', d: 'M21.6 57.4 L38.4 57.4 L40.2 66.5 L31 68.5 L30 66.8 L29 68.5 L19.8 66.5 Z' }],
  hand: [{ kind: 'ellipse', cx: 9.4, cy: 63.5, rx: 2.8, ry: 3.4, mirror: true }],
  foot: [{ kind: 'ellipse', cx: 24.6, cy: 114, rx: 4.2, ry: 2.2, mirror: true }],
  forearm: [{ kind: 'rect', x: 8, y: 45.5, w: 5.8, h: 15.5, r: 2.9, rotate: 7, mirror: true }],
  delts: [{ kind: 'ellipse', cx: 16.8, cy: 27.4, rx: 4.8, ry: 5.4, mirror: true }],
  upperArm: [{ kind: 'rect', x: 10.2, y: 29.5, w: 6.8, h: 16.5, r: 3.4, rotate: 7, mirror: true }],
  thigh: [{ kind: 'path', d: 'M20.8 64 C19 72 19.8 83.5 21.8 90.5 L28.6 90.5 C29.6 84 30 72.5 29.6 66.5 Z', mirror: true }],
  shin: [{ kind: 'path', d: 'M21.6 91.8 C20.6 97 21.4 105 22.8 111.5 L27 111.5 C28.4 105 28.8 97 28 91.8 Z', mirror: true }],
};

export const REGIONS: Record<Side, Partial<Record<RegionId, Shape[]>>> = {
  front: {
    ...SKELETON,
    chest: [{ kind: 'path', d: 'M19.6 25.6 C23.4 23.4 28.6 23.8 29.6 25.8 L29.6 33.6 C26 36 21.2 35.2 19.4 32 Z', mirror: true }],
    abs: [
      { kind: 'rect', x: 25.4, y: 36.6, w: 4.2, h: 5, r: 1.6, mirror: true },
      { kind: 'rect', x: 25.4, y: 42.6, w: 4.2, h: 5, r: 1.6, mirror: true },
      { kind: 'rect', x: 25.6, y: 48.6, w: 4, h: 6, r: 1.6, mirror: true },
    ],
  },
  back: {
    ...SKELETON,
    upperBack: [{ kind: 'path', d: 'M24.4 21.6 L35.6 21.6 L41 26 L30 31.5 L19 26 Z' }],
    lats: [{ kind: 'path', d: 'M18.8 27.4 C22.4 27.6 27.6 30.4 29.4 34.6 L29.4 49 C25.2 47.4 21.4 43.2 19.4 37.6 Z', mirror: true }],
    lowerBack: [{ kind: 'rect', x: 25.2, y: 48.6, w: 9.6, h: 8.2, r: 3 }],
    glutes: [{ kind: 'ellipse', cx: 25.4, cy: 62.8, rx: 5.4, ry: 5 , mirror: true }],
  },
};

/** Which regions each muscle group lights up. */
export const GROUP_REGIONS: Record<MuscleGroup, Partial<Record<Side, RegionId[]>>> = {
  chest: { front: ['chest'] },
  back: { back: ['upperBack', 'lats', 'lowerBack'] },
  shoulders: { front: ['delts'], back: ['delts'] },
  biceps: { front: ['upperArm'] },
  triceps: { back: ['upperArm'] },
  legs: { front: ['thigh'], back: ['thigh'] },
  glutes: { back: ['glutes'] },
  calves: { back: ['shin'] },
  abs: { front: ['abs'] },
  full_body: { front: ['chest', 'abs', 'delts', 'thigh'], back: ['upperBack', 'lats', 'glutes', 'thigh'] },
};

const SECONDARY_KEYWORDS: [RegExp, MuscleGroup][] = [
  [/bicep|brachialis/i, 'biceps'],
  [/tricep/i, 'triceps'],
  [/delt|shoulder|rotator/i, 'shoulders'],
  [/glute/i, 'glutes'],
  [/hamstring|quad/i, 'legs'],
  [/calf|calves/i, 'calves'],
  [/core|hip flexor/i, 'abs'],
  [/back|lat|trap/i, 'back'],
  [/chest/i, 'chest'],
];

/** Maps free-text secondary muscles ("Rear delts") onto groups. */
export function secondaryGroups(exercise: Pick<Exercise, 'secondaryMuscles' | 'muscleGroup'>): MuscleGroup[] {
  const out = new Set<MuscleGroup>();
  for (const m of exercise.secondaryMuscles) {
    const hit = SECONDARY_KEYWORDS.find(([re]) => re.test(m));
    if (hit && hit[1] !== exercise.muscleGroup) out.add(hit[1]);
  }
  return [...out];
}

/** Sides that have something highlighted, front first. */
export function sidesFor(groups: MuscleGroup[]): Side[] {
  const sides = new Set<Side>();
  groups.forEach((g) => (Object.keys(GROUP_REGIONS[g]) as Side[]).forEach((s) => sides.add(s)));
  return (['front', 'back'] as Side[]).filter((s) => sides.has(s));
}

/** The single side that best shows these groups (most highlighted regions; front wins ties). */
export function bestSide(groups: MuscleGroup[]): Side {
  const score = (side: Side) => groups.slice(0, 2).reduce((n, g, i) => n + (GROUP_REGIONS[g][side]?.length ?? 0) * (i === 0 ? 2 : 1), 0);
  return score('back') > score('front') ? 'back' : 'front';
}
