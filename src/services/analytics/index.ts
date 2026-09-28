/**
 * Vendor-agnostic analytics. Business logic calls `analytics.track()` only;
 * adapters decide where events go. Never include body metrics, photos,
 * names or free text in properties.
 */

export type AnalyticsEvent =
  | 'onboarding_completed'
  | 'journey_started'
  | 'workout_started'
  | 'workout_completed'
  | 'exercise_completed'
  | 'protein_logged'
  | 'water_logged'
  | 'habit_completed'
  | 'progress_photo_added'
  | 'share_card_created';

export type AnalyticsProps = Record<string, string | number | boolean | null>;

export interface AnalyticsAdapter {
  track: (event: AnalyticsEvent, props?: AnalyticsProps) => void;
}

const consoleAdapter: AnalyticsAdapter = {
  track: (event, props) => {
    if (__DEV__) console.log(`[analytics] ${event}`, props ?? {});
  },
};

let adapters: AnalyticsAdapter[] = [consoleAdapter];

export const analytics = {
  track(event: AnalyticsEvent, props?: AnalyticsProps) {
    for (const a of adapters) {
      try {
        a.track(event, props);
      } catch {
        // Analytics must never break the app.
      }
    }
  },
  /** Replace adapters (e.g. PostHog/Amplitude later). */
  configure(next: AnalyticsAdapter[]) {
    adapters = next;
  },
};
