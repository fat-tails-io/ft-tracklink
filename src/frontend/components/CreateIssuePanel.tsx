import React from 'react';
import {
  Box,
  Stack,
  Inline,
  Heading,
  Text,
  Button,
  Textfield,
  TextArea,
  Spinner,
  Label,
  SectionMessage,
} from '@forge/react';
import type { IssueFormState } from '../types/track-selection';
import type { TrackSelectionPayload } from '../types/track-selection';
import { panelSurfaceXcss } from '../styles/shell-xcss';

export interface CreateIssuePanelProps {
  issueForm: IssueFormState;
  selectedSection: TrackSelectionPayload | null;
  isCreatingIssue: boolean;
  projectKeyReadOnly?: boolean;
  heading?: string;
  onFieldChange: (field: keyof IssueFormState, value: string) => void;
  onCreateIssue: () => void;
  onClearSelection: () => void;
}

export const CreateIssuePanel = ({
  issueForm,
  selectedSection,
  isCreatingIssue,
  projectKeyReadOnly = false,
  heading = 'Create Jira issue from selection',
  onFieldChange,
  onCreateIssue,
  onClearSelection,
}: CreateIssuePanelProps): React.JSX.Element => (
  <Box xcss={panelSurfaceXcss}>
    <Stack space="space.200">
      <Heading size="medium">{heading}</Heading>

      {!selectedSection && (
        <SectionMessage appearance="warning" title="Selection required">
          <Text>Brush-select a track section before creating an issue.</Text>
        </SectionMessage>
      )}

      <Stack space="space.150">
        <Stack space="space.050">
          <Label labelFor="tracklink-project-key">Project key</Label>
          <Textfield
            id="tracklink-project-key"
            placeholder="e.g. FT"
            value={issueForm.projectKey}
            onChange={(e) =>
              onFieldChange('projectKey', String((e as { target?: { value?: string } }).target?.value ?? ''))
            }
            isDisabled={isCreatingIssue || projectKeyReadOnly}
          />
        </Stack>
        <Stack space="space.050">
          <Label labelFor="tracklink-issue-type">Issue type</Label>
          <Textfield
            id="tracklink-issue-type"
            placeholder="e.g. Task"
            value={issueForm.issueType}
            onChange={(e) =>
              onFieldChange('issueType', String((e as { target?: { value?: string } }).target?.value ?? ''))
            }
            isDisabled={isCreatingIssue}
          />
        </Stack>
        <Stack space="space.050">
          <Label labelFor="tracklink-summary">Summary</Label>
          <Textfield
            id="tracklink-summary"
            placeholder="Summary"
            value={issueForm.summary}
            onChange={(e) =>
              onFieldChange('summary', String((e as { target?: { value?: string } }).target?.value ?? ''))
            }
            isDisabled={isCreatingIssue}
          />
        </Stack>
        <Stack space="space.050">
          <Label labelFor="tracklink-description">Description</Label>
          <TextArea
            id="tracklink-description"
            name="tracklink-description"
            placeholder="Optional description"
            value={issueForm.description}
            onChange={(e) =>
              onFieldChange('description', String((e as { target?: { value?: string } }).target?.value ?? ''))
            }
            isDisabled={isCreatingIssue}
            minimumRows={4}
          />
        </Stack>
      </Stack>

      <Inline space="space.100">
        <Button
          appearance="primary"
          onClick={() => {
            onCreateIssue();
          }}
          isDisabled={isCreatingIssue || !selectedSection}
        >
          {isCreatingIssue ? <Spinner size="small" /> : 'Create Jira issue'}
        </Button>
        {selectedSection && (
          <Button appearance="subtle" onClick={onClearSelection} isDisabled={isCreatingIssue}>
            Clear selection
          </Button>
        )}
      </Inline>
    </Stack>
  </Box>
);
