import { X } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { ACTIVITY_LABEL, ACTIVITY_OPTIONS } from '@/constants/goals';
import { BottomSheet, Button, FilterChip, IconButton, makeStyles, Stepper, Text } from '@/design-system';
import { formatDuration, type ActivityKey, type ActivityLog } from '@/domain';

interface ActivitySheetProps {
  visible: boolean;
  onClose: () => void;
  preferred: ActivityKey[];
  entries: ActivityLog[];
  onAdd: (activity: ActivityKey, minutes: number) => void;
  onRemove: (id: string) => void;
}

export function ActivitySheet({ visible, onClose, preferred, entries, onAdd, onRemove }: ActivitySheetProps) {
  const styles = useStyles();
  const [activity, setActivity] = useState<ActivityKey>(preferred[0] ?? 'football');
  const [minutes, setMinutes] = useState(60);
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Log activity"
      subtitle="Football, running, cycling and more."
      footer={
        <Button
          label={`Add ${ACTIVITY_LABEL[activity].toLowerCase()}`}
          onPress={() => {
            onAdd(activity, minutes);
            onClose();
          }}
        />
      }
    >
      <View style={styles.chips}>
        {ACTIVITY_OPTIONS.map((a) => (
          <FilterChip key={a.key} label={a.label} selected={activity === a.key} onPress={() => setActivity(a.key)} />
        ))}
      </View>
      <Stepper label="Duration" value={minutes} onChange={setMinutes} step={15} min={15} max={300} format={formatDuration} />
      {entries.length > 0 ? (
        <View>
          <Text variant="label" color="muted">
            Logged
          </Text>
          {entries.map((e) => (
            <View key={e.id} style={styles.entry}>
              <Text variant="bodyMedium" style={styles.flex}>
                {ACTIVITY_LABEL[e.activity]}
              </Text>
              <Text variant="caption" color="muted" tabular>
                {formatDuration(e.minutes)}
              </Text>
              <IconButton icon={X} onPress={() => onRemove(e.id)} accessibilityLabel={`Remove ${ACTIVITY_LABEL[e.activity]}`} />
            </View>
          ))}
        </View>
      ) : null}
    </BottomSheet>
  );
}

const useStyles = makeStyles((t) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs },
  entry: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 48, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  flex: { flex: 1 },
}));
