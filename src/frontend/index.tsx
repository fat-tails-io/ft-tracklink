import React, { useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  Box,
  Stack,
  Inline,
  Spinner,
  Heading,
  Text,
  Button,
  Frame,
  Textfield,
  TextArea,
} from '@forge/react';
import { invoke, events, showFlag } from '@forge/bridge';
import { GeoJsonUploadModal } from './components/GeoJsonUploadModal';
import type {
  GetTrackGeoJsonResponse,
  TrackViewport,
} from '../types';

type TrackSelectionPayload = {
  viewport: TrackViewport;
  screenCoords: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  geoCoords: {
    topLeft?: [number, number] | null;
    bottomRight?: [number, number] | null;
  };
  trackProperties?: Record<string, unknown>;
  thumbnailData?: string;
};

type IssueFormState = {
  projectKey: string;
  issueType: string;
  summary: string;
  description: string;
};

const App = (): React.JSX.Element => {
  const [loading, setLoading] = useState<boolean>(true);
  const [trackLoaded, setTrackLoaded] = useState<boolean>(false);
  const [trackName, setTrackName] = useState<string>('');
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [frameReady, setFrameReady] = useState<boolean>(false);
  const [pendingGeoJson, setPendingGeoJson] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<TrackSelectionPayload | null>(null);
  const [issueForm, setIssueForm] = useState<IssueFormState>({
    projectKey: '',
    issueType: 'Task',
    summary: '',
    description: '',
  });
  const [isCreatingIssue, setIsCreatingIssue] = useState<boolean>(false);

  // Listen for Frame ready signal
  useEffect(() => {
    let subscription: Promise<{ unsubscribe: () => void }> | null = null;
    
    const setupListener = async (): Promise<void> => {
      subscription = events.on('FRAME_READY', () => {
        console.log('Frame ready signal received');
        setFrameReady(true);
        // If we have pending GeoJSON, send it now
        if (pendingGeoJson) {
          console.log('Sending pending GeoJSON to Frame component');
          events.emit('GEOJSON_LOAD', { geoJsonContent: pendingGeoJson });
          setPendingGeoJson(null);
        }
      });
    console.log('GOT HERE!');
    };
    
    setupListener();
    
    return () => {
      if (subscription) {
        subscription.then(({ unsubscribe }) => unsubscribe());
      }
    };
  }, [pendingGeoJson]);

  // Listen for brush selections emitted by Frame
  useEffect(() => {
    let subscription: Promise<{ unsubscribe: () => void }> | null = null;

    const registerSelectionListener = async (): Promise<void> => {
      subscription = events.on('TRACK_SECTION_SELECTED', (eventData) => {
        const payload = eventData as TrackSelectionPayload;
        setSelectedSection(payload);
        setIssueForm((prev) => ({
          ...prev,
          summary: prev.summary || `Track section - ${trackName || 'Track'}`,
        }));
        showFlag({
          id: 'track-section-captured',
          title: 'Track section captured',
          type: 'info',
          description: 'Review the selection details below and create an issue when ready.',
          isAutoDismiss: true,
        });
      });
    };

    registerSelectionListener();

    return () => {
      if (subscription) {
        subscription.then(({ unsubscribe }) => unsubscribe());
      }
    };
  }, [trackName]);

  const loadTrack = async (): Promise<void> => {
    try {
      const trackData = await invoke<GetTrackGeoJsonResponse | null>('getTrackGeoJson', {});
      if (trackData?.geoJsonContent) {
        // Parse GeoJSON if it's a string
        const geoJsonContent = typeof trackData.geoJsonContent === 'string'
          ? JSON.parse(trackData.geoJsonContent)
          : trackData.geoJsonContent;
        
        console.log('Loaded GeoJSON from storage:', {
          type: geoJsonContent.type,
          featureCount: geoJsonContent.type === 'FeatureCollection' ? geoJsonContent.features?.length : 1
        });
        
        setTrackLoaded(true);
        setTrackName(trackData.trackName);
        
        // Send to Frame component when ready, or store for later
        if (frameReady) {
          console.log('Frame is ready, sending GeoJSON immediately');
          events.emit('GEOJSON_LOAD', { geoJsonContent });
        } else {
          console.log('Frame not ready yet, storing GeoJSON for later');
          setPendingGeoJson(geoJsonContent);
        }
      } else {
        setTrackLoaded(false);
      }
    } catch (error) {
      console.log('No track loaded yet:', error);
      setTrackLoaded(false);
    }
  };

  useEffect(() => {
    const initializeApp = async (): Promise<void> => {
      try {
        await loadTrack();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleReset = (): void => {
    events.emit('TRACK_RESET', {});
    setSelectedSection(null);
  };

  const handleIssueFieldChange = (field: keyof IssueFormState, value: string): void => {
    setIssueForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatSelectionDetails = (selection: TrackSelectionPayload): string => {
    const { viewport, screenCoords, geoCoords, trackProperties } = selection;
    const trackPropsText = trackProperties ? JSON.stringify(trackProperties, null, 2) : 'None supplied';
    const geoTopLeft = geoCoords.topLeft ? geoCoords.topLeft.map((coord) => coord?.toFixed(4)).join(', ') : 'N/A';
    const geoBottomRight = geoCoords.bottomRight ? geoCoords.bottomRight.map((coord) => coord?.toFixed(4)).join(', ') : 'N/A';

    return [
      'Track section details:',
      `• Viewport -> x: ${viewport.x.toFixed(2)}, y: ${viewport.y.toFixed(2)}, width: ${viewport.width.toFixed(2)}, height: ${viewport.height.toFixed(2)}, scale: ${viewport.scale.toFixed(2)}`,
      `• Screen -> x: ${Math.round(screenCoords.x)}, y: ${Math.round(screenCoords.y)}, width: ${Math.round(screenCoords.width)}, height: ${Math.round(screenCoords.height)}`,
      `• Geo -> top left: ${geoTopLeft} | bottom right: ${geoBottomRight}`,
      `• Track properties -> ${trackPropsText}`,
    ].join('\n');
  };

  const handleCreateIssue = async (): Promise<void> => {
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

      const response = await invoke('createTrackIssue', {
        projectKey: issueForm.projectKey.trim(),
        issueType: issueForm.issueType.trim(),
        summary: issueForm.summary.trim(),
        description: combinedDescription || undefined,
        viewport: selectedSection.viewport,
        thumbnailData: selectedSection.thumbnailData || '',
      });

      const result = response as { issueKey: string };
      showFlag({
        id: 'issue-create-success',
        title: 'Issue created',
        type: 'success',
        description: `Created Jira issue ${result.issueKey}`,
        isAutoDismiss: true,
      });
      setSelectedSection(null);
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
  };

  const selectionSummary = useMemo(() => {
    if (!selectedSection) {
      return null;
    }

    const { viewport, screenCoords, geoCoords } = selectedSection;
    return {
      viewport: `x: ${viewport.x.toFixed(2)}, y: ${viewport.y.toFixed(2)}, width: ${viewport.width.toFixed(2)}, height: ${viewport.height.toFixed(2)}, scale: ${viewport.scale.toFixed(2)}`,
      screen: `x: ${Math.round(screenCoords.x)}, y: ${Math.round(screenCoords.y)}, width: ${Math.round(screenCoords.width)}, height: ${Math.round(screenCoords.height)}`,
      geo: `Top left: ${geoCoords.topLeft ? geoCoords.topLeft.map((coord) => coord?.toFixed(4)).join(', ') : 'N/A'} | Bottom right: ${geoCoords.bottomRight ? geoCoords.bottomRight.map((coord) => coord?.toFixed(4)).join(', ') : 'N/A'}`,
      trackProps: selectedSection.trackProperties ? JSON.stringify(selectedSection.trackProperties, null, 2) : 'None supplied',
    };
  }, [selectedSection]);

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
    <Box padding="space.400">
      <Stack space="space.300">
        <Stack space="space.200">
          <Heading as="h1">F1 Track Linker</Heading>
          {trackLoaded && trackName && (
            <Text>Track: {trackName}</Text>
          )}
          <Inline space="space.100">
            <Button onClick={() => setUploadModalOpen(true)} appearance="primary">
              {trackLoaded ? 'Replace Track' : 'Upload Track GeoJSON'}
            </Button>
            {trackLoaded && (
              <Button onClick={handleReset} appearance="default">
                Reset View
              </Button>
            )}
          </Inline>
        </Stack>
        {!trackLoaded && (
          <Box padding="space.200" backgroundColor="color.background.warning">
            <Text>No track loaded. Please upload a track GeoJSON file.</Text>
          </Box>
        )}
        <Box
          xcss={{
            width: '100%',
            height: '600px',
            borderWidth: 'border.width',
            borderStyle: 'solid',
            borderColor: 'color.border',
            borderRadius: 'border.radius',
          }}
        >
          <Frame resource="track-viewer" />
        </Box>

        <GeoJsonUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={async () => {
            await loadTrack();
          }}
        />

        <Box
          padding="space.200"
          xcss={{
            borderWidth: 'border.width',
            borderStyle: 'solid',
            borderColor: 'color.border',
            borderRadius: 'border.radius',
          }}
        >
          <Stack space="space.200">
            <Heading as="h3">Latest brush selection</Heading>
            {selectionSummary ? (
              <Stack space="space.100">
                <Text>Viewport: {selectionSummary.viewport}</Text>
                <Text>Screen: {selectionSummary.screen}</Text>
                <Text>Geo: {selectionSummary.geo}</Text>
                <Text>Track properties:</Text>
                <Text>{selectionSummary.trackProps}</Text>
              </Stack>
            ) : (
              <Text>No selection captured yet. Use Brush Select in the viewer to capture a section.</Text>
            )}
          </Stack>
        </Box>

        <Box
          padding="space.200"
          xcss={{
            borderWidth: 'border.width',
            borderStyle: 'solid',
            borderColor: 'color.border',
            borderRadius: 'border.radius',
          }}
        >
          <Stack space="space.200">
            <Heading as="h3">Create Jira issue from selection</Heading>
            <Stack space="space.100">
              <Text>Project key</Text>
              <Textfield
                placeholder="e.g. F1TRACK"
                value={issueForm.projectKey}
                onChange={(e) => handleIssueFieldChange('projectKey', e.target.value)}
                isDisabled={isCreatingIssue}
              />
              <Text>Issue type</Text>
              <Textfield
                placeholder="e.g. Task"
                value={issueForm.issueType}
                onChange={(e) => handleIssueFieldChange('issueType', e.target.value)}
                isDisabled={isCreatingIssue}
              />
              <Text>Summary</Text>
              <Textfield
                placeholder="Summary"
                value={issueForm.summary}
                onChange={(e) => handleIssueFieldChange('summary', e.target.value)}
                isDisabled={isCreatingIssue}
              />
              <Text>Description</Text>
              <TextArea
                placeholder="Optional description"
                value={issueForm.description}
                onChange={(e) => handleIssueFieldChange('description', e.target.value)}
                isDisabled={isCreatingIssue}
                minimumRows={4}
              />
            </Stack>

            <Inline space="space.100">
              <Button
                appearance="primary"
                onClick={handleCreateIssue}
                isDisabled={isCreatingIssue || !selectedSection}
              >
                {isCreatingIssue ? <Spinner size="small" /> : 'Create Jira Issue'}
              </Button>
              {selectedSection && (
                <Button
                  appearance="subtle"
                  onClick={() => setSelectedSection(null)}
                  isDisabled={isCreatingIssue}
                >
                  Clear selection
                </Button>
              )}
            </Inline>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
