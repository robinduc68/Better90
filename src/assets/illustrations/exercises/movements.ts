import type { Equip, FrontPose, Movement, Pt, SidePose } from './rig';

/**
 * Hand-authored movement poses (start → end of a rep).
 * TODO: Replace with final Level90 exercise artwork.
 */

const STAND: Omit<SidePose, 'gear'> = {
  view: 'side',
  head: [60, 17],
  neck: [60, 26],
  shoulder: [60, 30],
  elbow: [61, 46],
  hand: [62, 61],
  hip: [60, 60],
  knee: [61, 82],
  foot: [61, 104],
};

const side = (p: Partial<SidePose>, gear: Equip[] = []): SidePose => ({ ...STAND, ...p, view: 'side', gear });

const FRONT: Omit<FrontPose, 'gear'> = {
  view: 'front',
  head: [60, 15],
  neck: [60, 24],
  shoulderL: [48, 29],
  shoulderR: [72, 29],
  elbowL: [45, 45],
  elbowR: [75, 45],
  handL: [44, 60],
  handR: [76, 60],
  hipL: [54, 60],
  hipR: [66, 60],
  kneeL: [53, 82],
  kneeR: [67, 82],
  footL: [52, 104],
  footR: [68, 104],
};

const front = (p: Partial<FrontPose>, gear: Equip[] = []): FrontPose => ({ ...FRONT, ...p, view: 'front', gear });

const db = (at: Pt, vertical = false): Equip => ({ kind: 'dumbbell', at, vertical });
const plate = (at: Pt, r = 7): Equip => ({ kind: 'plate', at, r });

// Machines / benches reused across frames
const PULLDOWN_MACHINE: Equip[] = [
  { kind: 'line', from: [94, -6], to: [94, 106], w: 3 },
  { kind: 'line', from: [58, -6], to: [94, -6], w: 3 },
  { kind: 'pulley', at: [58, -4] },
  { kind: 'block', x: 38, y: 78, w: 30, h: 5 },
  { kind: 'line', from: [53, 83], to: [53, 106], w: 3 },
  { kind: 'block', x: 66, y: 68, w: 14, h: 4 },
];
const BENCH: Equip[] = [
  { kind: 'block', x: 28, y: 74, w: 56, h: 5 },
  { kind: 'line', from: [34, 79], to: [34, 96], w: 3 },
  { kind: 'line', from: [78, 79], to: [78, 96], w: 3 },
];
const LYING = { hip: [40, 70] as Pt, shoulder: [68, 70] as Pt, neck: [72, 70] as Pt, head: [81, 68] as Pt, knee: [22, 72] as Pt, foot: [14, 94] as Pt };
const HINGE = { hip: [48, 62] as Pt, knee: [52, 84] as Pt, foot: [54, 104] as Pt, neck: [77, 52] as Pt, head: [85, 50] as Pt, shoulder: [74, 53] as Pt };
const ROW_SEAT: Equip[] = [
  { kind: 'block', x: 22, y: 84, w: 34, h: 5 },
  { kind: 'line', from: [74, 80], to: [74, 100], w: 3 },
  { kind: 'line', from: [108, 60], to: [108, 106], w: 3 },
  { kind: 'pulley', at: [104, 92] },
];
const SEATED_ROW = { hip: [40, 82] as Pt, knee: [58, 72] as Pt, foot: [72, 90] as Pt, neck: [43, 51] as Pt, head: [44, 42] as Pt, shoulder: [43, 55] as Pt };
const CABLE_POST: Equip[] = [
  { kind: 'line', from: [88, -6], to: [88, 106], w: 3 },
  { kind: 'pulley', at: [82, -4] },
];
const LEG_MACHINE: Equip[] = [
  { kind: 'block', x: 36, y: 74, w: 26, h: 5 },
  { kind: 'line', from: [38, 74], to: [33, 42], w: 4 },
  { kind: 'line', from: [44, 79], to: [44, 106], w: 3 },
];
const SEATED_LEG = { hip: [50, 72] as Pt, knee: [72, 72] as Pt, neck: [45, 42] as Pt, head: [43, 33] as Pt, shoulder: [45, 46] as Pt, elbow: [48, 60] as Pt, hand: [55, 71] as Pt };
const HANG_BAR: Equip[] = [{ kind: 'line', from: [40, -6], to: [80, -6], w: 3 }];
const HANG = { hand: [60, -4] as Pt, elbow: [60, 12] as Pt, shoulder: [60, 28] as Pt, neck: [60, 30] as Pt, head: [64, 22] as Pt, hip: [60, 60] as Pt, knee: [61, 82] as Pt, foot: [60, 104] as Pt };

export const MOVEMENTS = {
  pulldown: {
    label: 'Pull the bar to your upper chest',
    start: side(
      { hip: [52, 76], knee: [74, 76], foot: [76, 98], neck: [50, 45], head: [49, 36], shoulder: [50, 49], elbow: [54, 33], hand: [57, 18] },
      [...PULLDOWN_MACHINE, { kind: 'cable', from: [57, 18], to: [58, -4] }, { kind: 'bar', at: [57, 18], length: 30 }],
    ),
    end: side(
      { hip: [52, 76], knee: [74, 76], foot: [76, 98], neck: [50, 45], head: [49, 36], shoulder: [50, 49], elbow: [45, 63], hand: [56, 51] },
      [...PULLDOWN_MACHINE, { kind: 'cable', from: [56, 51], to: [58, -4] }, { kind: 'bar', at: [56, 51], length: 30 }],
    ),
  },
  pullup: {
    label: 'Pull until your chin clears the bar',
    start: side({ ...HANG }, HANG_BAR),
    end: side({ hand: [60, -4], elbow: [51, 7], shoulder: [60, 14], neck: [61, 12], head: [65, 4], hip: [60, 44], knee: [63, 66], foot: [60, 88] }, HANG_BAR),
  },
  row: {
    label: 'Row the handle to your lower ribs',
    start: side({ ...SEATED_ROW, elbow: [58, 58], hand: [73, 62] }, [...ROW_SEAT, { kind: 'cable', from: [73, 62], to: [104, 92] }]),
    end: side({ ...SEATED_ROW, elbow: [29, 63], hand: [43, 68] }, [...ROW_SEAT, { kind: 'cable', from: [43, 68], to: [104, 92] }]),
  },
  bentRow: {
    label: 'Row the weight toward your hip',
    start: side({ ...HINGE, elbow: [74, 69], hand: [74, 84] }, [db([74, 86])]),
    end: side({ ...HINGE, elbow: [61, 60], hand: [66, 74] }, [db([66, 76])]),
  },
  bench: {
    label: 'Lower to mid-chest, press back up',
    start: side({ ...LYING, elbow: [68, 54], hand: [68, 39] }, [...BENCH, plate([68, 39])]),
    end: side({ ...LYING, elbow: [56, 62], hand: [66, 57] }, [...BENCH, plate([66, 57])]),
  },
  benchDb: {
    label: 'Lower with control, press up',
    start: side({ ...LYING, elbow: [68, 54], hand: [68, 39] }, [...BENCH, db([68, 38])]),
    end: side({ ...LYING, elbow: [56, 64], hand: [62, 56] }, [...BENCH, db([62, 55])]),
  },
  skull: {
    label: 'Bend at the elbows, then extend',
    start: side({ ...LYING, elbow: [68, 54], hand: [68, 39] }, [...BENCH, plate([68, 39], 5)]),
    end: side({ ...LYING, elbow: [68, 54], hand: [79, 60] }, [...BENCH, plate([80, 59], 5)]),
  },
  ohp: {
    label: 'Press overhead, lower to shoulders',
    start: side({ elbow: [68, 42], hand: [64, 30] }, [plate([64, 28], 6)]),
    end: side({ elbow: [63, 15], hand: [62, 1] }, [plate([62, 0], 6)]),
  },
  ohpDb: {
    label: 'Press up, lower to shoulder height',
    start: side({ elbow: [68, 42], hand: [65, 30] }, [db([65, 28])]),
    end: side({ elbow: [63, 15], hand: [62, 1] }, [db([62, 0])]),
  },
  lateral: {
    label: 'Raise arms out to shoulder height',
    start: front({}, [db([44, 62], true), db([76, 62], true)]),
    end: front({ elbowL: [33, 30], handL: [19, 32], elbowR: [87, 30], handR: [101, 32] }, [db([19, 32], true), db([101, 32], true)]),
  },
  frontRaise: {
    label: 'Raise to shoulder height in front',
    start: side({}, [db([62, 63])]),
    end: side({ elbow: [75, 32], hand: [90, 33] }, [db([91, 33])]),
  },
  uprightRow: {
    label: 'Pull up to chest height, elbows leading',
    start: side({}, [plate([63, 63], 5)]),
    end: side({ elbow: [70, 30], hand: [65, 42] }, [plate([66, 42], 5)]),
  },
  facePull: {
    label: 'Pull toward your face, elbows high',
    start: side({ elbow: [73, 31], hand: [88, 29] }, [{ kind: 'line', from: [112, -6], to: [112, 106], w: 3 }, { kind: 'pulley', at: [108, 28] }, { kind: 'cable', from: [88, 29], to: [108, 28] }]),
    end: side({ elbow: [50, 26], hand: [64, 21] }, [{ kind: 'line', from: [112, -6], to: [112, 106], w: 3 }, { kind: 'pulley', at: [108, 28] }, { kind: 'cable', from: [64, 21], to: [108, 28] }]),
  },
  fly: {
    label: 'Bring the handles together in front',
    start: front(
      { elbowL: [34, 33], handL: [20, 38], elbowR: [86, 33], handR: [100, 38] },
      [{ kind: 'pulley', at: [8, 20] }, { kind: 'pulley', at: [112, 20] }, { kind: 'cable', from: [20, 38], to: [8, 20] }, { kind: 'cable', from: [100, 38], to: [112, 20] }],
    ),
    end: front(
      { elbowL: [45, 42], handL: [56, 47], elbowR: [75, 42], handR: [64, 47] },
      [{ kind: 'pulley', at: [8, 20] }, { kind: 'pulley', at: [112, 20] }, { kind: 'cable', from: [56, 47], to: [8, 20] }, { kind: 'cable', from: [64, 47], to: [112, 20] }],
    ),
  },
  pushup: {
    label: 'Lower your chest, push back up',
    start: side({ shoulder: [84, 80], elbow: [84, 92], hand: [84, 104], hip: [56, 84], knee: [36, 92], foot: [14, 102], neck: [88, 79], head: [96, 77] }),
    end: side({ shoulder: [84, 94], elbow: [70, 98], hand: [84, 104], hip: [56, 96], knee: [36, 100], foot: [14, 104], neck: [88, 93], head: [96, 91] }),
  },
  dip: {
    label: 'Lower until shoulders dip, press up',
    start: side({ shoulder: [60, 24], elbow: [59, 39], hand: [62, 54], neck: [60, 20], head: [62, 11], hip: [58, 54], knee: [54, 74], foot: [62, 92] }, [{ kind: 'line', from: [50, 55], to: [74, 55], w: 3 }]),
    end: side({ shoulder: [60, 38], elbow: [48, 46], hand: [62, 54], neck: [61, 34], head: [64, 26], hip: [57, 68], knee: [52, 88], foot: [60, 104] }, [{ kind: 'line', from: [50, 55], to: [74, 55], w: 3 }]),
  },
  curl: {
    label: 'Curl up, elbows by your sides',
    start: side({}, [db([62, 63])]),
    end: side({ hand: [71, 36] }, [db([72, 35])]),
  },
  pushdown: {
    label: 'Push down until arms are straight',
    start: side({ elbow: [62, 46], hand: [74, 38] }, [...CABLE_POST, { kind: 'cable', from: [74, 38], to: [82, -4] }, { kind: 'bar', at: [74, 38], length: 12 }]),
    end: side({ elbow: [62, 46], hand: [66, 61] }, [...CABLE_POST, { kind: 'cable', from: [66, 61], to: [82, -4] }, { kind: 'bar', at: [66, 61], length: 12 }]),
  },
  overheadExt: {
    label: 'Extend overhead, return behind the head',
    start: side({ elbow: [64, 14], hand: [53, 22] }, [db([52, 23])]),
    end: side({ elbow: [64, 14], hand: [66, -1] }, [db([66, -2])]),
  },
  kickback: {
    label: 'Extend the arm straight back',
    start: side({ ...HINGE, elbow: [60, 55], hand: [60, 69], farElbow: [79, 60], farHand: [82, 66] }, [{ kind: 'block', x: 76, y: 66, w: 28, h: 5 }, db([60, 71], true)]),
    end: side({ ...HINGE, elbow: [60, 55], hand: [45, 54], farElbow: [79, 60], farHand: [82, 66] }, [{ kind: 'block', x: 76, y: 66, w: 28, h: 5 }, db([43, 54])]),
  },
  squat: {
    label: 'Sit down between the hips, drive up',
    start: side({ elbow: [52, 38], hand: [57, 30] }, [plate([58, 28])]),
    end: side({ hip: [44, 78], knee: [66, 82], foot: [61, 104], neck: [54, 49], head: [57, 41], shoulder: [53, 53], elbow: [46, 56], hand: [52, 48] }, [plate([53, 47])]),
  },
  hinge: {
    label: 'Hinge back with a flat back, stand tall',
    start: side({ hand: [62, 62] }, [plate([63, 66])]),
    end: side({ hip: [52, 60], knee: [57, 82], foot: [60, 104], neck: [80, 50], head: [88, 48], shoulder: [77, 51], elbow: [77, 67], hand: [77, 82] }, [plate([77, 88])]),
  },
  lunge: {
    label: 'Lower straight down, drive up',
    start: side({ hand: [61, 62] }, [db([61, 64], true)]),
    end: side(
      { hip: [60, 78], knee: [78, 82], foot: [80, 104], farKnee: [48, 98], farFoot: [32, 102], neck: [60, 47], head: [60, 38], shoulder: [60, 51], elbow: [60, 67], hand: [60, 82] },
      [db([60, 84], true)],
    ),
  },
  legExt: {
    label: 'Extend the legs, lower slowly',
    start: side({ ...SEATED_LEG, foot: [74, 94] }, [...LEG_MACHINE, { kind: 'block', x: 70, y: 92, w: 10, h: 5 }]),
    end: side({ ...SEATED_LEG, foot: [94, 68] }, [...LEG_MACHINE, { kind: 'block', x: 90, y: 66, w: 10, h: 5 }]),
  },
  legPress: {
    label: 'Press the platform away, knees soft',
    start: side(
      { hip: [40, 72], knee: [56, 57], foot: [78, 62], neck: [28, 46], head: [24, 38], shoulder: [29, 50], elbow: [38, 60], hand: [44, 70] },
      [{ kind: 'line', from: [32, 72], to: [22, 42], w: 5 }, { kind: 'block', x: 24, y: 72, w: 26, h: 5 }, { kind: 'line', from: [80, 76], to: [90, 46], w: 5 }],
    ),
    end: side(
      { hip: [40, 72], knee: [61, 66], foot: [83, 62], neck: [28, 46], head: [24, 38], shoulder: [29, 50], elbow: [38, 60], hand: [44, 70] },
      [{ kind: 'line', from: [32, 72], to: [22, 42], w: 5 }, { kind: 'block', x: 24, y: 72, w: 26, h: 5 }, { kind: 'line', from: [86, 76], to: [96, 46], w: 5 }],
    ),
  },
  hipThrust: {
    label: 'Drive the hips up, squeeze, lower',
    start: side({ hip: [50, 90], knee: [32, 82], foot: [28, 104], neck: [74, 70], head: [83, 66], shoulder: [71, 71], elbow: [62, 82], hand: [52, 88] }, [{ kind: 'block', x: 66, y: 72, w: 32, h: 8 }, plate([50, 86])]),
    end: side({ hip: [50, 72], knee: [32, 82], foot: [28, 104], neck: [80, 66], head: [89, 63], shoulder: [77, 67], elbow: [64, 76], hand: [52, 72] }, [{ kind: 'block', x: 70, y: 70, w: 30, h: 8 }, plate([51, 70])]),
  },
  calfRaise: {
    label: 'Rise onto the balls of your feet',
    start: side({}, [{ kind: 'block', x: 56, y: 104, w: 20, h: 3 }]),
    end: side({ head: [60, 12], neck: [60, 21], shoulder: [60, 25], elbow: [61, 41], hand: [62, 56], hip: [60, 55], knee: [61, 77], foot: [61, 99] }, [{ kind: 'block', x: 56, y: 104, w: 20, h: 3 }]),
  },
  plank: {
    label: 'Brace and hold a straight line',
    start: side({ shoulder: [80, 86], elbow: [80, 102], hand: [92, 103], hip: [52, 88], knee: [32, 94], foot: [12, 102], neck: [84, 85], head: [92, 84] }),
    end: side({ shoulder: [80, 86], elbow: [80, 102], hand: [92, 103], hip: [52, 87], knee: [32, 94], foot: [12, 102], neck: [84, 85], head: [92, 84] }),
  },
  crunch: {
    label: 'Curl the shoulders up, lower slowly',
    start: side({ hip: [50, 100], knee: [36, 86], foot: [24, 102], neck: [80, 100], head: [89, 98], shoulder: [76, 100], elbow: [84, 91], hand: [88, 96] }),
    end: side({ hip: [50, 100], knee: [36, 86], foot: [24, 102], neck: [73, 88], head: [79, 80], shoulder: [71, 90], elbow: [80, 80], hand: [81, 87] }),
  },
  hangRaise: {
    label: 'Raise the legs without swinging',
    start: side({ ...HANG }, HANG_BAR),
    end: side({ ...HANG, knee: [82, 62], foot: [104, 62] }, HANG_BAR),
  },
  carry: {
    label: 'Walk tall with short steps',
    start: side({ hand: [62, 62] }, [db([62, 64], true)]),
    end: side({ hand: [62, 62], knee: [66, 82], foot: [70, 104], farKnee: [56, 82], farFoot: [52, 104] }, [db([62, 64], true)]),
  },
} satisfies Record<string, Movement>;

export type MovementKey = keyof typeof MOVEMENTS;

/** exerciseId → movement. Unknown ids fall back by muscle group in ExerciseArtwork. */
export const EXERCISE_MOVEMENT: Record<string, MovementKey> = {
  'bench-press': 'bench',
  'incline-bench-press': 'bench',
  'dumbbell-bench-press': 'benchDb',
  'incline-dumbbell-press': 'benchDb',
  'machine-chest-press': 'bench',
  'cable-fly': 'fly',
  'pec-deck': 'fly',
  'push-up': 'pushup',
  'chest-dip': 'dip',
  'lat-pulldown': 'pulldown',
  'close-grip-pulldown': 'pulldown',
  'straight-arm-pulldown': 'pulldown',
  'chest-supported-row': 'row',
  'seated-cable-row': 'row',
  't-bar-row': 'bentRow',
  'barbell-row': 'bentRow',
  'one-arm-dumbbell-row': 'bentRow',
  'pull-up': 'pullup',
  'chin-up': 'pullup',
  deadlift: 'hinge',
  'overhead-press': 'ohp',
  'seated-dumbbell-press': 'ohpDb',
  'machine-shoulder-press': 'ohpDb',
  'lateral-raise': 'lateral',
  'cable-lateral-raise': 'lateral',
  'reverse-pec-deck': 'lateral',
  'face-pull': 'facePull',
  'rear-delt-fly': 'lateral',
  'front-raise': 'frontRaise',
  'upright-row': 'uprightRow',
  'barbell-curl': 'curl',
  'dumbbell-curl': 'curl',
  'hammer-curl': 'curl',
  'incline-dumbbell-curl': 'curl',
  'cable-curl': 'curl',
  'preacher-curl': 'curl',
  'triceps-pushdown': 'pushdown',
  'overhead-triceps-extension': 'overheadExt',
  'skull-crusher': 'skull',
  'close-grip-bench-press': 'bench',
  'bench-dip': 'dip',
  'dumbbell-kickback': 'kickback',
  'back-squat': 'squat',
  'front-squat': 'squat',
  'leg-press': 'legPress',
  'hack-squat': 'squat',
  'romanian-deadlift': 'hinge',
  'bulgarian-split-squat': 'lunge',
  'walking-lunge': 'lunge',
  'leg-extension': 'legExt',
  'lying-leg-curl': 'legExt',
  'seated-leg-curl': 'legExt',
  'goblet-squat': 'squat',
  'hip-thrust': 'hipThrust',
  'glute-bridge': 'hipThrust',
  'cable-kickback': 'hipThrust',
  'hip-abduction': 'hipThrust',
  'standing-calf-raise': 'calfRaise',
  'seated-calf-raise': 'calfRaise',
  plank: 'plank',
  'hanging-leg-raise': 'hangRaise',
  'cable-crunch': 'crunch',
  'ab-wheel-rollout': 'crunch',
  crunch: 'crunch',
  'kettlebell-swing': 'hinge',
  'farmers-carry': 'carry',
  burpee: 'squat',
};
