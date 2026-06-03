import React, { useEffect } from 'react';
import { useProductContext } from '@forge/react';
import { TrackLinkerShell } from './TrackLinkerShell';
import { SelectionSummaryPanel } from './components/SelectionSummaryPanel';
import { CreateIssuePanel } from './components/CreateIssuePanel';
import { TrackLinkerLoading } from './components/TrackLinkerLoading';
import { useTrackLinkerCore } from './hooks/useTrackLinkerCore';
import { useCreateIssueFromSelection } from './hooks/useCreateIssueFromSelection';

export const GlobalTrackLinker = (): React.JSX.Element => {
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

  return (
    <TrackLinkerShell
      pageHeading="Circuit map"
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
        onClearSelection={() => {
          setSelectedSection(null);
          resetIssueForm();
        }}
      />
    </TrackLinkerShell>
  );
};
