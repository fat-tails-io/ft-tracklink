import React, { useEffect } from 'react';
import { Box, Stack, Spinner, Text } from '@forge/react';
import { TrackLinkerShell } from './TrackLinkerShell';
import { SelectionSummaryPanel } from './components/SelectionSummaryPanel';
import { CreateIssuePanel } from './components/CreateIssuePanel';
import { useTrackLinkerCore } from './hooks/useTrackLinkerCore';
import { useCreateIssueFromSelection } from './hooks/useCreateIssueFromSelection';
import { useIssueProductContext } from './hooks/useIssueProductContext';

export const IssueTrackLinker = (): React.JSX.Element => {
  const { issueKey, projectKey } = useIssueProductContext();

  const {
    loading,
    trackLoaded,
    trackName,
    uploadModalOpen,
    setUploadModalOpen,
    selectedSection,
    setSelectedSection,
    selectionSummary,
    loadTrack,
    handleReset,
  } = useTrackLinkerCore();

  const {
    issueForm,
    setIssueForm,
    isCreatingIssue,
    handleIssueFieldChange,
    applyDefaultSummary,
    handleCreateIssue,
  } = useCreateIssueFromSelection({
    trackName,
    onIssueCreated: () => setSelectedSection(null),
  });

  useEffect(() => {
    if (projectKey) {
      setIssueForm((prev) => ({
        ...prev,
        projectKey,
      }));
    }
  }, [projectKey, setIssueForm]);

  useEffect(() => {
    if (selectedSection) {
      applyDefaultSummary();
    }
  }, [selectedSection, applyDefaultSummary]);

  if (loading) {
    return (
      <Box padding="space.400">
        <Stack space="space.200" alignInline="center">
          <Spinner />
          <Text>Loading track viewer...</Text>
        </Stack>
      </Box>
    );
  }

  const title = issueKey ? `Track Linker — ${issueKey}` : 'Track Linker';

  const contextBanner = (
    <Stack space="space.100">
      {issueKey && <Text>Current issue: {issueKey}</Text>}
      {projectKey && <Text>Project: {projectKey}</Text>}
      {!issueKey && (
        <Text>Issue context is loading. Link-to-current flows arrive in Phase 5.</Text>
      )}
    </Stack>
  );

  return (
    <TrackLinkerShell
      title={title}
      trackLoaded={trackLoaded}
      trackName={trackName}
      uploadModalOpen={uploadModalOpen}
      onOpenUpload={() => setUploadModalOpen(true)}
      onCloseUpload={() => setUploadModalOpen(false)}
      onUploadSuccess={() => {
        void loadTrack();
      }}
      onReset={handleReset}
      showTrackAdminControls
      contextBanner={contextBanner}
    >
      <SelectionSummaryPanel selectionSummary={selectionSummary} />
      <CreateIssuePanel
        issueForm={issueForm}
        selectedSection={selectedSection}
        isCreatingIssue={isCreatingIssue}
        projectKeyReadOnly={Boolean(projectKey)}
        heading="Create linked issue from selection"
        onFieldChange={handleIssueFieldChange}
        onCreateIssue={() => {
          void handleCreateIssue(selectedSection);
        }}
        onClearSelection={() => setSelectedSection(null)}
      />
    </TrackLinkerShell>
  );
};
