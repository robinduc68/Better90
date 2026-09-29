import { useState } from 'react';

import { BottomSheet, Button, Stepper } from '@/design-system';

export interface TargetConfig {
  title: string;
  value: number;
  step: number;
  min: number;
  max: number;
  unit?: string;
  format?: (v: number) => string;
  onSave: (v: number) => void;
}

export function TargetSheet({ config, onClose }: { config: TargetConfig | null; onClose: () => void }) {
  const [value, setValue] = useState(config?.value ?? 0);
  // Reset the draft whenever a different target is opened (adjust-during-render pattern).
  const [openedFor, setOpenedFor] = useState(config);
  if (config !== openedFor) {
    setOpenedFor(config);
    if (config) setValue(config.value);
  }
  return (
    <BottomSheet
      visible={!!config}
      onClose={onClose}
      title={config?.title}
      footer={
        <Button
          label="Save"
          onPress={() => {
            config?.onSave(value);
            onClose();
          }}
        />
      }
    >
      {config ? (
        <Stepper label={config.title} value={value} onChange={setValue} step={config.step} min={config.min} max={config.max} unit={config.unit} format={config.format} />
      ) : null}
    </BottomSheet>
  );
}
