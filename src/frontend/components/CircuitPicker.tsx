import React, { useMemo } from 'react';
import { Select, Stack } from '@forge/react';
import type { CircuitSummary } from '../../types';

type SelectOption = {
  label: string;
  value: string;
};

export interface CircuitPickerProps {
  circuits: CircuitSummary[];
  selectedCircuitId: string | undefined;
  isDisabled?: boolean;
  onCircuitChange: (circuitId: string) => void;
}

export const CircuitPicker = ({
  circuits,
  selectedCircuitId,
  isDisabled = false,
  onCircuitChange,
}: CircuitPickerProps): React.JSX.Element | null => {
  const options = useMemo(
    () =>
      circuits.map((circuit) => ({
        label: `${circuit.name} (${circuit.location})`,
        value: circuit.id,
      })),
    [circuits],
  );

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === selectedCircuitId) ?? options[0],
    [options, selectedCircuitId],
  );

  if (circuits.length === 0) {
    return null;
  }

  return (
    <Stack space="space.100">
      <Select
        name="circuit"
        placeholder="Select a circuit"
        options={options}
        onChange={(option: SelectOption | SelectOption[]) => {
          const picked = Array.isArray(option) ? option[0] : option;
          if (picked?.value) {
            onCircuitChange(String(picked.value));
          }
        }}
        isDisabled={isDisabled || options.length === 0}
        {...(selectedOption ? { value: selectedOption } : {})}
      />
    </Stack>
  );
};
