import { Camera, ChevronRight, Images, PenLine, Utensils, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { BottomSheet, IconBadge, makeStyles, PressableScale, Text, useTheme, type Tone } from '@/design-system';

export type AddMealChoice = 'camera' | 'library' | 'manual' | 'quick_protein';

const OPTIONS: { key: AddMealChoice; label: string; hint: string; icon: LucideIcon; tone: Tone }[] = [
  { key: 'camera', label: 'Take photo', hint: 'Snap your plate', icon: Camera, tone: 'brand' },
  { key: 'library', label: 'Choose photo', hint: 'From your library', icon: Images, tone: 'neutral' },
  { key: 'manual', label: 'Enter manually', hint: 'Name, calories and macros', icon: PenLine, tone: 'neutral' },
  { key: 'quick_protein', label: 'Quick protein', hint: 'Just grams — a shake or snack', icon: Utensils, tone: 'activity' },
];

export function AddMealSheet({ visible, onClose, onChoose }: { visible: boolean; onClose: () => void; onChoose: (c: AddMealChoice) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add meal">
      <View>
        {OPTIONS.map((o) => (
          <PressableScale key={o.key} onPress={() => onChoose(o.key)} pressedScale={1} pressedOpacity={0.7} style={styles.row} accessibilityLabel={`${o.label}. ${o.hint}`}>
            <IconBadge icon={o.icon} tone={o.tone} />
            <View style={styles.body}>
              <Text variant="bodyMedium">{o.label}</Text>
              <Text variant="caption" color="muted">
                {o.hint}
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
