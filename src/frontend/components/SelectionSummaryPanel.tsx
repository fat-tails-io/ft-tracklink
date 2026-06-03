import React from 'react';
import { Box, Stack, Heading, Text } from '@forge/react';
import type { SelectionSummary } from '../types/track-selection';

const panelBorderXcss = {
  borderWidth: 'border.width',
  borderStyle: 'solid',
  borderColor: 'color.border',
  borderRadius: 'border.radius',
} as const;

export interface SelectionSummaryPanelProps {
  selectionSummary: SelectionSummary | null;
}

export const SelectionSummaryPanel = ({
  selectionSummary,
}: SelectionSummaryPanelProps): React.JSX.Element => (
  <Box padding="space.200" xcss={panelBorderXcss}>
    <Stack space="space.200">
      <Heading as="h3">Latest brush selection</Heading>
      {selectionSummary ? (
        <Stack space="space.100">
          <Text>Viewport: {selectionSummary.viewport}</Text>
          <Text>Screen: {selectionSummary.screen}</Text>
          <Text>Geo: {selectionSummary.geo}</Text>
          <Text>Track properties:</Text>
          <Text>{selectionSummary.trackProps}</Text>
        </Stack>
      ) : (
        <Text>No selection captured yet. Use Brush Select in the viewer to capture a section.</Text>
      )}
    </Stack>
  </Box>
);
