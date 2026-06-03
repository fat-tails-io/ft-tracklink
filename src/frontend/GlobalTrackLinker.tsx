import React, { useEffect } from 'react';
import { TrackLinkerShell } from './TrackLinkerShell';
import { SelectionSummaryPanel } from './components/SelectionSummaryPanel';
import { CreateIssuePanel } from './components/CreateIssuePanel';
import { TrackLinkerLoading } from './components/TrackLinkerLoading';
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
    viewerMode,
    viewerStatus,
    setViewerMode,
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
    return <TrackLinkerLoading />;
  }

  return (
    <TrackLinkerShell
      pageHeading="Circuit map"
      trackLoaded={trackLoaded}
      trackName={trackName}
      uploadModalOpen={uploadModalOpen}
      viewerMode={viewerMode}
      viewerStatus={viewerStatus}
      onOpenUpload={() => setUploadModalOpen(true)}
      onCloseUpload={() => setUploadModalOpen(false)}
      onUploadSuccess={() => {
        void loadTrack();
      }}
      onReset={handleReset}
      onViewerModeChange={setViewerMode}
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
