import type { Equipment, Exercise, MuscleGroup } from '@/domain';

import { exerciseImages } from './images';

type Def = [id: string, name: string, muscle: MuscleGroup, equipment: Equipment, secondary: string[], instructions: string[]];

/**
 * Bundled exercise library. IDs are stable slugs shared with the `exercises` table.
 * Instructions are short, neutral cues — not coaching or medical advice.
 */
const DEFS: Def[] = [
  // Chest
  ['bench-press', 'Bench Press', 'chest', 'barbell', ['Triceps', 'Front delts'], ['Lie on the bench with eyes under the bar and feet planted.', 'Grip slightly wider than shoulders, retract shoulder blades.', 'Lower the bar to mid-chest with control.', 'Press up until arms are straight without locking hard.']],
  ['incline-bench-press', 'Incline Bench Press', 'chest', 'barbell', ['Front delts', 'Triceps'], ['Set the bench to roughly 30°.', 'Unrack with arms straight over the upper chest.', 'Lower to the upper chest, elbows slightly tucked.', 'Press back up along the same path.']],
  ['dumbbell-bench-press', 'Dumbbell Bench Press', 'chest', 'dumbbell', ['Triceps', 'Front delts'], ['Sit with dumbbells on thighs, then lie back bringing them to chest level.', 'Press up until arms are extended over the chest.', 'Lower slowly until elbows are slightly below the bench.', 'Keep wrists stacked over elbows throughout.']],
  ['incline-dumbbell-press', 'Incline Dumbbell Press', 'chest', 'dumbbell', ['Front delts', 'Triceps'], ['Set the bench to 30–45°.', 'Start with dumbbells at upper-chest level.', 'Press up and slightly in.', 'Lower with control to a comfortable stretch.']],
  ['machine-chest-press', 'Machine Chest Press', 'chest', 'machine', ['Triceps', 'Front delts'], ['Adjust the seat so handles align with mid-chest.', 'Press forward until arms are nearly straight.', 'Return slowly, keeping shoulders down.']],
  ['cable-fly', 'Cable Fly', 'chest', 'cable', ['Front delts'], ['Set pulleys at shoulder height and step forward into a split stance.', 'With a slight elbow bend, bring handles together in front of the chest.', 'Open back out slowly to a comfortable stretch.']],
  ['pec-deck', 'Pec Deck', 'chest', 'machine', ['Front delts'], ['Adjust the seat so handles are at chest height.', 'Bring the arms together in a hugging motion.', 'Return slowly without letting the weights touch.']],
  ['push-up', 'Push-up', 'chest', 'bodyweight', ['Triceps', 'Core'], ['Hands slightly wider than shoulders, body in a straight line.', 'Lower until the chest is just above the floor.', 'Push back up while keeping hips level.']],
  ['chest-dip', 'Chest Dip', 'chest', 'bodyweight', ['Triceps', 'Front delts'], ['Support yourself on parallel bars with a slight forward lean.', 'Lower until shoulders are just below elbows or to comfort.', 'Press back up to the start.']],

  // Back
  ['lat-pulldown', 'Lat Pulldown', 'back', 'cable', ['Biceps', 'Upper back'], ['Grip the bar slightly wider than shoulders and secure thighs under the pad.', 'Pull the bar to the upper chest, driving elbows down.', 'Control the bar back up to full arm extension.']],
  ['close-grip-pulldown', 'Close-Grip Pulldown', 'back', 'cable', ['Biceps'], ['Use a close neutral handle.', 'Pull toward the upper chest, elbows close to the body.', 'Return slowly to a full stretch.']],
  ['chest-supported-row', 'Chest Supported Row', 'back', 'machine', ['Rear delts', 'Biceps'], ['Set the chest pad so you can reach handles with straight arms.', 'Row handles toward the lower ribs, squeezing shoulder blades.', 'Lower with control.']],
  ['seated-cable-row', 'Seated Cable Row', 'back', 'cable', ['Biceps', 'Rear delts'], ['Sit tall with a slight knee bend.', 'Pull the handle to the lower ribs.', 'Let the shoulders reach forward on the return without rounding.']],
  ['barbell-row', 'Barbell Row', 'back', 'barbell', ['Biceps', 'Lower back'], ['Hinge at the hips with a flat back, bar hanging at arm’s length.', 'Row the bar toward the lower chest.', 'Lower under control while keeping the torso still.']],
  ['one-arm-dumbbell-row', 'One-Arm Dumbbell Row', 'back', 'dumbbell', ['Biceps', 'Rear delts'], ['Support one hand and knee on a bench.', 'Row the dumbbell toward the hip.', 'Lower to a full stretch.']],
  ['pull-up', 'Pull-up', 'back', 'bodyweight', ['Biceps', 'Core'], ['Hang with an overhand grip slightly wider than shoulders.', 'Pull until the chin clears the bar.', 'Lower to a full hang with control.']],
  ['chin-up', 'Chin-up', 'back', 'bodyweight', ['Biceps'], ['Hang with an underhand, shoulder-width grip.', 'Pull until the chin clears the bar.', 'Lower slowly to a full hang.']],
  ['t-bar-row', 'T-Bar Row', 'back', 'machine', ['Biceps', 'Rear delts'], ['Brace on the pad or hinge with a flat back.', 'Row the handles toward the chest.', 'Lower under control.']],
  ['straight-arm-pulldown', 'Straight-Arm Pulldown', 'back', 'cable', ['Triceps (long head)'], ['Stand facing a high pulley with arms nearly straight.', 'Sweep the bar down toward the thighs.', 'Return slowly to shoulder height.']],
  ['deadlift', 'Deadlift', 'back', 'barbell', ['Glutes', 'Hamstrings', 'Lower back'], ['Stand with the bar over mid-foot.', 'Hinge and grip the bar with a flat back.', 'Push the floor away and stand tall.', 'Lower by hinging at the hips first.']],

  // Shoulders
  ['overhead-press', 'Overhead Press', 'shoulders', 'barbell', ['Triceps', 'Upper chest'], ['Start with the bar on the front of the shoulders.', 'Brace and press overhead, moving the head back slightly.', 'Finish with the bar over mid-foot, then lower.']],
  ['seated-dumbbell-press', 'Seated Dumbbell Press', 'shoulders', 'dumbbell', ['Triceps'], ['Sit upright with dumbbells at shoulder height.', 'Press overhead until arms are nearly straight.', 'Lower back to shoulder height.']],
  ['machine-shoulder-press', 'Machine Shoulder Press', 'shoulders', 'machine', ['Triceps'], ['Adjust the seat so handles start at shoulder height.', 'Press up without shrugging.', 'Return with control.']],
  ['lateral-raise', 'Lateral Raise', 'shoulders', 'dumbbell', ['Upper traps'], ['Stand tall holding dumbbells at your sides.', 'Raise arms out to shoulder height with soft elbows.', 'Lower slowly.']],
  ['cable-lateral-raise', 'Cable Lateral Raise', 'shoulders', 'cable', [], ['Stand side-on to a low pulley.', 'Raise the handle out to shoulder height.', 'Lower slowly, keeping tension.']],
  ['reverse-pec-deck', 'Reverse Pec Deck', 'shoulders', 'machine', ['Upper back'], ['Face the pad with handles at shoulder height.', 'Open the arms back in a wide arc.', 'Return slowly.']],
  ['face-pull', 'Face Pull', 'shoulders', 'cable', ['Upper back', 'Rotator cuff'], ['Set a rope at upper-chest to face height.', 'Pull toward the face, separating the rope ends.', 'Finish with elbows high, then return slowly.']],
  ['rear-delt-fly', 'Rear Delt Fly', 'shoulders', 'dumbbell', ['Upper back'], ['Hinge forward with a flat back.', 'Raise dumbbells out to the sides.', 'Lower with control.']],
  ['front-raise', 'Front Raise', 'shoulders', 'dumbbell', ['Upper chest'], ['Hold dumbbells in front of the thighs.', 'Raise to shoulder height with soft elbows.', 'Lower slowly.']],
  ['upright-row', 'Upright Row', 'shoulders', 'cable', ['Upper traps'], ['Hold the bar with a shoulder-width grip.', 'Pull up to lower-chest height, elbows leading.', 'Lower with control.']],

  // Biceps
  ['barbell-curl', 'Barbell Curl', 'biceps', 'barbell', ['Forearms'], ['Stand holding the bar with an underhand grip.', 'Curl while keeping elbows by your sides.', 'Lower fully under control.']],
  ['dumbbell-curl', 'Dumbbell Curl', 'biceps', 'dumbbell', ['Forearms'], ['Hold dumbbells at your sides, palms forward.', 'Curl up without swinging.', 'Lower slowly.']],
  ['hammer-curl', 'Hammer Curl', 'biceps', 'dumbbell', ['Brachialis', 'Forearms'], ['Hold dumbbells with palms facing each other.', 'Curl up keeping the neutral grip.', 'Lower slowly.']],
  ['incline-dumbbell-curl', 'Incline Dumbbell Curl', 'biceps', 'dumbbell', [], ['Lie back on an incline bench, arms hanging.', 'Curl up without moving the upper arms.', 'Lower to a full stretch.']],
  ['cable-curl', 'Cable Curl', 'biceps', 'cable', ['Forearms'], ['Stand facing a low pulley.', 'Curl the handle up, elbows fixed.', 'Return slowly.']],
  ['preacher-curl', 'Preacher Curl', 'biceps', 'machine', [], ['Rest upper arms on the pad.', 'Curl up smoothly.', 'Lower until arms are nearly straight.']],

  // Triceps
  ['triceps-pushdown', 'Triceps Pushdown', 'triceps', 'cable', [], ['Stand facing a high pulley, elbows by your sides.', 'Push down until arms are straight.', 'Return slowly to about 90°.']],
  ['overhead-triceps-extension', 'Overhead Triceps Extension', 'triceps', 'cable', [], ['Face away from the pulley with the rope overhead.', 'Extend the arms forward and up.', 'Return to a deep stretch with control.']],
  ['skull-crusher', 'Skull Crusher', 'triceps', 'barbell', [], ['Lie on a bench holding an EZ bar over the chest.', 'Bend elbows to lower the bar toward the forehead.', 'Extend back up.']],
  ['close-grip-bench-press', 'Close-Grip Bench Press', 'triceps', 'barbell', ['Chest'], ['Grip the bar about shoulder width.', 'Lower to the lower chest with elbows tucked.', 'Press back up.']],
  ['bench-dip', 'Bench Dip', 'triceps', 'bodyweight', ['Chest'], ['Hands on a bench behind you, legs extended.', 'Lower by bending the elbows.', 'Press back up.']],
  ['dumbbell-kickback', 'Dumbbell Kickback', 'triceps', 'dumbbell', [], ['Hinge forward with the upper arm parallel to the floor.', 'Extend the elbow until the arm is straight.', 'Return slowly.']],

  // Legs
  ['back-squat', 'Back Squat', 'legs', 'barbell', ['Glutes', 'Core'], ['Bar on upper back, feet shoulder width.', 'Brace and sit down between the hips.', 'Drive up through the whole foot.']],
  ['front-squat', 'Front Squat', 'legs', 'barbell', ['Glutes', 'Core'], ['Rest the bar on the front of the shoulders, elbows high.', 'Squat down keeping the torso upright.', 'Stand back up.']],
  ['leg-press', 'Leg Press', 'legs', 'machine', ['Glutes'], ['Feet shoulder width on the platform.', 'Lower until knees reach a comfortable depth.', 'Press back without locking the knees hard.']],
  ['hack-squat', 'Hack Squat', 'legs', 'machine', ['Glutes'], ['Shoulders under the pads, feet mid-platform.', 'Lower with control.', 'Drive back up.']],
  ['romanian-deadlift', 'Romanian Deadlift', 'legs', 'barbell', ['Glutes', 'Lower back'], ['Stand with the bar at hip height.', 'Hinge back with soft knees, bar close to legs.', 'Return by driving the hips forward.']],
  ['bulgarian-split-squat', 'Bulgarian Split Squat', 'legs', 'dumbbell', ['Glutes'], ['Rear foot on a bench, front foot forward.', 'Lower straight down.', 'Drive up through the front foot.']],
  ['walking-lunge', 'Walking Lunge', 'legs', 'dumbbell', ['Glutes'], ['Step forward into a lunge.', 'Lower until both knees are bent.', 'Push through the front foot into the next step.']],
  ['leg-extension', 'Leg Extension', 'legs', 'machine', [], ['Align knees with the machine pivot.', 'Extend the legs until straight.', 'Lower slowly.']],
  ['lying-leg-curl', 'Lying Leg Curl', 'legs', 'machine', [], ['Lie face down with the pad above the heels.', 'Curl the heels toward the glutes.', 'Lower with control.']],
  ['seated-leg-curl', 'Seated Leg Curl', 'legs', 'machine', [], ['Sit with the pad behind the lower legs.', 'Curl down and back.', 'Return slowly.']],
  ['goblet-squat', 'Goblet Squat', 'legs', 'dumbbell', ['Glutes', 'Core'], ['Hold a dumbbell at chest height.', 'Squat down with an upright torso.', 'Stand back up.']],

  // Glutes
  ['hip-thrust', 'Hip Thrust', 'glutes', 'barbell', ['Hamstrings'], ['Upper back on a bench, bar over the hips.', 'Drive hips up until the torso is level.', 'Lower with control.']],
  ['glute-bridge', 'Glute Bridge', 'glutes', 'bodyweight', ['Hamstrings'], ['Lie on your back with knees bent.', 'Lift the hips until knees, hips and shoulders align.', 'Lower slowly.']],
  ['cable-kickback', 'Cable Kickback', 'glutes', 'cable', [], ['Attach an ankle strap to a low pulley.', 'Kick the leg back while keeping the torso still.', 'Return slowly.']],
  ['hip-abduction', 'Hip Abduction', 'glutes', 'machine', [], ['Sit with pads outside the knees.', 'Push the knees outward.', 'Return with control.']],

  // Calves
  ['standing-calf-raise', 'Standing Calf Raise', 'calves', 'machine', [], ['Balls of the feet on the platform.', 'Rise as high as possible.', 'Lower to a deep stretch.']],
  ['seated-calf-raise', 'Seated Calf Raise', 'calves', 'machine', [], ['Sit with the pad on the lower thighs.', 'Raise the heels.', 'Lower slowly.']],

  // Abs
  ['plank', 'Plank', 'abs', 'bodyweight', ['Shoulders'], ['Forearms under shoulders, body in a straight line.', 'Brace the core and hold.', 'Log time as reps (seconds) if you like.']],
  ['hanging-leg-raise', 'Hanging Leg Raise', 'abs', 'bodyweight', ['Hip flexors'], ['Hang from a bar.', 'Raise the legs with control.', 'Lower without swinging.']],
  ['cable-crunch', 'Cable Crunch', 'abs', 'cable', [], ['Kneel facing a high pulley holding a rope.', 'Crunch down by flexing the spine.', 'Return slowly.']],
  ['ab-wheel-rollout', 'Ab Wheel Rollout', 'abs', 'other', ['Shoulders'], ['Kneel holding the wheel under the shoulders.', 'Roll forward while keeping the core braced.', 'Pull back to the start.']],
  ['crunch', 'Crunch', 'abs', 'bodyweight', [], ['Lie on your back, knees bent.', 'Curl the shoulders off the floor.', 'Lower with control.']],

  // Full body
  ['kettlebell-swing', 'Kettlebell Swing', 'full_body', 'other', ['Glutes', 'Hamstrings'], ['Hinge and hike the kettlebell back.', 'Snap the hips forward to swing it to chest height.', 'Let it fall back into the next hinge.']],
  ['farmers-carry', 'Farmer’s Carry', 'full_body', 'dumbbell', ['Forearms', 'Core'], ['Pick up heavy dumbbells at your sides.', 'Walk tall with short steps.', 'Log distance or time as reps if you like.']],
  ['burpee', 'Burpee', 'full_body', 'bodyweight', [], ['Squat down and place hands on the floor.', 'Jump the feet back, then return.', 'Stand and jump.']],
];

const BODYWEIGHT_IDS = new Set(DEFS.filter((d) => d[3] === 'bodyweight').map((d) => d[0]));

export const EXERCISES: Exercise[] = DEFS.map(([id, name, muscleGroup, equipment, secondaryMuscles, instructions]) => ({
  id,
  name,
  muscleGroup,
  equipment,
  secondaryMuscles,
  instructions,
  image: exerciseImages[id] ?? null,
  animation: null,
  isBodyweight: BODYWEIGHT_IDS.has(id),
}));

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return BY_ID.get(id);
}

export const MUSCLE_GROUP_LABEL: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Legs',
  abs: 'Abs',
  glutes: 'Glutes',
  calves: 'Calves',
  full_body: 'Full Body',
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
  other: 'Other',
};

/** Library filter groups (UI spec): Arms combines biceps + triceps, Legs includes glutes + calves. */
export const LIBRARY_FILTERS: { key: string; label: string; groups: MuscleGroup[] | null }[] = [
  { key: 'all', label: 'All', groups: null },
  { key: 'chest', label: 'Chest', groups: ['chest'] },
  { key: 'back', label: 'Back', groups: ['back'] },
  { key: 'shoulders', label: 'Shoulders', groups: ['shoulders'] },
  { key: 'arms', label: 'Arms', groups: ['biceps', 'triceps'] },
  { key: 'legs', label: 'Legs', groups: ['legs', 'glutes', 'calves'] },
  { key: 'abs', label: 'Abs', groups: ['abs'] },
  { key: 'full', label: 'Full Body', groups: ['full_body'] },
];
