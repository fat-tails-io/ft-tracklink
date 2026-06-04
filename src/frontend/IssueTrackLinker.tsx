import React, { useEffect, useRef } from 'react';
import { useProductContext } from '@forge/react';
import { TrackLinkerShell } from './TrackLinkerShell';
import { SelectionSummaryPanel } from './components/SelectionSummaryPanel';
import { TrackLinkerLoading } from './components/TrackLinkerLoading';
import { IssueContextBanner } from './components/IssueContextBanner';
import { IssueLinkPanel } from './components/IssueLinkPanel';
import { useTrackLinkerCore } from './hooks/useTrackLinkerCore';
import { useIssueProductContext } from './hooks/useIssueProductContext';
import { useIssueTrackContext } from './hooks/useIssueTrackContext';
import { useIssueTrackActions } from './hooks/useIssueTrackActions';
import { resolveCircuitIdFromLinks } from './utils/issue-circuit-bootstrap';

export const IssueTrackLinker = (): React.JSX.Element => {
  const { issueKey, projectKey } = useIssueProductContext();
  const productContext = useProductContext();
  const accountId = (productContext as { accountId?: string } | undefined)?.accountId;

  const issueBootstrapDoneRef = useRef(false);
  const userPickedCircuitRef = useRef(false);

  const {
    loading: coreLoading,
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
    highlightSavedLink,
  } = useTrackLinkerCore({ accountId });

  const {
    loading: contextLoading,
    summary,
    links,
    linkCount,
    maxLinks,
    canAddLink,
    selectedLinkId,
    setSelectedLinkId,
    refresh: refreshIssueContext,
  } = useIssueTrackContext({ issueKey });

  const {
    isLinking,
    isCreatingSubtask,
    subtaskSummary,
    setSubtaskSummary,
    handleLinkToIssue,
    handleCreateSubtask,
  } = useIssueTrackActions({
    issueKey,
    projectKey,
    trackName,
    circuitId: selectedCircuitId,
    onSuccess: async () => {
      setSelectedSection(null);
      await refreshIssueContext();
    },
  });

  /**
   * Once core + issue context are ready: load the track for the most recent saved
   * segment (if any). Does not run again when the user changes the circuit picker.
   */
  useEffect(() => {
    if (!issueKey || contextLoading || coreLoading || circuits.length === 0) {
      return;
    }
    if (issueBootstrapDoneRef.current) {
      return;
    }
    issueBootstrapDoneRef.current = true;

    const circuitFromLinks = resolveCircuitIdFromLinks(links, circuits);
    if (!circuitFromLinks || userPickedCircuitRef.current) {
      return;
    }

    if (circuitFromLinks !== selectedCircuitId) {
      void selectCircuit(circuitFromLinks);
    } else if (!trackLoaded) {
      void loadTrack(circuitFromLinks);
    }
  }, [
    issueKey,
    contextLoading,
    coreLoading,
    circuits,
    links,
    selectedCircuitId,
    trackLoaded,
    selectCircuit,
    loadTrack,
  ]);

  useEffect(() => {
    if (!trackLoaded || contextLoading) {
      return;
    }

    const link = links.find((l) => l.linkId === selectedLinkId);
    if (link?.trackRelative) {
      highlightSavedLink(link);
    }
  }, [trackLoaded, contextLoading, links, selectedLinkId, highlightSavedLink]);

  const handleResetAll = (): void => {
    handleReset();
    setSelectedSection(null);
    highlightSavedLink(null);
  };

  const handleSelectLink = (linkId: string): void => {
    setSelectedLinkId(linkId);
    const link = links.find((l) => l.linkId === linkId);
    if (!link) {
      return;
    }

    const catalogCircuit = resolveCircuitIdFromLinks([link], circuits);
    if (catalogCircuit && catalogCircuit !== selectedCircuitId) {
      void selectCircuit(catalogCircuit);
      return;
    }
    if (link.trackRelative) {
      highlightSavedLink(link);
    }
  };

  const handleCircuitChange = (circuitId: string): void => {
    userPickedCircuitRef.current = true;
    setSelectedSection(null);
    void selectCircuit(circuitId);
  };

  const handleLinkSuccess = (): void => {
    void (async () => {
      await handleLinkToIssue(selectedSection);
    })();
  };

  const handleSubtaskSuccess = (): void => {
    void (async () => {
      await handleCreateSubtask(selectedSection);
    })();
  };

  if (coreLoading || (issueKey && contextLoading)) {
    return <TrackLinkerLoading />;
  }

  const pageHeading = issueKey ? `Track Linker — ${issueKey}` : 'Track Linker';

  return (
    <TrackLinkerShell
      pageHeading={pageHeading}
      trackLoaded={trackLoaded}
      trackName={trackName}
      circuits={circuits}
      selectedCircuitId={selectedCircuitId}
      onCircuitChange={handleCircuitChange}
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
      contextBanner={
        <IssueContextBanner issueKey={issueKey} projectKey={projectKey} issueSummary={summary} />
      }
    >
      <SelectionSummaryPanel selectionSummary={selectionSummary} />
      <IssueLinkPanel
        issueKey={issueKey}
        trackName={trackName}
        selectedSection={selectedSection}
        links={links}
        linkCount={linkCount}
        maxLinks={maxLinks}
        canAddLink={canAddLink}
        selectedLinkId={selectedLinkId}
        isLinking={isLinking}
        isCreatingSubtask={isCreatingSubtask}
        subtaskSummary={subtaskSummary}
        onSubtaskSummaryChange={setSubtaskSummary}
        onLinkToIssue={handleLinkSuccess}
        onCreateSubtask={handleSubtaskSuccess}
        onSelectLink={handleSelectLink}
      />
    </TrackLinkerShell>
  );
};
