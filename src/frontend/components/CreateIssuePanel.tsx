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
} from '@forge/react';
import type { IssueFormState } from '../types/track-selection';
import type { TrackSelectionPayload } from '../types/track-selection';

const panelBorderXcss = {
  borderWidth: 'border.width',
  borderStyle: 'solid',
  borderColor: 'color.border',
  borderRadius: 'border.radius',
} as const;

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
  <Box padding="space.200" xcss={panelBorderXcss}>
    <Stack space="space.200">
      <Heading as="h3">{heading}</Heading>
      <Stack space="space.100">
        <Text>Project key</Text>
        <Textfield
          placeholder="e.g. F1TRACK"
          value={issueForm.projectKey}
          onChange={(e) =>
            onFieldChange('projectKey', String((e as { target?: { value?: string } }).target?.value ?? ''))
          }
          isDisabled={isCreatingIssue || projectKeyReadOnly}
        />
        <Text>Issue type</Text>
        <Textfield
          placeholder="e.g. Task"
          value={issueForm.issueType}
          onChange={(e) =>
            onFieldChange('issueType', String((e as { target?: { value?: string } }).target?.value ?? ''))
          }
          isDisabled={isCreatingIssue}
        />
        <Text>Summary</Text>
        <Textfield
          placeholder="Summary"
          value={issueForm.summary}
          onChange={(e) =>
            onFieldChange('summary', String((e as { target?: { value?: string } }).target?.value ?? ''))
          }
          isDisabled={isCreatingIssue}
        />
        <Text>Description</Text>
        <TextArea
          placeholder="Optional description"
          value={issueForm.description}
          onChange={(e) =>
            onFieldChange('description', String((e as { target?: { value?: string } }).target?.value ?? ''))
          }
          isDisabled={isCreatingIssue}
          minimumRows={4}
        />
      </Stack>

      <Inline space="space.100">
        <Button
          appearance="primary"
          onClick={() => {
            onCreateIssue();
          }}
          isDisabled={isCreatingIssue || !selectedSection}
        >
          {isCreatingIssue ? <Spinner size="small" /> : 'Create Jira Issue'}
        </Button>
        {selectedSection && (
          <Button
            appearance="subtle"
            onClick={onClearSelection}
            isDisabled={isCreatingIssue}
          >
            Clear selection
          </Button>
        )}
      </Inline>
    </Stack>
  </Box>
);
