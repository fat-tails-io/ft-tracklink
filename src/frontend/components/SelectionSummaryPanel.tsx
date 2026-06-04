import React from 'react';
import { Box, Stack, Heading, Text, SectionMessage } from '@forge/react';
import type { SelectionSummary } from '../types/track-selection';
import { panelSurfaceXcss } from '../styles/shell-xcss';

export interface SelectionSummaryPanelProps {
  selectionSummary: SelectionSummary | null;
}

export const SelectionSummaryPanel = ({
  selectionSummary,
}: SelectionSummaryPanelProps): React.JSX.Element => (
  <Box xcss={panelSurfaceXcss}>
    <Stack space="space.200">
      <Heading size="medium">Selection summary</Heading>
      {selectionSummary ? (
        <Stack space="space.150">
          <Stack space="space.050">
            <Heading size="small">Viewport</Heading>
            <Text>{selectionSummary.viewport}</Text>
          </Stack>
          <Stack space="space.050">
            <Heading size="small">Screen coordinates</Heading>
            <Text>{selectionSummary.screen}</Text>
          </Stack>
          <Stack space="space.050">
            <Heading size="small">Segment (geo)</Heading>
            <Text>{selectionSummary.geo}</Text>
          </Stack>
          <Stack space="space.050">
            <Heading size="small">Along track</Heading>
            <Text>{selectionSummary.trackRelative}</Text>
          </Stack>
          <Stack space="space.050">
            <Heading size="small">Track properties</Heading>
            <Text>{selectionSummary.trackProps}</Text>
          </Stack>
        </Stack>
      ) : (
        <SectionMessage appearance="information" title="No selection yet">
          <Text>
            Switch to Brush Select above the map, then drag on the circuit to capture a section.
          </Text>
        </SectionMessage>
      )}
    </Stack>
  </Box>
);
