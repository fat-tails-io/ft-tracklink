import React from 'react';
import { Box, Stack, Spinner, Text } from '@forge/react';
import { subtleTextXcss } from '../styles/shell-xcss';

export const TrackLinkerLoading = (): React.JSX.Element => (
  <Box padding="space.400">
    <Stack space="space.200" alignInline="center">
      <Spinner />
      <Box xcss={subtleTextXcss}>
        <Text>Loading track viewer…</Text>
      </Box>
    </Stack>
  </Box>
);
