import React, { useEffect } from 'react';
import { useProductContext } from '@forge/react';
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
  const productContext = useProductContext();
  const accountId = (productContext as { accountId?: string } | undefined)?.accountId;

  const {
    loading,
    trackLoaded,
    trackName,
    circuits,
    selectedCircuitId,
    uploadModalOpen,
    setUploadModalOpen,
    selectedSection,
    setSelectedSection,
    selectionSummary,
    viewerMode,
    viewerStatus,
    setViewerMode,
    loadTrack,
    selectCircuit,
    refreshCatalog,
    handleReset,
  } = useTrackLinkerCore({ accountId });

  const {
    issueForm,
    isCreatingIssue,
    handleIssueFieldChange,
    resetIssueForm,
    syncFormToSelection,
    handleCreateIssue,
  } = useCreateIssueFromSelection({
    trackName,
    defaultProjectKey: projectKey,
    onIssueCreated: () => setSelectedSection(null),
  });

  useEffect(() => {
    if (selectedSection) {
      syncFormToSelection();
    }
  }, [selectedSection, syncFormToSelection]);

  const handleResetAll = (): void => {
    handleReset();
    resetIssueForm();
  };

  if (loading) {
    return <TrackLinkerLoading />;
  }

  const pageHeading = issueKey ? `Link track section — ${issueKey}` : 'Link track section';

  return (
    <TrackLinkerShell
      pageHeading={pageHeading}
      trackLoaded={trackLoaded}
      trackName={trackName}
      circuits={circuits}
      selectedCircuitId={selectedCircuitId}
      catalogLoading={loading}
      onCircuitChange={(circuitId) => {
        resetIssueForm();
        void selectCircuit(circuitId);
      }}
      uploadModalOpen={uploadModalOpen}
      viewerMode={viewerMode}
      viewerStatus={viewerStatus}
      onOpenUpload={() => setUploadModalOpen(true)}
      onCloseUpload={() => setUploadModalOpen(false)}
      onUploadSuccess={() => {
        void (async () => {
          const activeId = await refreshCatalog();
          await loadTrack(activeId ?? selectedCircuitId);
        })();
      }}
      onReset={handleResetAll}
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
        onClearSelection={() => {
          setSelectedSection(null);
          resetIssueForm();
        }}
      />
    </TrackLinkerShell>
  );
};
