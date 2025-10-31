import Resolver from '@forge/resolver';
import { JiraService } from '../domain/services/jira-service';
import {
  storeTrackLink,
  getTrackLink,
  saveTrackSvg,
  getTrackSvg,
  saveTrackGeoJson,
  getTrackGeoJson,
  saveTheme,
  getTheme,
} from '../infrastructure/storage/track-link-storage';
import type {
  CreateTrackIssueRequest,
  CreateTrackIssueResponse,
  ThumbnailAttachmentRequest,
  SaveTrackSvgRequest,
  GetTrackSvgResponse,
  SaveTrackGeoJsonRequest,
  GetTrackGeoJsonResponse,
  SaveThemeRequest,
  TrackLink,
} from '../types';

// Resolver request type based on Forge documentation
type ResolverRequest<T = unknown> = {
  payload?: T;
  context?: Record<string, unknown>;
};

const resolver = new Resolver();
const jiraService = new JiraService();

/**
 * Create JIRA issue with track section metadata
 */
resolver.define('createTrackIssue', async (req: ResolverRequest<CreateTrackIssueRequest>): Promise<CreateTrackIssueResponse> => {
  const payload = req.payload as CreateTrackIssueRequest;

  if (!payload.summary || !payload.projectKey || !payload.issueType) {
    throw new Error('Missing required fields: summary, projectKey, issueType');
  }

  // Create the JIRA issue
  const issueResponse = await jiraService.createIssue(payload);

  // Attach thumbnail if provided
  if (payload.thumbnailData) {
    try {
      await jiraService.attachThumbnail({
        issueKey: issueResponse.issueKey,
        thumbnailData: payload.thumbnailData,
        filename: `track-section-${issueResponse.issueKey}.png`,
      });
    } catch (error) {
      console.error('Failed to attach thumbnail:', error);
      // Continue even if thumbnail attachment fails
    }
  }

  // Store track link metadata
  await storeTrackLink(issueResponse.issueKey, {
    viewport: payload.viewport,
    svgSectionId: payload.svgSectionId,
  });

  return issueResponse;
});

/**
 * Attach thumbnail to existing issue
 */
resolver.define('attachTrackThumbnail', async (req: ResolverRequest<ThumbnailAttachmentRequest>): Promise<void> => {
  const payload = req.payload as ThumbnailAttachmentRequest;

  if (!payload.issueKey || !payload.thumbnailData) {
    throw new Error('Missing required fields: issueKey, thumbnailData');
  }

  await jiraService.attachThumbnail(payload);
});

/**
 * Store track link metadata
 */
resolver.define('storeTrackLink', async (req: ResolverRequest<{ issueKey: string; viewport: TrackLink['viewport']; svgSectionId?: string }>): Promise<void> => {
  const payload = req.payload as { issueKey: string; viewport: TrackLink['viewport']; svgSectionId?: string };

  if (!payload.issueKey || !payload.viewport) {
    throw new Error('Missing required fields: issueKey, viewport');
  }

  await storeTrackLink(payload.issueKey, {
    viewport: payload.viewport,
    svgSectionId: payload.svgSectionId,
  });
});

/**
 * Get track link for a specific issue
 */
resolver.define('getTrackLink', async (req: ResolverRequest<{ issueKey: string }>): Promise<TrackLink | null> => {
  const payload = req.payload as { issueKey: string };

  if (!payload.issueKey) {
    throw new Error('Missing required field: issueKey');
  }

  return await getTrackLink(payload.issueKey);
});

/**
 * Get track SVG from storage
 */
resolver.define('getTrackSvg', async (req?: ResolverRequest<{ trackId?: string }>): Promise<GetTrackSvgResponse | null> => {
  const payload = req?.payload as { trackId?: string } | undefined;
  const trackSvg = await getTrackSvg(payload?.trackId);

  if (!trackSvg) {
    return null;
  }

  return {
    svgContent: trackSvg.svgContent,
    trackName: trackSvg.trackName,
    uploadedAt: trackSvg.uploadedAt,
  };
});

/**
 * Save track SVG to storage
 */
resolver.define('saveTrackSvg', async (req: ResolverRequest<SaveTrackSvgRequest>): Promise<void> => {
  const payload = req.payload as SaveTrackSvgRequest;

  if (!payload.svgContent || !payload.trackName) {
    throw new Error('Missing required fields: svgContent, trackName');
  }

  await saveTrackSvg(payload);
});

/**
 * Get theme configuration
 */
resolver.define('getTheme', async (req?: ResolverRequest<{ userId?: string }>): Promise<{ primaryColor: string; secondaryColor: string; accentColor: string; teamName?: string } | null> => {
  const payload = req?.payload as { userId?: string } | undefined;
  const theme = await getTheme(payload?.userId);

  return theme;
});

/**
 * Get track GeoJSON from storage
 */
resolver.define('getTrackGeoJson', async (req?: ResolverRequest<{ trackId?: string }>): Promise<GetTrackGeoJsonResponse | null> => {
  const payload = req?.payload as { trackId?: string } | undefined;
  const trackGeoJson = await getTrackGeoJson(payload?.trackId);

  if (!trackGeoJson) {
    return null;
  }

  return {
    geoJsonContent: trackGeoJson.geoJsonContent,
    trackName: trackGeoJson.trackName,
    uploadedAt: trackGeoJson.uploadedAt,
  };
});

/**
 * Save track GeoJSON to storage
 */
resolver.define('saveTrackGeoJson', async (req: ResolverRequest<SaveTrackGeoJsonRequest>): Promise<void> => {
  const payload = req.payload as SaveTrackGeoJsonRequest;

  if (!payload.geoJsonContent || !payload.trackName) {
    throw new Error('Missing required fields: geoJsonContent, trackName');
  }

  await saveTrackGeoJson(payload);
});

/**
 * Save theme configuration
 */
resolver.define('saveTheme', async (req: ResolverRequest<SaveThemeRequest>): Promise<void> => {
  const payload = req.payload as SaveThemeRequest;

  if (!payload.theme) {
    throw new Error('Missing required field: theme');
  }

  await saveTheme(payload);
});

export const handler = resolver.getDefinitions();

