import React from 'react';
import {
  Box,
  Stack,
  Heading,
  Text,
  Button,
  SectionMessage,
  Label,
  Textfield,
  Inline,
} from '@forge/react';
import type { TrackLinkEntry } from '../../types';
import type { TrackSelectionPayload } from '../types/track-selection';
import { formatTrackLinkLabel } from '../utils/track-link-label';
import { panelSurfaceXcss } from '../styles/shell-xcss';

export interface IssueLinkPanelProps {
  issueKey?: string;
  trackName: string;
  selectedSection: TrackSelectionPayload | null;
  links: TrackLinkEntry[];
  linkCount: number;
  maxLinks: number;
  canAddLink: boolean;
  selectedLinkId?: string;
  isLinking: boolean;
  isCreatingSubtask: boolean;
  subtaskSummary: string;
  onSubtaskSummaryChange: (value: string) => void;
  onLinkToIssue: () => void;
  onCreateSubtask: () => void;
  onSelectLink: (linkId: string) => void;
}

export const IssueLinkPanel = ({
  issueKey,
  trackName,
  selectedSection,
  links,
  linkCount,
  maxLinks,
  canAddLink,
  selectedLinkId,
  isLinking,
  isCreatingSubtask,
  subtaskSummary,
  onSubtaskSummaryChange,
  onLinkToIssue,
  onCreateSubtask,
  onSelectLink,
}: IssueLinkPanelProps): React.JSX.Element => {
  const hasSelection = Boolean(selectedSection?.trackRelative);
  const atCap = !canAddLink;
  const linkDisabled = !issueKey || !hasSelection || atCap || isLinking || isCreatingSubtask;

  return (
    <Box xcss={panelSurfaceXcss}>
      <Stack space="space.200">
        <Heading size="medium">
          {issueKey ? `Link track section — ${issueKey}` : 'Link track section'}
        </Heading>

        {!issueKey && (
          <SectionMessage appearance="warning" title="Issue context unavailable">
            <Text>Open this app from a Jira issue action to link segments to the current issue.</Text>
          </SectionMessage>
        )}

        {issueKey && (
          <Text>
            Linked segments: {linkCount}/{maxLinks}
          </Text>
        )}

        {atCap && issueKey && (
          <SectionMessage appearance="warning" title="Link limit reached">
            <Text>
              This issue already has {maxLinks} track links. Remove links in a future release or link
              on a subtask instead.
            </Text>
          </SectionMessage>
        )}

        {!hasSelection && issueKey && (
          <SectionMessage appearance="information" title="Brush a section">
            <Text>Switch to Brush Select, drag on the circuit, then link to this issue.</Text>
          </SectionMessage>
        )}

        <Inline space="space.100" alignBlock="center">
          <Button
            appearance="primary"
            onClick={onLinkToIssue}
            isDisabled={linkDisabled}
          >
            {isLinking ? 'Linking…' : issueKey ? `Link to ${issueKey}` : 'Link to issue'}
          </Button>
        </Inline>

        {links.length > 0 && (
          <Stack space="space.100">
            <Heading size="small">Saved segments</Heading>
            {links.map((link) => (
              <Button
                key={link.linkId}
                appearance={selectedLinkId === link.linkId ? 'primary' : 'subtle'}
                onClick={() => onSelectLink(link.linkId)}
              >
                {formatTrackLinkLabel(link, trackName)}
              </Button>
            ))}
          </Stack>
        )}

        <Stack space="space.150">
          <Heading size="small">Create subtask from selection</Heading>
          <Stack space="space.050">
            <Label labelFor="tracklink-subtask-summary">Subtask summary</Label>
            <Textfield
              id="tracklink-subtask-summary"
              placeholder={`${trackName} track section`}
              value={subtaskSummary}
              onChange={(e) =>
                onSubtaskSummaryChange(
                  String((e as { target?: { value?: string } }).target?.value ?? ''),
                )
              }
              isDisabled={isCreatingSubtask || isLinking}
            />
          </Stack>
          <Button
            appearance="default"
            onClick={onCreateSubtask}
            isDisabled={!issueKey || !hasSelection || isCreatingSubtask || isLinking}
          >
            {isCreatingSubtask ? 'Creating subtask…' : 'Create subtask with segment'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};
