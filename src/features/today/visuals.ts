import {
  Activity,
  BookOpen,
  Brain,
  CodeXml,
  Droplets,
  Dumbbell,
  Footprints,
  Languages,
  Moon,
  MoonStar,
  PersonStanding,
  Sparkles,
  Sun,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';

import type { Tone } from '@/design-system';
import type { Habit, ScoreItemKind } from '@/domain';

export interface Visual {
  icon: LucideIcon;
  tone: Tone;
}

const BY_KEY: Record<string, Visual> = {
  morning_skincare: { icon: Sun, tone: 'activity' },
  night_skincare: { icon: MoonStar, tone: 'sleep' },
  english: { icon: Languages, tone: 'brand' },
  professional_learning: { icon: CodeXml, tone: 'brand' },
  reading: { icon: BookOpen, tone: 'neutral' },
  steps: { icon: Footprints, tone: 'activity' },
  posture: { icon: PersonStanding, tone: 'neutral' },
  meditation: { icon: Brain, tone: 'sleep' },
};

/** Icon + tone so each habit is recognizable before reading its label. */
export function habitVisual(habit: Pick<Habit, 'templateKey' | 'category' | 'timeOfDay'>): Visual {
  if (habit.templateKey && BY_KEY[habit.templateKey]) return BY_KEY[habit.templateKey]!;
  switch (habit.category) {
    case 'skincare':
      return habit.timeOfDay === 'evening' ? { icon: MoonStar, tone: 'sleep' } : { icon: Sun, tone: 'activity' };
    case 'learning':
      return { icon: BookOpen, tone: 'brand' };
    case 'reading':
      return { icon: BookOpen, tone: 'neutral' };
    case 'movement':
      return { icon: Footprints, tone: 'activity' };
    case 'mind':
      return { icon: Brain, tone: 'sleep' };
    default:
      return { icon: Sparkles, tone: 'neutral' };
  }
}

export const KIND_VISUAL: Record<Exclude<ScoreItemKind, 'habit'>, Visual> = {
  workout: { icon: Dumbbell, tone: 'brand' },
  protein: { icon: Utensils, tone: 'brand' },
  water: { icon: Droplets, tone: 'water' },
  sleep: { icon: Moon, tone: 'sleep' },
};

export const ACTIVITY_VISUAL: Visual = { icon: Activity, tone: 'activity' };
