import React from 'react';
import { Box, Text } from '@forge/react';
import { subtleTextXcss } from '../styles/shell-xcss';

export interface ViewerStatusLineProps {
  status: string;
}

export const ViewerStatusLine = ({ status }: ViewerStatusLineProps): React.JSX.Element => (
  <Box xcss={subtleTextXcss}>
    <Text>{status}</Text>
  </Box>
);
