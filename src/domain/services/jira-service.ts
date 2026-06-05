import api, { route } from '@forge/api';
import FormData from 'form-data';
import type {
  CreateTrackIssueRequest,
  CreateTrackIssueResponse,
  ThumbnailAttachmentRequest,
} from '../../types';
import type { TrackCustomFieldValues } from '../track-link/build-custom-field-values';
import {
  TRACK_CIRCUIT_FIELD_KEY,
  TRACK_LINKS_FIELD_KEY,
  TRACK_SEGMENT_FIELD_KEY,
} from '../track-link/build-custom-field-values';
import {
  type JiraFieldDefinition,
  resolveFieldIdOrKey,
} from '../track-link/resolve-forge-field-id';

/**
 * JIRA service for creating issues and managing attachments
 */
export class JiraService {
  private jiraFieldCatalog: JiraFieldDefinition[] | null = null;

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
      body: form as unknown as NonNullable<Parameters<ReturnType<typeof api.asUser>['requestJira']>[1]>['body'],
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to attach thumbnail: ${response.status} ${errorText}`);
    }
  }

  /**
   * Get issue details (for validation)
   */
  async addTrackLinkComment(
    issueKey: string,
    adfBody: { type: 'doc'; version: 1; content: object[] },
  ): Promise<string | undefined> {
    const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        body: adfBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add Jira comment: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as { id?: string };
    return data.id;
  }

  async createSubtaskIssue(params: {
    parentIssueKey: string;
    projectKey: string;
    summary: string;
    descriptionAdf?: { type: 'doc'; version: 1; content: object[] };
  }): Promise<CreateTrackIssueResponse> {
    const response = await api.asUser().requestJira(route`/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          project: { key: params.projectKey },
          parent: { key: params.parentIssueKey },
          summary: params.summary,
          issuetype: { name: 'Subtask' },
          description: params.descriptionAdf,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create subtask: ${response.status} ${errorText}`);
    }

    const issueData = (await response.json()) as { key: string };
    return {
      issueKey: issueData.key,
      success: true,
    };
  }

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

  async getIssueNumericId(issueKey: string): Promise<number> {
    const response = await api.asUser().requestJira(
      route`/rest/api/3/issue/${issueKey}?fields=id`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get JIRA issue id: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as { id: string | number };
    const issueId = typeof data.id === 'number' ? data.id : parseInt(String(data.id), 10);
    if (!Number.isFinite(issueId)) {
      throw new Error(`Invalid JIRA issue id for ${issueKey}`);
    }
    return issueId;
  }

  private async loadJiraFieldCatalog(): Promise<JiraFieldDefinition[]> {
    if (this.jiraFieldCatalog) {
      return this.jiraFieldCatalog;
    }

    const response = await api.asApp().requestJira(route`/rest/api/3/field`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list Jira fields: ${response.status} ${errorText}`);
    }

    this.jiraFieldCatalog = (await response.json()) as JiraFieldDefinition[];
    return this.jiraFieldCatalog;
  }

  async updateTrackCustomFields(
    issueKey: string,
    values: TrackCustomFieldValues,
  ): Promise<void> {
    const issueId = await this.getIssueNumericId(issueKey);
    const fields = await this.loadJiraFieldCatalog();

    const updates = [
      { moduleKey: TRACK_CIRCUIT_FIELD_KEY, value: values.circuit },
      { moduleKey: TRACK_SEGMENT_FIELD_KEY, value: values.segment },
      { moduleKey: TRACK_LINKS_FIELD_KEY, value: values.linksSummary },
    ].map((entry) => ({
      customField: resolveFieldIdOrKey(fields, entry.moduleKey),
      issueIds: [issueId],
      value: entry.value,
    }));

    const response = await api.asApp().requestJira(route`/rest/api/3/app/field/value`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update track custom fields: ${response.status} ${errorText}`);
    }
  }
}

