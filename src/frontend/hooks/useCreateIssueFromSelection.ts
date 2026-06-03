import { useCallback, useState } from 'react';
import { invoke, showFlag } from '@forge/bridge';
import type { CreateTrackIssueResponse } from '../../types';
import type { IssueFormState, TrackSelectionPayload } from '../types/track-selection';
import { formatSelectionDetails } from '../utils/selection-format';

export type UseCreateIssueFromSelectionOptions = {
  trackName: string;
  onIssueCreated?: () => void;
};

export const useCreateIssueFromSelection = ({
  trackName,
  onIssueCreated,
}: UseCreateIssueFromSelectionOptions) => {
  const [issueForm, setIssueForm] = useState<IssueFormState>({
    projectKey: '',
    issueType: 'Task',
    summary: '',
    description: '',
  });
  const [isCreatingIssue, setIsCreatingIssue] = useState<boolean>(false);

  const handleIssueFieldChange = useCallback((field: keyof IssueFormState, value: string): void => {
    setIssueForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const applyDefaultSummary = useCallback((): void => {
    setIssueForm((prev) => ({
      ...prev,
      summary: prev.summary || `Track section - ${trackName || 'Track'}`,
    }));
  }, [trackName]);

  const handleCreateIssue = useCallback(
    async (selectedSection: TrackSelectionPayload | null): Promise<void> => {
      if (!selectedSection) {
        showFlag({
          id: 'issue-create-no-selection',
          title: 'Select a track section first',
          type: 'warning',
          description: 'Use Brush Select to choose an area before creating an issue.',
          isAutoDismiss: true,
        });
        return;
      }

      if (!issueForm.projectKey.trim() || !issueForm.summary.trim() || !issueForm.issueType.trim()) {
        showFlag({
          id: 'issue-create-missing-fields',
          title: 'Missing required fields',
          type: 'error',
          description: 'Project key, issue type, and summary are required.',
          isAutoDismiss: true,
        });
        return;
      }

      setIsCreatingIssue(true);
      try {
        const selectionDetailsBlock = formatSelectionDetails(selectedSection);
        const userDescription = issueForm.description.trim();
        const combinedDescription = [userDescription, selectionDetailsBlock].filter(Boolean).join('\n\n');

        const result = await invoke<CreateTrackIssueResponse>('createTrackIssue', {
          projectKey: issueForm.projectKey.trim(),
          issueType: issueForm.issueType.trim(),
          summary: issueForm.summary.trim(),
          description: combinedDescription || undefined,
          viewport: selectedSection.viewport,
          thumbnailData: selectedSection.thumbnailData || '',
        });

        showFlag({
          id: 'issue-create-success',
          title: 'Issue created',
          type: 'success',
          description: `Created Jira issue ${result.issueKey}`,
          isAutoDismiss: true,
        });
        onIssueCreated?.();
      } catch (error) {
        console.error('Failed to create issue:', error);
        showFlag({
          id: 'issue-create-failed',
          title: 'Failed to create issue',
          type: 'error',
          description: error instanceof Error ? error.message : 'Unexpected error creating Jira issue',
          isAutoDismiss: false,
        });
      } finally {
        setIsCreatingIssue(false);
      }
    },
    [issueForm, onIssueCreated],
  );

  return {
    issueForm,
    setIssueForm,
    isCreatingIssue,
    handleIssueFieldChange,
    applyDefaultSummary,
    handleCreateIssue,
  };
};
