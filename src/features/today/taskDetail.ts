import { formatDuration, formatLiters, habitValueLabel, type Journey, type ScoreItem } from '@/domain';

import type { DayModel } from './useDayModel';
import { habitVisual, KIND_VISUAL, type Visual } from './visuals';

export interface TaskView {
  item: ScoreItem;
  visual: Visual;
  /** Short progress text, e.g. "108 / 130g"; empty when a check says enough. */
  detail: string;
}

/**
 * Presentation for a scored task. Reads the day model only — task state is
 * never copied, so Today, the task list and share previews always agree.
 */
export function describeTask(item: ScoreItem, model: DayModel, journey: Journey): TaskView {
  if (item.kind === 'habit') {
    const h = model.habits.find((x) => `habit:${x.habit.id}` === item.key);
    if (!h) return { item, visual: KIND_VISUAL.protein, detail: '' };
    const isPlainBoolean = h.habit.kind === 'boolean' && h.steps.length === 0;
    const detail = isPlainBoolean ? '' : h.habit.kind === 'boolean' ? `${h.steps.filter((s) => h.log?.stepsDone.includes(s.id)).length} / ${h.steps.length}` : habitValueLabel(h.habit, h.log);
    return { item, visual: habitVisual(h.habit), detail };
  }
  switch (item.kind) {
    case 'protein':
      return { item, visual: KIND_VISUAL.protein, detail: `${Math.round(model.proteinG)} / ${journey.proteinTargetG}g` };
    case 'water':
      return { item, visual: KIND_VISUAL.water, detail: `${formatLiters(model.waterMl)} / ${formatLiters(journey.waterTargetMl)}L` };
    case 'sleep':
      return {
        item,
        visual: KIND_VISUAL.sleep,
        detail: `${model.sleepMinutes === null ? '--' : formatDuration(model.sleepMinutes)} / ${formatDuration(journey.sleepTargetMin)}`,
      };
    case 'workout':
      return { item, visual: KIND_VISUAL.workout, detail: model.completedSession ? model.completedSession.name : (model.planned?.template.name ?? '') };
  }
}

/** Completed first (what you did), then what remains — in the day's natural order. */
export function taskList(model: DayModel, journey: Journey): TaskView[] {
  const views = model.score.items.map((i) => describeTask(i, model, journey));
  return [...views.filter((v) => v.item.done), ...views.filter((v) => !v.item.done)];
}
