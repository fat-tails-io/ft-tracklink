import React, { useState, type ChangeEvent } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textfield,
  Stack,
  Text,
  Spinner,
} from '@forge/react';
import { invoke, showFlag } from '@forge/bridge';
import type { SaveTrackSvgRequest } from '../../types';

interface SvgUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SvgUploadModal = ({
  isOpen,
  onClose,
  onSuccess,
}: SvgUploadModalProps): React.JSX.Element => {
  const [trackName, setTrackName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const inputElement = event.target as HTMLInputElement;
    const selectedFile = inputElement.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.includes('svg') && !selectedFile.name.endsWith('.svg')) {
        showFlag({
          id: 'upload-error',
          title: 'Invalid file type',
          type: 'error',
          appearance: 'error',
          description: 'Please select an SVG file',
          isAutoDismiss: true,
        });
        return;
      }
      setFile(selectedFile);
      // Auto-fill track name if not already set
      if (!trackName) {
        setTrackName(selectedFile.name.replace('.svg', ''));
      }
    }
  };

  const handleUpload = async (): Promise<void> => {
    if (!file || !trackName.trim()) {
      showFlag({
        id: 'upload-error',
        title: 'Missing information',
        type: 'error',
        appearance: 'error',
        description: 'Please provide both a track name and select an SVG file',
        isAutoDismiss: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Read file content as string
      const fileContent = await file.text();

      const request: SaveTrackSvgRequest = {
        svgContent: fileContent,
        trackName: trackName.trim(),
      };

      await invoke('saveTrackSvg', request);

      showFlag({
        id: 'upload-success',
        title: 'SVG uploaded successfully',
        type: 'success',
        appearance: 'success',
        description: `Track "${trackName}" has been uploaded`,
        isAutoDismiss: true,
      });

      // Reset form
      setTrackName('');
      setFile(null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to upload SVG:', error);
      showFlag({
        id: 'upload-error',
        title: 'Upload failed',
        type: 'error',
        appearance: 'error',
        description: error instanceof Error ? error.message : 'Failed to upload SVG file',
        isAutoDismiss: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (): void => {
    if (!isLoading) {
      setTrackName('');
      setFile(null);
      onClose();
    }
  };

  if (!isOpen) {
    return <></>;
  }

  return (
    <Modal onClose={handleClose}>
      <ModalHeader>
        <Text>Upload Track SVG</Text>
      </ModalHeader>
      <ModalBody>
        <Stack space="space.300">
          <Stack space="space.100">
            <Text>Track Name</Text>
            <Textfield
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="e.g., Silverstone, Monaco, Monza"
              isDisabled={isLoading}
            />
          </Stack>

          <Stack space="space.100">
            <Text>SVG File</Text>
            <input
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleFileChange}
              disabled={isLoading}
              style={{ marginTop: '8px' }}
            />
            {file && (
              <Text>
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
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
          onClick={handleUpload}
          appearance="primary"
          isDisabled={isLoading || !file || !trackName.trim()}
        >
          {isLoading ? <Spinner size="small" /> : 'Upload'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

