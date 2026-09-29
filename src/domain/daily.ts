import { dateRange, weekday } from './dates';
import { habitActiveOn, scoreDay, type DayInputs, type DayScore, type ScoringConfig, DEFAULT_SCORING } from './scoring';
import { nutritionTotals, type NutritionTotals } from './nutrition';
import type { DailyLog, HabitLog, Habit, ISODate, Journey, Meal, ProteinLog, WaterLog, WorkoutSession, WorkoutTemplate } from './types';
import { exerciseProgress } from './workout';

/** Everything needed to evaluate journey days. */
export interface JourneyData {
  journey: Journey;
  habits: Habit[];
  habitLogs: HabitLog[];
  proteinLogs: ProteinLog[];
  waterLogs: WaterLog[];
  dailyLogs: DailyLog[];
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  /** Optional for backward compatibility with callers created before meals existed. */
  meals?: Meal[];
}

function groupBy<T>(items: T[], key: (t: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

/** Date-indexed view over journey data so range computations stay linear. */
export class JourneyIndex {
  readonly protein: Map<ISODate, ProteinLog[]>;
  readonly meals: Map<ISODate, Meal[]>;
  readonly water: Map<ISODate, WaterLog[]>;
  readonly habitLogs: Map<ISODate, HabitLog[]>;
  readonly daily: Map<ISODate, DailyLog>;
  readonly sessions: Map<ISODate, WorkoutSession[]>;

  constructor(readonly data: JourneyData) {
    this.protein = groupBy(data.proteinLogs, (l) => l.date);
    this.meals = groupBy(data.meals ?? [], (m) => m.date);
    this.water = groupBy(data.waterLogs, (l) => l.date);
    this.habitLogs = groupBy(data.habitLogs, (l) => l.date);
    this.daily = new Map(data.dailyLogs.map((d) => [d.date, d]));
    this.sessions = groupBy(data.sessions, (s) => s.date);
  }

  /** Meals + quick protein logs — the only place daily nutrition is summed. */
  nutritionOn(date: ISODate): NutritionTotals {
    return nutritionTotals(date, this.protein.get(date) ?? [], this.meals.get(date) ?? []);
  }

  proteinOn(date: ISODate): number {
    return this.nutritionOn(date).proteinG;
  }

  waterOn(date: ISODate): number {
    return (this.water.get(date) ?? []).reduce((s, l) => s + l.ml, 0);
  }

  sleepOn(date: ISODate): number | null {
    return this.daily.get(date)?.sleepMinutes ?? null;
  }

  sessionsOn(date: ISODate): WorkoutSession[] {
    return this.sessions.get(date) ?? [];
  }

  /** A workout is planned when a template created by that date is scheduled on its weekday. */
  workoutPlannedOn(date: ISODate): boolean {
    const wd = weekday(date);
    return this.data.templates.some(
      (t) => t.createdAt.slice(0, 10) <= date && (!t.archivedAt || t.archivedAt.slice(0, 10) > date) && t.weekdays.includes(wd),
    );
  }

  inputsFor(date: ISODate): DayInputs {
    const j = this.data.journey;
    const sessions = this.sessionsOn(date);
    const completed = sessions.some((s) => s.status === 'completed');
    const active = sessions.find((s) => s.status === 'active');
    return {
      date,
      proteinG: this.proteinOn(date),
      proteinTargetG: j.proteinTargetG,
      waterMl: this.waterOn(date),
      waterTargetMl: j.waterTargetMl,
      sleepMinutes: this.sleepOn(date),
      sleepTargetMin: j.sleepTargetMin,
      habits: this.data.habits,
      habitLogs: this.habitLogs.get(date) ?? [],
      workoutPlanned: this.workoutPlannedOn(date),
      workoutProgress: active ? exerciseProgress(active).fraction : 0,
      workoutCompleted: completed,
    };
  }

  score(date: ISODate, config: ScoringConfig = DEFAULT_SCORING): DayScore {
    return scoreDay(this.inputsFor(date), config);
  }

  scoreRange(start: ISODate, end: ISODate, config: ScoringConfig = DEFAULT_SCORING): DayScore[] {
    if (end < start) return [];
    return dateRange(start, end).map((d) => this.score(d, config));
  }

  activeHabitsOn(date: ISODate): Habit[] {
    return this.data.habits.filter((h) => habitActiveOn(h, date)).sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
