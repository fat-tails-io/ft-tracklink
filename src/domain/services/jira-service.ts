import api, { route } from '@forge/api';
import FormData from 'form-data';
import type {
  CreateTrackIssueRequest,
  CreateTrackIssueResponse,
  ThumbnailAttachmentRequest,
} from '../../types';

/**
 * JIRA service for creating issues and managing attachments
 */
export class JiraService {
  /**
   * Create a JIRA issue
   */
  async createIssue(request: CreateTrackIssueRequest): Promise<CreateTrackIssueResponse> {
    const response = await api.asUser().requestJira(route`/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          project: {
            key: request.projectKey,
          },
          summary: request.summary,
          description: request.description
            ? {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: request.description,
                      },
                    ],
                  },
                ],
              }
            : undefined,
          issuetype: {
            name: request.issueType,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create JIRA issue: ${response.status} ${errorText}`);
    }

    const issueData = (await response.json()) as { key: string };
    return {
      issueKey: issueData.key,
      success: true,
    };
  }

  /**
   * Attach thumbnail image to a JIRA issue
   */
  async attachThumbnail(request: ThumbnailAttachmentRequest): Promise<void> {
    // Convert base64 to buffer
    const base64Data = request.thumbnailData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Create form data
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: request.filename || 'track-section-thumbnail.png',
      contentType: 'image/png',
      knownLength: imageBuffer.length,
    });

    const headers = form.getHeaders({
      Accept: 'application/json',
      'X-Atlassian-Token': 'no-check',
    });

    const response = await api.asUser().requestJira(route`/rest/api/3/issue/${request.issueKey}/attachments`, {
      method: 'POST',
      headers,
      body: form as unknown as FormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to attach thumbnail: ${response.status} ${errorText}`);
    }
  }

  /**
   * Get issue details (for validation)
   */
  async getIssue(issueKey: string): Promise<{ key: string; fields: { summary: string } }> {
    const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get JIRA issue: ${response.status} ${errorText}`);
    }

    return (await response.json()) as { key: string; fields: { summary: string } };
  }
}

