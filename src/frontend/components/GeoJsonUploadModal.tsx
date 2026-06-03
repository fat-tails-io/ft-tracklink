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
import { slugifyCircuitId } from '../utils/circuit-id';

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
  const [circuitId, setCircuitId] = useState<string>('');
  const [geoJsonText, setGeoJsonText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleUpload = async (): Promise<void> => {
    const resolvedCircuitId = (circuitId.trim() || slugifyCircuitId(trackName)).trim();

    if (!geoJsonText.trim() || !trackName.trim() || !resolvedCircuitId) {
      showFlag({
        id: 'upload-error',
        title: 'Missing information',
        type: 'error',
        appearance: 'error',
        description: 'Provide a track name, circuit id, and GeoJSON content.',
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
        circuitId: resolvedCircuitId,
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
      setCircuitId('');
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
      setCircuitId('');
      setGeoJsonText('');
      onClose();
    }
  };

  return (
    <ModalTransition>
      {isOpen && (
        <Modal onClose={handleClose}>
          <ModalHeader>
            <ModalTitle>Add custom circuit</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <Stack space="space.300">
              <Stack space="space.100">
                <Label labelFor="upload-track-name">Circuit name</Label>
                <Textfield
                  id="upload-track-name"
                  value={trackName}
                  onChange={(e) => {
                    const next = String((e as { target?: { value?: string } }).target?.value ?? '');
                    setTrackName(next);
                    if (!circuitId.trim() && next.trim()) {
                      setCircuitId(slugifyCircuitId(next));
                    }
                  }}
                  placeholder="e.g. Silverstone Circuit"
                  isDisabled={isLoading}
                />
              </Stack>

              <Stack space="space.100">
                <Label labelFor="upload-circuit-id">Circuit id</Label>
                <Textfield
                  id="upload-circuit-id"
                  value={circuitId}
                  onChange={(e) =>
                    setCircuitId(String((e as { target?: { value?: string } }).target?.value ?? ''))
                  }
                  placeholder="e.g. gb-1948"
                  isDisabled={isLoading}
                />
                <Box xcss={subtleTextXcss}>
                  <Text>Lowercase id used in storage (track-geojson-{'{id}'}).</Text>
                </Box>
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
