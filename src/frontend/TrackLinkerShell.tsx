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
import { ViewerMapControls } from './components/ViewerMapControls';
import { ViewerStatusLine } from './components/ViewerStatusLine';
import type { ViewerInteractionMode } from './constants/viewer-events';
import { frameSurfaceXcss, trackMetaXcss } from './styles/shell-xcss';

export interface TrackLinkerShellProps {
  pageHeading: string;
  trackLoaded: boolean;
  trackName: string;
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
          {trackLoaded && trackName && (
            <Box xcss={trackMetaXcss}>
              <Text>Loaded track: {trackName}</Text>
            </Box>
          )}
          {showTrackAdminControls && (
            <Inline space="space.100" alignBlock="center">
              <Button onClick={onOpenUpload} appearance="primary">
                {trackLoaded ? 'Replace track' : 'Upload track GeoJSON'}
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
            <Text>Upload a GeoJSON circuit file to display the map and capture brush selections.</Text>
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
