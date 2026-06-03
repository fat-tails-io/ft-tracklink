import React, { useState } from 'react';
import {
  Modal,
  ModalTransition,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
  Button,
  Textfield,
  TextArea,
  Stack,
  Text,
  Spinner,
  Label,
  Box,
} from '@forge/react';
import { invoke, showFlag } from '@forge/bridge';
import type { SaveTrackGeoJsonRequest } from '../../types';
import { subtleTextXcss } from '../styles/shell-xcss';

interface GeoJsonUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GeoJsonUploadModal = ({
  isOpen,
  onClose,
  onSuccess,
}: GeoJsonUploadModalProps): React.JSX.Element => {
  const [trackName, setTrackName] = useState<string>('');
  const [geoJsonText, setGeoJsonText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleUpload = async (): Promise<void> => {
    if (!geoJsonText.trim() || !trackName.trim()) {
      showFlag({
        id: 'upload-error',
        title: 'Missing information',
        type: 'error',
        appearance: 'error',
        description: 'Provide both a track name and GeoJSON content.',
        isAutoDismiss: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(geoJsonText.trim()) as unknown;
      } catch {
        throw new Error('Invalid JSON. Please check the format.');
      }

      const geoJsonContent = parsed as { type?: string };
      if (
        !geoJsonContent.type ||
        (geoJsonContent.type !== 'FeatureCollection' && geoJsonContent.type !== 'Feature')
      ) {
        throw new Error('Content must be a GeoJSON FeatureCollection or Feature.');
      }

      const request: SaveTrackGeoJsonRequest = {
        geoJsonContent: parsed as object,
        trackName: trackName.trim(),
      };

      await invoke('saveTrackGeoJson', request);

      showFlag({
        id: 'upload-success',
        title: 'GeoJSON uploaded',
        type: 'success',
        appearance: 'success',
        description: `Track "${trackName}" is ready to load.`,
        isAutoDismiss: true,
      });

      setTrackName('');
      setGeoJsonText('');
      onClose();
      setTimeout(() => {
        onSuccess();
      }, 100);
    } catch (error) {
      console.error('Failed to upload GeoJSON:', error);
      showFlag({
        id: 'upload-error',
        title: 'Upload failed',
        type: 'error',
        appearance: 'error',
        description: error instanceof Error ? error.message : 'Failed to upload GeoJSON',
        isAutoDismiss: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (): void => {
    if (!isLoading) {
      setTrackName('');
      setGeoJsonText('');
      onClose();
    }
  };

  return (
    <ModalTransition>
      {isOpen && (
        <Modal onClose={handleClose}>
          <ModalHeader>
            <ModalTitle>Upload track GeoJSON</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <Stack space="space.300">
              <Stack space="space.100">
                <Label labelFor="upload-track-name">Track name</Label>
                <Textfield
                  id="upload-track-name"
                  value={trackName}
                  onChange={(e) =>
                    setTrackName(String((e as { target?: { value?: string } }).target?.value ?? ''))
                  }
                  placeholder="e.g. Silverstone, Monaco, Monza"
                  isDisabled={isLoading}
                />
              </Stack>

              <Stack space="space.100">
                <Label labelFor="upload-geojson-content">GeoJSON content</Label>
                <TextArea
                  id="upload-geojson-content"
                  name="geojson-content"
                  value={geoJsonText}
                  onChange={(e) =>
                    setGeoJsonText(String((e as { target?: { value?: string } }).target?.value ?? ''))
                  }
                  placeholder='Paste GeoJSON, e.g. {"type": "FeatureCollection", "features": [...]}'
                  isDisabled={isLoading}
                  minimumRows={10}
                />
                {geoJsonText && (
                  <Box xcss={subtleTextXcss}>
                    <Text>{geoJsonText.length} characters</Text>
                  </Box>
                )}
              </Stack>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button appearance="subtle" onClick={handleClose} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleUpload();
              }}
              appearance="primary"
              isDisabled={isLoading || !geoJsonText.trim() || !trackName.trim()}
            >
              {isLoading ? <Spinner size="small" /> : 'Upload'}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};
