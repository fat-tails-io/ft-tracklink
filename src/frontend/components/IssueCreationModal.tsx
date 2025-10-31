import React, { useState } from 'react';
import { Modal, Button, Textfield, TextArea, Form, Stack, Spinner, Text } from '@forge/react';
import { invoke, showFlag } from '@forge/bridge';
import type { CreateTrackIssueRequest } from '../../types';

export interface IssueCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  };
  thumbnailData: string;
  svgSectionId?: string;
}

export const IssueCreationModal = ({
  isOpen,
  onClose,
  viewport,
  thumbnailData,
  svgSectionId,
}) => {
  const [summary, setSummary] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [projectKey, setProjectKey] = useState<string>('');
  const [issueType, setIssueType] = useState<string>('Task');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      const request: CreateTrackIssueRequest = {
        summary,
        description,
        projectKey,
        issueType,
        viewport,
        thumbnailData,
        svgSectionId,
      };

      const response = await invoke<{ issueKey: string; success: boolean }>('createTrackIssue', request);

      if (response.success) {
        showFlag({
          id: 'issue-created',
          title: 'Issue Created',
          type: 'success',
          description: `Issue ${response.issueKey} created successfully with track section link.`,
        });
        onClose();
        // Reset form
        setSummary('');
        setDescription('');
        setProjectKey('');
        setIssueType('Task');
      }
    } catch (error) {
      console.error('Failed to create issue:', error);
      showFlag({
        id: 'issue-error',
        title: 'Error',
        type: 'error',
        description: error instanceof Error ? error.message : 'Failed to create issue',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return <></>;
  }

  return (
    <Modal>
      <Form onSubmit={() => { handleSubmit(); }}>
        <Stack space="space.300">
          <h2>Create JIRA Issue from Track Section</h2>

          <Stack space="space.200">
            <Text>Summary</Text>
            <Textfield
              name="summary"
              value={summary}
              onChange={(e) => setSummary(String((e as { target?: { value?: string } }).target?.value ?? ''))}
              isRequired
            />
          </Stack>

          <Stack space="space.200">
            <Text>Project Key</Text>
            <Textfield
              name="projectKey"
              value={projectKey}
              onChange={(e) => setProjectKey(String((e as { target?: { value?: string } }).target?.value ?? ''))}
              isRequired
            />
          </Stack>

          <Stack space="space.200">
            <Text>Issue Type</Text>
            <Textfield
              name="issueType"
              value={issueType}
              onChange={(e) => setIssueType(String((e as { target?: { value?: string } }).target?.value ?? ''))}
              isRequired
            />
          </Stack>

          <Stack space="space.200">
            <Text>Description</Text>
            <TextArea
              name="description"
              value={description}
              onChange={(e) => setDescription(String((e as { target?: { value?: string } }).target?.value ?? ''))}
            />
          </Stack>

          <Stack space="space.200">
            <Button type="submit" appearance="primary" isDisabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : 'Create Issue'}
            </Button>
            <Button appearance="subtle" onClick={onClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Form>
    </Modal>
  );
};

