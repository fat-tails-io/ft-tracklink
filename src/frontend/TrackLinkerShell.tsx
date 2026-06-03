import React from 'react';
import {
  Box,
  Stack,
  Inline,
  Heading,
  Text,
  Button,
  Frame,
  SectionMessage,
} from '@forge/react';
import { GeoJsonUploadModal } from './components/GeoJsonUploadModal';
import { CircuitPicker } from './components/CircuitPicker';
import { ViewerMapControls } from './components/ViewerMapControls';
import type { CircuitSummary } from '../types';
import { ViewerStatusLine } from './components/ViewerStatusLine';
import type { ViewerInteractionMode } from './constants/viewer-events';
import { frameSurfaceXcss, trackMetaXcss } from './styles/shell-xcss';

export interface TrackLinkerShellProps {
  pageHeading: string;
  trackLoaded: boolean;
  trackName: string;
  circuits: CircuitSummary[];
  selectedCircuitId: string | undefined;
  onCircuitChange: (circuitId: string) => void;
  catalogLoading?: boolean;
  uploadModalOpen: boolean;
  viewerMode: ViewerInteractionMode;
  viewerStatus: string;
  onOpenUpload: () => void;
  onCloseUpload: () => void;
  onUploadSuccess: () => void;
  onReset: () => void;
  onViewerModeChange: (mode: ViewerInteractionMode) => void;
  showTrackAdminControls?: boolean;
  contextBanner?: React.ReactNode;
  children: React.ReactNode;
}

export const TrackLinkerShell = ({
  pageHeading,
  trackLoaded,
  trackName,
  circuits,
  selectedCircuitId,
  onCircuitChange,
  catalogLoading = false,
  uploadModalOpen,
  viewerMode,
  viewerStatus,
  onOpenUpload,
  onCloseUpload,
  onUploadSuccess,
  onReset,
  onViewerModeChange,
  showTrackAdminControls = true,
  contextBanner,
  children,
}: TrackLinkerShellProps): React.JSX.Element => (
    <Box padding="space.400">
      <Stack space="space.300">
        <Stack space="space.200">
          <Heading size="large">{pageHeading}</Heading>
          {contextBanner}
          <CircuitPicker
            circuits={circuits}
            selectedCircuitId={selectedCircuitId}
            isDisabled={catalogLoading}
            onCircuitChange={onCircuitChange}
          />
          {trackLoaded && trackName && (
            <Box xcss={trackMetaXcss}>
              <Text>Loaded track: {trackName}</Text>
            </Box>
          )}
          {showTrackAdminControls && (
            <Inline space="space.100" alignBlock="center">
              <Button onClick={onOpenUpload} appearance="primary">
                {trackLoaded ? 'Add custom circuit' : 'Upload custom circuit'}
              </Button>
              {trackLoaded && (
                <Button onClick={onReset} appearance="default">
                  Reset view
                </Button>
              )}
            </Inline>
          )}
        </Stack>

        {!trackLoaded && (
          <SectionMessage appearance="warning" title="No track loaded">
            <Text>
              Choose a circuit from the library or upload a custom GeoJSON track to display the map and
              capture brush selections.
            </Text>
          </SectionMessage>
        )}

        <Stack space="space.100">
          <ViewerMapControls
            mode={viewerMode}
            trackLoaded={trackLoaded}
            onModeChange={onViewerModeChange}
          />
          <Box xcss={frameSurfaceXcss}>
            <Frame resource="track-viewer" />
          </Box>
          <ViewerStatusLine status={viewerStatus} />
        </Stack>

        {showTrackAdminControls && (
          <GeoJsonUploadModal
            isOpen={uploadModalOpen}
            onClose={onCloseUpload}
            onSuccess={onUploadSuccess}
          />
        )}

        {children}
      </Stack>
    </Box>
);
