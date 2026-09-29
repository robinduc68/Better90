import { Activity, Camera, ChevronRight, Droplets, Scale, Utensils, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { BottomSheet, IconBadge, makeStyles, PressableScale, Text, useTheme, type Tone } from '@/design-system';

export type QuickLogTarget = 'water' | 'protein' | 'weight' | 'activity' | 'photo';

const ITEMS: { key: QuickLogTarget; label: string; hint: string; icon: LucideIcon; tone: Tone }[] = [
  { key: 'water', label: 'Water', hint: 'Add a glass or bottle', icon: Droplets, tone: 'water' },
  { key: 'protein', label: 'Meal or protein', hint: 'Photo, manual entry or quick grams', icon: Utensils, tone: 'brand' },
  { key: 'weight', label: 'Weight', hint: 'Body weight & measurements', icon: Scale, tone: 'neutral' },
  { key: 'activity', label: 'Activity', hint: 'Football, running, cycling', icon: Activity, tone: 'activity' },
  { key: 'photo', label: 'Progress photo', hint: 'Private to you', icon: Camera, tone: 'neutral' },
];

/** One place for common logging: open → pick → log. */
export function QuickLogSheet({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (t: QuickLogTarget) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Quick log">
      <View>
        {ITEMS.map((i) => (
          <PressableScale
            key={i.key}
            onPress={() => onSelect(i.key)}
            pressedScale={1}
            pressedOpacity={0.7}
            style={styles.row}
            accessibilityLabel={`${i.label}. ${i.hint}`}
          >
            <IconBadge icon={i.icon} tone={i.tone} />
            <View style={styles.body}>
              <Text variant="bodyMedium">{i.label}</Text>
              <Text variant="caption" color="muted">
                {i.hint}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </PressableScale>
        ))}
      </View>
    </BottomSheet>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 60 },
  body: { flex: 1, gap: 2 },
}));
