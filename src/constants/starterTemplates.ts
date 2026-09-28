/** Optional starter workouts the user can add with one tap. Never applied automatically. */
export const STARTER_TEMPLATES: { name: string; exercises: [exerciseId: string, sets: number, reps: number][] }[] = [
  {
    name: 'Back + Shoulders',
    exercises: [
      ['lat-pulldown', 3, 12],
      ['chest-supported-row', 3, 10],
      ['reverse-pec-deck', 3, 15],
      ['lateral-raise', 3, 15],
      ['face-pull', 3, 15],
    ],
  },
  {
    name: 'Chest + Triceps',
    exercises: [
      ['bench-press', 3, 8],
      ['incline-dumbbell-press', 3, 10],
      ['cable-fly', 3, 12],
      ['triceps-pushdown', 3, 12],
      ['overhead-triceps-extension', 3, 12],
    ],
  },
  {
    name: 'Legs',
    exercises: [
      ['back-squat', 3, 8],
      ['romanian-deadlift', 3, 10],
      ['leg-press', 3, 12],
      ['lying-leg-curl', 3, 12],
      ['standing-calf-raise', 3, 15],
    ],
  },
  {
    name: 'Arms + Abs',
    exercises: [
      ['barbell-curl', 3, 10],
      ['hammer-curl', 3, 12],
      ['skull-crusher', 3, 10],
      ['triceps-pushdown', 3, 12],
      ['hanging-leg-raise', 3, 12],
    ],
  },
];
