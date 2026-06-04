import React, { useState } from 'react';
import { Box, Stack, Text, SectionMessage, SectionMessageAction } from '@forge/react';
import { TRACK_DATA_ATTRIBUTION } from '../constants/track-data-attribution';
import { panelSurfaceXcss } from '../styles/shell-xcss';

export const DataAttributionNotice = (): React.JSX.Element => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box xcss={panelSurfaceXcss}>
      <SectionMessage
        appearance="information"
        title={TRACK_DATA_ATTRIBUTION.title}
        actions={[
          <SectionMessageAction
            key="toggle-attribution"
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded
              ? TRACK_DATA_ATTRIBUTION.collapseActionLabel
              : TRACK_DATA_ATTRIBUTION.expandActionLabel}
          </SectionMessageAction>,
        ]}
      >
        {expanded ? (
          <Stack space="space.100">
            {TRACK_DATA_ATTRIBUTION.layers.map((layer) => (
              <Text key={layer.id}>
                {layer.label}: {layer.credit}
              </Text>
            ))}
            <Text>{TRACK_DATA_ATTRIBUTION.disclaimer}</Text>
          </Stack>
        ) : (
          <Text>{TRACK_DATA_ATTRIBUTION.collapsedSummary}</Text>
        )}
      </SectionMessage>
    </Box>
  );
};
