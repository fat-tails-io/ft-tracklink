import { useCallback, useState } from 'react';
import { invoke, showFlag } from '@forge/bridge';
import type {
  CreateLinkedTrackIssueRequest,
  CreateLinkedTrackIssueResponse,
  LinkSelectionToIssueRequest,
  LinkSelectionToIssueResponse,
} from '../../types';
import type { TrackSelectionPayload } from '../types/track-selection';
import { buildDefaultSummary } from '../utils/issue-form-defaults';

export type UseIssueTrackActionsOptions = {
  issueKey?: string;
  projectKey?: string;
  trackName: string;
  circuitId?: string;
  onSuccess?: () => Promise<void> | void;
};

const selectionToLinkRequest = (
  issueKey: string,
  selection: TrackSelectionPayload,
  circuitId: string,
  circuitDisplayName?: string,
): LinkSelectionToIssueRequest => ({
  issueKey,
  circuitId,
  circuitDisplayName,
  viewport: selection.viewport,
  trackRelative: selection.trackRelative,
  geo: selection.geo,
  sampledPoints: selection.sampledPoints,
  thumbnailData: selection.thumbnailData,
});

export const useIssueTrackActions = ({
  issueKey,
  projectKey,
  trackName,
  circuitId,
  onSuccess,
}: UseIssueTrackActionsOptions) => {
  const [isLinking, setIsLinking] = useState(false);
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [subtaskSummary, setSubtaskSummary] = useState('');

  const handleLinkToIssue = useCallback(
    async (selection: TrackSelectionPayload | null): Promise<void> => {
      if (!issueKey) {
        showFlag({
          id: 'link-no-issue',
          title: 'Issue required',
          type: 'warning',
          description: 'Open Track Linker from a Jira issue to link a segment.',
          isAutoDismiss: true,
        });
        return;
      }

      if (!selection?.trackRelative) {
        showFlag({
          id: 'link-no-selection',
          title: 'Selection required',
          type: 'warning',
          description: 'Brush-select a track section before linking.',
          isAutoDismiss: true,
        });
        return;
      }

      const resolvedCircuitId = selection.circuitId ?? circuitId;
      if (!resolvedCircuitId) {
        showFlag({
          id: 'link-no-circuit',
          title: 'Circuit required',
          type: 'error',
          description: 'Could not determine circuit id for this selection.',
          isAutoDismiss: false,
        });
        return;
      }

      setIsLinking(true);
      try {
        const result = await invoke<LinkSelectionToIssueResponse>('linkSelectionToIssue', {
          ...selectionToLinkRequest(issueKey, selection, resolvedCircuitId, trackName),
        });

        showFlag({
          id: 'link-success',
          title: 'Track section linked',
          type: 'success',
          description: `Linked segment ${result.linkIndex + 1} to ${issueKey} (${result.linkCount}/${result.maxLinks}).`,
          isAutoDismiss: true,
        });
        await onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        showFlag({
          id: 'link-failed',
          title: 'Failed to link segment',
          type: 'error',
          description: message,
          isAutoDismiss: false,
        });
      } finally {
        setIsLinking(false);
      }
    },
    [issueKey, circuitId, trackName, onSuccess],
  );

  const handleCreateSubtask = useCallback(
    async (selection: TrackSelectionPayload | null): Promise<void> => {
      if (!issueKey || !projectKey) {
        showFlag({
          id: 'subtask-no-context',
          title: 'Issue context required',
          type: 'warning',
          description: 'Parent issue and project are required to create a subtask.',
          isAutoDismiss: true,
        });
        return;
      }

      if (!selection?.trackRelative) {
        showFlag({
          id: 'subtask-no-selection',
          title: 'Selection required',
          type: 'warning',
          description: 'Brush-select a track section first.',
          isAutoDismiss: true,
        });
        return;
      }

      const resolvedCircuitId = selection.circuitId ?? circuitId;
      if (!resolvedCircuitId) {
        showFlag({
          id: 'subtask-no-circuit',
          title: 'Circuit required',
          type: 'error',
          description: 'Could not determine circuit id for this selection.',
          isAutoDismiss: false,
        });
        return;
      }

      const summary =
        subtaskSummary.trim() || `${buildDefaultSummary(trackName)} (from ${issueKey})`;

      setIsCreatingSubtask(true);
      try {
        const payload: CreateLinkedTrackIssueRequest = {
          parentIssueKey: issueKey,
          projectKey,
          summary,
          circuitId: resolvedCircuitId,
          circuitDisplayName: trackName,
          viewport: selection.viewport,
          trackRelative: selection.trackRelative,
          geo: selection.geo,
          sampledPoints: selection.sampledPoints,
          thumbnailData: selection.thumbnailData,
        };

        const result = await invoke<CreateLinkedTrackIssueResponse>(
          'createLinkedTrackIssue',
          payload,
        );

        showFlag({
          id: 'subtask-success',
          title: 'Subtask created',
          type: 'success',
          description: `Created ${result.issueKey} with track segment linked.`,
          isAutoDismiss: true,
        });
        setSubtaskSummary('');
        await onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        showFlag({
          id: 'subtask-failed',
          title: 'Failed to create subtask',
          type: 'error',
          description: message,
          isAutoDismiss: false,
        });
      } finally {
        setIsCreatingSubtask(false);
      }
    },
    [issueKey, projectKey, trackName, circuitId, subtaskSummary, onSuccess],
  );

  return {
    isLinking,
    isCreatingSubtask,
    subtaskSummary,
    setSubtaskSummary,
    handleLinkToIssue,
    handleCreateSubtask,
  };
};
