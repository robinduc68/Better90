import { Redirect, router, Tabs } from 'expo-router';
import { CalendarDays, ChartLine, Dumbbell, House, User, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/design-system';
import { useActiveWorkoutStore, useAppStore } from '@/store';

function tabIcon(Icon: LucideIcon) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icon size={22} color={String(color)} strokeWidth={focused ? 2.3 : 1.9} />;
  };
}

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const hasJourney = useAppStore((s) => s.journey !== null);
  const resumed = useRef(false);

  // Reopening the app mid-workout goes straight back to the active workout.
  useEffect(() => {
    if (resumed.current) return;
    resumed.current = true;
    if (useActiveWorkoutStore.getState().session) router.push('/workout/active');
  }, []);

  if (!hasJourney) return <Redirect href="/onboarding" />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.accentForeground,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarLabelStyle: { fontFamily: theme.typography.caption.fontFamily, fontSize: 11, lineHeight: 14, letterSpacing: 0.2, marginTop: 0 },
          tabBarLabelPosition: 'below-icon',
          tabBarItemStyle: { paddingVertical: 0, height: theme.layout.tabBarBaseHeight - 6 },
          tabBarIconStyle: { marginTop: 2 },
          tabBarStyle: {
            backgroundColor: theme.colors.tabBar,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            height: theme.layout.tabBarBaseHeight + Math.max(insets.bottom, 6),
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 6),
            elevation: 0,
          },
          sceneStyle: { backgroundColor: theme.colors.background },
          animation: 'fade',
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: tabIcon(House), tabBarAccessibilityLabel: 'Today' }} />
        <Tabs.Screen name="workout" options={{ title: 'Workout', tabBarIcon: tabIcon(Dumbbell) }} />
        <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: tabIcon(ChartLine) }} />
        <Tabs.Screen name="journey" options={{ title: 'Journey', tabBarIcon: tabIcon(CalendarDays) }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon(User) }} />
      </Tabs>
    </View>
  );
}
