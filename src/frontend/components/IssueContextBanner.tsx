import React from 'react';
import { Box, Stack, Text, SectionMessage } from '@forge/react';
import { trackMetaXcss } from '../styles/shell-xcss';

export interface IssueContextBannerProps {
  issueKey?: string;
  projectKey?: string;
}

export const IssueContextBanner = ({
  issueKey,
  projectKey,
}: IssueContextBannerProps): React.JSX.Element => {
  if (!issueKey) {
    return (
      <SectionMessage appearance="warning" title="Issue context unavailable">
        <Text>
          Link-to-current-issue flows arrive in Phase 5. You can still brush-select and create a
          linked issue from this view.
        </Text>
      </SectionMessage>
    );
  }

  return (
    <Stack space="space.100">
      <Box xcss={trackMetaXcss}>
        <Text>Current issue: {issueKey}</Text>
      </Box>
      {projectKey && (
        <Box xcss={trackMetaXcss}>
          <Text>Project: {projectKey}</Text>
        </Box>
      )}
    </Stack>
  );
};
