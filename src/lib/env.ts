/**
 * Public runtime configuration. Only EXPO_PUBLIC_* values are bundled into the app.
 * The Supabase anon/publishable key is designed to be public — data is protected
 * by Row Level Security. Never put a service-role key in the app.
 */
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
} as const;

export const isSupabaseConfigured = env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;

/** Demo data tools: always on in development, opt-in for preview builds. */
export const demoToolsEnabled = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_DEMO === '1';
