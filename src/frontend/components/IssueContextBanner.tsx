import React from 'react';
import { Box, Stack, Text, SectionMessage } from '@forge/react';
import { trackMetaXcss } from '../styles/shell-xcss';

export interface IssueContextBannerProps {
  issueKey?: string;
  projectKey?: string;
  issueSummary?: string;
}

export const IssueContextBanner = ({
  issueKey,
  projectKey,
  issueSummary,
}: IssueContextBannerProps): React.JSX.Element => {
  if (!issueKey) {
    return (
      <SectionMessage appearance="warning" title="Issue context unavailable">
        <Text>
          Open Track Linker from a Jira issue action to link brush selections to that issue.
        </Text>
      </SectionMessage>
    );
  }

  return (
    <Stack space="space.100">
      <Box xcss={trackMetaXcss}>
        <Text>
          Current issue: {issueKey}
          {issueSummary ? ` — ${issueSummary}` : ''}
        </Text>
      </Box>
      {projectKey && (
        <Box xcss={trackMetaXcss}>
          <Text>Project: {projectKey}</Text>
        </Box>
      )}
    </Stack>
  );
};
