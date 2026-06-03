import React, { useEffect } from 'react';
import { Box, Stack, Spinner, Text } from '@forge/react';
import { TrackLinkerShell } from './TrackLinkerShell';
import { SelectionSummaryPanel } from './components/SelectionSummaryPanel';
import { CreateIssuePanel } from './components/CreateIssuePanel';
import { useTrackLinkerCore } from './hooks/useTrackLinkerCore';
import { useCreateIssueFromSelection } from './hooks/useCreateIssueFromSelection';

export const GlobalTrackLinker = (): React.JSX.Element => {
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
    isCreatingIssue,
    handleIssueFieldChange,
    applyDefaultSummary,
    handleCreateIssue,
  } = useCreateIssueFromSelection({
    trackName,
    onIssueCreated: () => setSelectedSection(null),
  });

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

  return (
    <TrackLinkerShell
      title="F1 Track Linker"
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
    >
      <SelectionSummaryPanel selectionSummary={selectionSummary} />
      <CreateIssuePanel
        issueForm={issueForm}
        selectedSection={selectedSection}
        isCreatingIssue={isCreatingIssue}
        onFieldChange={handleIssueFieldChange}
        onCreateIssue={() => {
          void handleCreateIssue(selectedSection);
        }}
        onClearSelection={() => setSelectedSection(null)}
      />
    </TrackLinkerShell>
  );
};
