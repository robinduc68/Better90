/**
 * Minimal 2D figure rig for exercise movement illustrations.
 * Coordinates live in a 120×112 box, y down, floor ≈ 106. Side views face right.
 * TODO: Replace with final Level90 exercise artwork (illustration pack or video).
 */
export type Pt = readonly [number, number];

export type Segment = 'torso' | 'chest' | 'abs' | 'shoulder' | 'upperArm' | 'forearm' | 'hip' | 'thigh' | 'shin';

export type Equip =
  | { kind: 'bar'; at: Pt; length?: number }
  | { kind: 'plate'; at: Pt; r?: number }
  | { kind: 'dumbbell'; at: Pt; vertical?: boolean }
  | { kind: 'cable'; from: Pt; to: Pt }
  | { kind: 'pulley'; at: Pt }
  | { kind: 'line'; from: Pt; to: Pt; w?: number }
  | { kind: 'block'; x: number; y: number; w: number; h: number };

export interface SidePose {
  view: 'side';
  head: Pt;
  neck: Pt;
  shoulder: Pt;
  elbow: Pt;
  hand: Pt;
  hip: Pt;
  knee: Pt;
  foot: Pt;
  /** Far limbs; default = near limbs nudged back. */
  farElbow?: Pt;
  farHand?: Pt;
  farKnee?: Pt;
  farFoot?: Pt;
  gear: Equip[];
}

export interface FrontPose {
  view: 'front';
  head: Pt;
  neck: Pt;
  shoulderL: Pt;
  shoulderR: Pt;
  elbowL: Pt;
  elbowR: Pt;
  handL: Pt;
  handR: Pt;
  hipL: Pt;
  hipR: Pt;
  kneeL: Pt;
  kneeR: Pt;
  footL: Pt;
  footR: Pt;
  gear: Equip[];
}

export type Pose = SidePose | FrontPose;

export interface Movement {
  /** Start and end of the rep. Hero shows `end` with `start` ghosted. */
  start: Pose;
  end: Pose;
  label: string;
}
