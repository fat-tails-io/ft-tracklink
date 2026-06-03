import React, { useEffect } from 'react';
import { TrackLinkerShell } from './TrackLinkerShell';
import { SelectionSummaryPanel } from './components/SelectionSummaryPanel';
import { CreateIssuePanel } from './components/CreateIssuePanel';
import { TrackLinkerLoading } from './components/TrackLinkerLoading';
import { IssueContextBanner } from './components/IssueContextBanner';
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
    viewerMode,
    viewerStatus,
    setViewerMode,
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
    return <TrackLinkerLoading />;
  }

  const pageHeading = issueKey ? `Link track section — ${issueKey}` : 'Link track section';

  return (
    <TrackLinkerShell
      pageHeading={pageHeading}
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
      contextBanner={<IssueContextBanner issueKey={issueKey} projectKey={projectKey} />}
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
