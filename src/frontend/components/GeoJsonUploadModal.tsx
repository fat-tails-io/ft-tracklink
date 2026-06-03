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
} from '@forge/react';
import { invoke, showFlag } from '@forge/bridge';
import type { SaveTrackGeoJsonRequest } from '../../types';

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
        description: 'Please provide both a track name and paste GeoJSON content',
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
        throw new Error('Content does not appear to be valid GeoJSON (should be FeatureCollection or Feature)');
      }

      const request: SaveTrackGeoJsonRequest = {
        geoJsonContent: parsed as object,
        trackName: trackName.trim(),
      };

      await invoke('saveTrackGeoJson', request);

      showFlag({
        id: 'upload-success',
        title: 'GeoJSON uploaded successfully',
        type: 'success',
        appearance: 'success',
        description: `Track "${trackName}" has been uploaded`,
        isAutoDismiss: true,
      });

      // Reset form
      setTrackName('');
      setGeoJsonText('');
      onClose();
      // Call onSuccess after modal closes to reload track
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
            <ModalTitle>Upload Track GeoJSON</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <Stack space="space.300">
              <Stack space="space.100">
                <Text>Track Name</Text>
                <Textfield
                  value={trackName}
                  onChange={(e) =>
                    setTrackName(String((e as { target?: { value?: string } }).target?.value ?? ''))
                  }
                  placeholder="e.g., Silverstone, Monaco, Monza"
                  isDisabled={isLoading}
                />
              </Stack>

              <Stack space="space.100">
                <Text>GeoJSON Content</Text>
                <TextArea
                  name="geojson-content"
                  value={geoJsonText}
                  onChange={(e) =>
                    setGeoJsonText(String((e as { target?: { value?: string } }).target?.value ?? ''))
                  }
                  placeholder='Paste GeoJSON content here, e.g., {"type": "FeatureCollection", "features": [...]}'
                  isDisabled={isLoading}
                  minimumRows={10}
                />
                {geoJsonText && (
                  <Text>
                    {geoJsonText.length} characters
                  </Text>
                )}
              </Stack>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleClose} isDisabled={isLoading}>
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

