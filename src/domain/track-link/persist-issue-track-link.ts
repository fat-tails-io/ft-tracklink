import { JiraService } from '../services/jira-service';
import {
  appendTrackLink,
  getIssueTrackLinks,
  patchTrackLink,
  TrackLinkLimitError,
} from '../../infrastructure/storage/track-link-storage';
import { MAX_TRACK_LINKS_PER_ISSUE } from './constants';
import { buildTrackLinkCommentAdf } from './track-link-comment';
import { selectionToLinkEntry } from './selection-to-link-entry';
import {
  buildCustomFieldValues,
  shouldWriteTrackCustomFields,
} from './build-custom-field-values';
import type {
  LinkSelectionToIssueRequest,
  LinkSelectionToIssueResponse,
  TrackLinkEntry,
} from '../../types';

const jiraService = new JiraService();

export const persistSelectionOnIssue = async (
  request: LinkSelectionToIssueRequest,
): Promise<LinkSelectionToIssueResponse> => {
  const { issueKey } = request;
  if (!issueKey) {
    throw new Error('Missing required field: issueKey');
  }
  if (!request.circuitId || !request.viewport) {
    throw new Error('Missing required fields: circuitId, viewport');
  }

  let entry: TrackLinkEntry;
  try {
    entry = await appendTrackLink(issueKey, selectionToLinkEntry(request));
  } catch (error) {
    if (error instanceof TrackLinkLimitError) {
      throw error;
    }
    throw error;
  }

  const filename = `track-section-${issueKey}-${entry.linkIndex + 1}.png`;

  if (request.thumbnailData) {
    try {
      await jiraService.attachThumbnail({
        issueKey,
        thumbnailData: request.thumbnailData,
        filename,
      });
      await patchTrackLink(issueKey, entry.linkId, { thumbnailFilename: filename });
    } catch (error) {
      console.error('Failed to attach thumbnail:', error);
    }
  }

  try {
    const adf = buildTrackLinkCommentAdf(
      {
        circuitId: entry.circuitId,
        trackRelative: entry.trackRelative,
        geo: entry.geo,
        linkIndex: entry.linkIndex,
      },
      request.circuitDisplayName,
    );
    const commentId = await jiraService.addTrackLinkComment(issueKey, adf);
    if (commentId) {
      entry = (await patchTrackLink(issueKey, entry.linkId, { commentId })) ?? entry;
    }
  } catch (error) {
    console.error('Failed to add track link comment:', error);
  }

  const bundle = await getIssueTrackLinks(issueKey);
  const linkCount = bundle?.links.length ?? entry.linkIndex + 1;
  const latestLink = bundle?.links[linkCount - 1] ?? entry;

  let customFieldsUpdated = false;
  let customFieldsWarning: string | undefined;

  if (latestLink && shouldWriteTrackCustomFields(latestLink.circuitId)) {
    try {
      const fieldValues = buildCustomFieldValues({
        latestLink,
        linkCount,
        circuitDisplayName: request.circuitDisplayName,
      });
      await jiraService.updateTrackCustomFields(issueKey, fieldValues);
      customFieldsUpdated = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      customFieldsWarning = message;
      console.error('Failed to update track custom fields:', error);
    }
  }

  return {
    linkId: entry.linkId,
    linkIndex: entry.linkIndex,
    commentId: entry.commentId,
    linkCount,
    maxLinks: MAX_TRACK_LINKS_PER_ISSUE,
    customFieldsUpdated,
    customFieldsWarning,
  };
};
