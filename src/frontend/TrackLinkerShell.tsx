import React from 'react';
import { Box, Stack, Inline, Heading, Text, Button, Frame } from '@forge/react';
import { GeoJsonUploadModal } from './components/GeoJsonUploadModal';

const frameContainerXcss = {
  width: '100%',
  height: '600px',
  borderWidth: 'border.width',
  borderStyle: 'solid',
  borderColor: 'color.border',
  borderRadius: 'border.radius',
} as const;

export interface TrackLinkerShellProps {
  title: string;
  trackLoaded: boolean;
  trackName: string;
  uploadModalOpen: boolean;
  onOpenUpload: () => void;
  onCloseUpload: () => void;
  onUploadSuccess: () => void;
  onReset: () => void;
  showTrackAdminControls?: boolean;
  contextBanner?: React.ReactNode;
  children: React.ReactNode;
}

export const TrackLinkerShell = ({
  title,
  trackLoaded,
  trackName,
  uploadModalOpen,
  onOpenUpload,
  onCloseUpload,
  onUploadSuccess,
  onReset,
  showTrackAdminControls = true,
  contextBanner,
  children,
}: TrackLinkerShellProps): React.JSX.Element => (
  <Box padding="space.400">
    <Stack space="space.300">
      <Stack space="space.200">
        <Heading as="h1">{title}</Heading>
        {contextBanner}
        {trackLoaded && trackName && <Text>Track: {trackName}</Text>}
        {showTrackAdminControls && (
          <Inline space="space.100">
            <Button onClick={onOpenUpload} appearance="primary">
              {trackLoaded ? 'Replace Track' : 'Upload Track GeoJSON'}
            </Button>
            {trackLoaded && (
              <Button onClick={onReset} appearance="default">
                Reset View
              </Button>
            )}
          </Inline>
        )}
      </Stack>

      {!trackLoaded && (
        <Box padding="space.200" backgroundColor="color.background.warning">
          <Text>No track loaded. Please upload a track GeoJSON file.</Text>
        </Box>
      )}

      <Box xcss={frameContainerXcss}>
        <Frame resource="track-viewer" />
      </Box>

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
